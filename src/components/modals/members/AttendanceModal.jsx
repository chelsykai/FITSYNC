import { useEffect, useState, useMemo } from "react";
import styles from "../Modal.module.css";
import { fetchAttendanceForMembersMonth } from "../../../services/attendanceService";
// ReAuthModal removed: export runs directly from the button click

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const DAY_ABBR = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

export default function AttendanceModal({ members = [], onClose }) {
  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [year,          setYear]          = useState(now.getFullYear());
  const [month,         setMonth]         = useState(now.getMonth() + 1);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [timeMap,       setTimeMap]       = useState({});
  const [daysInMonth,   setDaysInMonth]   = useState(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
  const [error,         setError]         = useState(null);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("All");
  const [dropYear,      setDropYear]      = useState(false);

  const exportAttendance = () => {
    // TODO: replace with real CSV export implementation
    alert("Attendance export triggered.");
  };

  useEffect(() => {
    let mounted = true;
    setError(null);
    const load = async () => {
      try {
        const ids = members.map((m) => m.member_id || m.memberId || m.id).filter(Boolean);
        const res = await fetchAttendanceForMembersMonth(ids, year, month);
        if (!mounted) return;
        setAttendanceMap(res.attendanceMap || {});
        setTimeMap(res.timeMap || {});
        setDaysInMonth(res.daysInMonth || new Date(year, month, 0).getDate());
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Failed to load attendance");
      }
    };
    load();
    return () => { mounted = false; };
  }, [members, year, month]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const memberStats = useMemo(() => {
    return members.map((m) => {
      const id       = m.member_id || m.memberId || m.id || "unknown";
      const attended = attendanceMap[id] || new Set();
      const pastDays = days.filter((d) => new Date(year, month - 1, d) <= todayStart);
      const presentCt = pastDays.filter((d) => attended.has(d)).length;
      const absentCt  = pastDays.length - presentCt;
      const pct       = pastDays.length ? Math.round((presentCt / pastDays.length) * 100) : 0;
      return { id, presentCt, absentCt, pct };
    });
  }, [members, attendanceMap, days, year, month]);

  const colTotals = useMemo(() => {
    return days.map((d) => {
      const cellDate = new Date(year, month - 1, d);
      if (cellDate > todayStart) return null;
      let p = 0;
      members.forEach((m) => {
        const id = m.member_id || m.memberId || m.id || "unknown";
        if ((attendanceMap[id] || new Set()).has(d)) p++;
      });
      return { p, a: members.length - p };
    });
  }, [members, attendanceMap, days, year, month]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const name = (m.full_name || m.name || "").toLowerCase();
      const id   = m.member_id || m.memberId || m.id || "unknown";
      const stat = memberStats.find((s) => s.id === id);
      if (search && !name.includes(search.toLowerCase())) return false;
      if (statusFilter === "Present" && stat?.presentCt === 0) return false;
      if (statusFilter === "Absent"  && stat?.absentCt  === 0) return false;
      return true;
    });
  }, [members, memberStats, search, statusFilter]);

  const yearOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.attendanceModal} onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className={styles.attendanceHeader}>
          <div className={styles.attendanceControls}>
            <button className={styles.navButton} onClick={prevMonth}>← Prev</button>
            <div style={{ position: "relative" }}>
              <span
                className={styles.monthLabel}
                onClick={() => setDropYear((v) => !v)}
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                {MONTH_NAMES[month - 1].toUpperCase()} {year} ▾
              </span>
              {dropYear && (
                <div className={styles.yearDropdown}>
                  {yearOptions.map((y) => (
                    <button key={y} className={styles.yearOption}
                      onClick={() => { setYear(y); setDropYear(false); }}>
                      {y}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className={styles.navButton} onClick={nextMonth}>Next →</button>
          </div>

          {/* Legend */}
          <div className={styles.attendanceLegend}>
            <span className={styles.legendItem}>
              <span className={`${styles.attDot} ${styles.present}`}><span className={styles.dotIcon}>✓</span></span> Present
            </span>
            <span className={styles.legendSep}>|</span>
            <span className={styles.legendItem}>
              <span className={`${styles.attDot} ${styles.absent}`}><span className={styles.dotIcon}>✕</span></span> Absent
            </span>
            <span className={styles.legendSep}>|</span>
            <span className={styles.legendItem}>
              <span className={`${styles.attDot} ${styles.future}`} /> Pending Record
            </span>
          </div>

          <button className={styles.navButton} onClick={onClose}>✕ Close</button>
        </div>

        {/* ── Filters ── */}
        <div className={styles.attendanceFilters}>
          <div className={styles.attendanceSearch}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search Member..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.attendanceSearchInput}
            />
          </div>
          {/* <select className={styles.filterSelect} value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}>
            {["All","Present","Absent"].map((s) => (
              <option key={s} value={s}>Status: {s}</option>
            ))}
          </select> */}
        </div>

        {error && (
          <div style={{ color:"#d32f2f", padding:"8px 20px", background:"#ffebee", fontSize:13 }}>
            {error}
          </div>
        )}

        {/* ── Table ── */}
        <div className={styles.attendanceBody}>
          <table className={styles.attendanceTable}>
            <thead>
              <tr>
                <th className={styles.attendanceAvatarTh}></th>
                <th className={styles.attendanceNameTh}>NAME</th>
                <th className={styles.attendanceStatusTh}>STATUS SUMMARY</th>
                {days.map((d) => {
                  const dow      = DAY_ABBR[new Date(year, month - 1, d).getDay()];
                  const isWeekend = dow === "SAT" || dow === "SUN";
                  return (
                    <th key={d} className={styles.dayCell}
                      style={{ background: isWeekend ? "#5a9e38" : undefined }}>
                      <div style={{ fontSize: 9, opacity: 0.8, fontWeight: 600 }}>{dow}</div>
                      <div>{String(d).padStart(2, "0")}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((m) => {
                const id       = m.member_id || m.memberId || m.id || "unknown";
                const attended = attendanceMap[id] || new Set();
                const stat     = memberStats.find((s) => s.id === id) || {};
                return (
                  <tr key={id}>
                    <td className={styles.attendanceAvatarTd}>
                      <div className={styles.memberAvatar}>
                        {(m.full_name || m.name || "?")[0].toUpperCase()}
                      </div>
                    </td>
                    <td className={styles.attendanceNameTd}>
                      {m.full_name || m.name || id}
                    </td>
                    <td className={styles.attendanceStatusTd}>
                      <span className={styles.statusSummaryBadge}>
                        [{stat.pct ?? 0} P | {stat.absentCt ?? 0} A]
                      </span>
                    </td>
                    {days.map((d) => {
                      const cellDate  = new Date(year, month - 1, d);
                      const isFuture  = cellDate > todayStart;
                      const isPresent = attended.has(d);
                      const time      = timeMap[id]?.[d] || "";
                      const dotClass  = isFuture ? styles.future : isPresent ? styles.present : styles.absent;
                      return (
                        <td key={d} className={styles.dayTd}>
                          <span
                            className={`${styles.attDot} ${dotClass}`}
                            data-time={!isFuture && isPresent && time ? time : undefined}
                            title={isFuture ? "" : isPresent && time ? `Attended at ${time}` : ""}
                          >
                            {!isFuture && (
                              <span className={styles.dotIcon}>
                                {isPresent ? "✓" : "✕"}
                              </span>
                            )}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Totals row */}
              <tr className={styles.totalsRow}>
                <td className={styles.attendanceAvatarTd}></td>
                <td className={styles.attendanceNameTd} style={{ fontWeight: 800 }}>Totals</td>
                <td className={styles.attendanceStatusTd}></td>
                {colTotals.map((t, i) => (
                  <td key={i} className={styles.dayTd}>
                    {t ? (
                      <div className={styles.totalCell}>
                        <span style={{ color:"#4a9e4a", fontSize:10, fontWeight:700 }}>P:{t.p}</span>
                        <span style={{ color:"#e05050", fontSize:10, fontWeight:700 }}>A:{t.a}</span>
                      </div>
                    ) : (
                      <span style={{ color:"#bbb", fontSize:13 }}>—</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 
