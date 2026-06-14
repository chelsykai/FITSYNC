import { useEffect, useState, useMemo } from "react";
import styles from "../Modal.module.css";
import { fetchAttendanceForMembersMonth } from "../../../services/attendanceService";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_ABBR = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const DAYS_PER_PAGE = 10;

function getMemberId(m)   { return m.member_id || m.memberId || m.id || "unknown"; }
function getMemberName(m) { return m.full_name || m.name || getMemberId(m); }
function getInitial(m)    { return (getMemberName(m)[0] || "?").toUpperCase(); }

export default function AttendanceModal({ members = [], onClose }) {
  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [year,          setYear]          = useState(now.getFullYear());
  const [month,         setMonth]         = useState(now.getMonth() + 1);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [timeMap,       setTimeMap]       = useState({});
  const [daysInMonth,   setDaysInMonth]   = useState(
    new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  );
  const [error,         setError]         = useState(null);
  const [search,        setSearch]        = useState("");
  const [showMonthDrop, setShowMonthDrop] = useState(false);
  const [page,          setPage]          = useState(0);
  const [attFilter,     setAttFilter]     = useState("all"); 

  useEffect(() => {
    let mounted = true;
    setError(null);
    const load = async () => {
      try {
        const ids = members.map(getMemberId).filter(Boolean);
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

  useEffect(() => { setPage(0); }, [year, month]);

  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );
  const totalPages = Math.ceil(days.length / DAYS_PER_PAGE);
  const pageDays   = days.slice(page * DAYS_PER_PAGE, (page + 1) * DAYS_PER_PAGE);

  const memberStats = useMemo(() => {
    return members.map((m) => {
      const id        = getMemberId(m);
      const attended  = attendanceMap[id] || new Set();
      const pastDays  = days.filter((d) => new Date(year, month - 1, d) <= todayStart);
      const presentCt = pastDays.filter((d) => attended.has(d)).length;
      const absentCt  = pastDays.length - presentCt;
      return { id, presentCt, absentCt };
    });
  }, [members, attendanceMap, days, year, month]);

  const colTotals = useMemo(() => {
    return pageDays.map((d) => {
      const cellDate = new Date(year, month - 1, d);
      if (cellDate > todayStart) return null;
      let p = 0;
      members.forEach((m) => {
        if ((attendanceMap[getMemberId(m)] || new Set()).has(d)) p++;
      });
      return { p, a: members.length - p };
    });
  }, [members, attendanceMap, pageDays, year, month]);

  const filteredMembers = useMemo(() => {
    let result = members;
    
    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((m) => getMemberName(m).toLowerCase().includes(q));
    }
    
    // Filter by attendance type - only today
    if (attFilter !== "all") {
      // Check if we're viewing the current month
      const today = new Date();
      const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
      
      if (isCurrentMonth) {
        const todayDate = today.getDate();
        result = result.filter((m) => {
          const id = getMemberId(m);
          const attended = attendanceMap[id] || new Set();
          const isPresentToday = attended.has(todayDate);
          
          if (attFilter === "present") return isPresentToday;
          if (attFilter === "absent") return !isPresentToday;
          return true;
        });
      }
    }
    
    return result;
  }, [members, search, attFilter, attendanceMap, year, month]);

  const exportAttendance = () => {
    const headers = ["Member Name", "Member ID", "Present", "Absent"];
    const rows = filteredMembers.map((m) => {
      const id = getMemberId(m);
      const stat = memberStats.find((s) => s.id === id) || { presentCt: 0, absentCt: 0 };
      return [
        getMemberName(m),
        id,
        stat.presentCt,
        stat.absentCt,
      ];
    });

    const csv = [
      `Attendance Report - ${MONTH_NAMES[month - 1]} ${year}`,
      "",
      headers.join(","),
      ...rows.map((r) => r.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_${MONTH_NAMES[month - 1].toLowerCase()}_${year}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const yearOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.attendanceModal} onClick={(e) => e.stopPropagation()}>

        {/* ══ GREEN HEADER BANNER ══ */}
        <div className={styles.attBanner}>
          {/* Close — top right */}
          <button className={styles.attBannerClose} onClick={onClose}>
            <i className="ti ti-x" /> Close
          </button>

          {/* Centered title */}
          <div className={styles.attBannerTitle}>Attendance Records</div>
          <div className={styles.attBannerSub}>Track member attendance daily.</div>

          {/* Legend pill row — centered */}
          <div className={styles.attBannerLegend}>
            <span className={styles.attLegendPill}>
              <span className={`${styles.attDotPresent} ${styles.attDotLegend}`}><i className="ti ti-check" /></span>
              Present
            </span>
            <span className={styles.attLegendPill}>
              <span className={`${styles.attDotAbsent} ${styles.attDotLegend}`}><i className="ti ti-x" /></span>
              Absent
            </span>
            <span className={styles.attLegendPill}>
              <span className={`${styles.attDotFuture} ${styles.attDotLegend}`} />
              Pending Record
            </span>
          </div>
        </div>

        {/* ══ WHITE BODY ══ */}
        <div className={styles.attBody}>

          {/* Toolbar: search left | filter + export center | month nav right */}
          <div className={styles.attendanceToolbar}>
            <div className={styles.attendanceSearch}>
              <i className={`ti ti-search ${styles.attendanceSearchIcon}`} />
              <input
                className={styles.attendanceSearchInput}
                type="text"
                placeholder="Search member..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button
                className={`${styles.attFilterBtn} ${attFilter === "all" ? styles.attFilterBtnActive : ""}`}
                onClick={() => setAttFilter("all")}
              >
                All
              </button>
              <button
                className={`${styles.attFilterBtn} ${attFilter === "present" ? styles.attFilterBtnActive : ""}`}
                onClick={() => setAttFilter("present")}
              >
                Present
              </button>
              <button
                className={`${styles.attFilterBtn} ${attFilter === "absent" ? styles.attFilterBtnActive : ""}`}
                onClick={() => setAttFilter("absent")}
              >
                Absent
              </button>
              <button
                className={styles.attExportBtn}
                onClick={exportAttendance}
                title="Export to CSV"
              >
                <i className="ti ti-download" /> Export
              </button>
            </div>

            <div className={styles.attendanceNavGroup}>
              <button className={styles.attendanceNavBtn} onClick={prevMonth}>
                <i className="ti ti-chevron-left" />
              </button>

              <div style={{ position: "relative" }}>
                <button
                  className={styles.attendanceMonthBtn}
                  onClick={() => setShowMonthDrop((v) => !v)}
                >
                  {MONTH_NAMES[month - 1].toUpperCase().slice(0, 3)} {year}
                  <i className="ti ti-chevron-down" style={{ fontSize: 11 }} />
                </button>

                {showMonthDrop && (
                  <div className={styles.attendanceMonthDrop}>
                    {yearOptions.map((y) => (
                      <div key={y} className={styles.attendanceMonthDropYear}>
                        <div className={styles.attendanceMonthDropYearLabel}>{y}</div>
                        <div className={styles.attendanceMonthDropGrid}>
                          {MONTH_NAMES.map((mn, idx) => {
                            const sel = y === year && idx + 1 === month;
                            return (
                              <button
                                key={mn}
                                className={`${styles.attendanceMonthOption} ${sel ? styles.attendanceMonthOptionActive : ""}`}
                                onClick={() => { setYear(y); setMonth(idx + 1); setShowMonthDrop(false); }}
                              >
                                {mn.slice(0, 3)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button className={styles.attendanceNavBtn} onClick={nextMonth}>
                <i className="ti ti-chevron-right" />
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.attendanceError}>
              <i className="ti ti-alert-circle" /> {error}
            </div>
          )}

          {/* Table */}
          <div className={styles.attendanceTableWrap}>
            <table className={styles.attendanceTable}>
              <thead>
                <tr>
                  <th className={`${styles.attThAvatar} ${styles.attThAvatarHeader}`}></th>
                  <th className={styles.attThName}>Member</th>
                  <th className={styles.attThSummary}>Status Summary</th>
                  {pageDays.map((d) => {
                    const dow       = DAY_ABBR[new Date(year, month - 1, d).getDay()];
                    const isWeekend = dow === "SAT" || dow === "SUN";
                    return (
                      <th
                        key={d}
                        className={`${styles.attThDay} ${isWeekend ? styles.attThDayWeekend : ""}`}
                      >
                        <div className={styles.attDayAbbr}>{dow.slice(0, 2)}</div>
                        <div>{String(d).padStart(2, "0")}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {filteredMembers.map((m) => {
                  const id       = getMemberId(m);
                  const attended = attendanceMap[id] || new Set();
                  const stat     = memberStats.find((s) => s.id === id) || { presentCt: 0, absentCt: 0 };
                  return (
                    <tr key={id} className={styles.attRow}>
                      <td className={styles.attTdAvatar}>
                        <div className={styles.attAvatar}>{getInitial(m)}</div>
                      </td>
                      <td className={styles.attTdName}>{getMemberName(m)}</td>
                      <td className={styles.attTdSummary}>
                        <span className={styles.attSummaryPresent}>{stat.presentCt} Present</span>
                        <span className={styles.attSummaryAbsent}>{stat.absentCt} Absent</span>
                      </td>
                      {pageDays.map((d) => {
                        const cellDate  = new Date(year, month - 1, d);
                        const isFuture  = cellDate > todayStart;
                        const isPresent = attended.has(d);
                        const time      = timeMap[id]?.[d] || "";
                        return (
                          <td
                            key={d}
                            className={styles.attTdDay}
                            title={!isFuture && isPresent && time ? `Attended at ${time}` : ""}
                          >
                            {isFuture ? (
                              <span className={styles.attDotFuture} />
                            ) : isPresent ? (
                              <span className={styles.attDotPresent}>
                                <i className="ti ti-check" />
                              </span>
                            ) : (
                              <span className={styles.attDotAbsent}>
                                <i className="ti ti-x" />
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Daily Totals */}
                <tr className={styles.attTotalsRow}>
                  <td className={styles.attTdAvatar} />
                  <td className={styles.attTdName} style={{ fontWeight: 800 }}>Daily Totals</td>
                  <td className={styles.attTdSummary} />
                  {colTotals.map((t, i) => (
                    <td key={i} className={styles.attTdDay}>
                      {t ? (
                        <div className={styles.attTotalCell}>
                          <span className={styles.attTotalP}>P:{t.p}</span>
                          <span className={styles.attTotalA}>A:{t.a}</span>
                        </div>
                      ) : (
                        <span className={styles.attFutureDash}>—</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={styles.attendancePagination}>
            <button className={styles.attPageBtn} onClick={() => setPage(0)} disabled={page === 0}>«</button>
            <button className={styles.attPageBtn} onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>‹</button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`${styles.attPageBtn} ${i === page ? styles.attPageBtnActive : ""}`}
                onClick={() => setPage(i)}
              >
                {i + 1}
              </button>
            ))}

            <button className={styles.attPageBtn} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>›</button>
            <button className={styles.attPageBtn} onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1}>»</button>

            <span className={styles.attPageInfo}>
              Days {page * DAYS_PER_PAGE + 1}–{Math.min((page + 1) * DAYS_PER_PAGE, daysInMonth)} of {daysInMonth}
            </span>
          </div>

        </div>{/* end attBody */}
      </div>
    </div>
  );
}