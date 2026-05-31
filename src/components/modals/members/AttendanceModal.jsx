import { useEffect, useState, useMemo } from "react";
import { fetchAttendanceForMembersMonth } from "../../../services/attendanceService";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_ABBR = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

const DAYS_PER_PAGE = 10;

function getMemberId(m) { return m.member_id || m.memberId || m.id || "unknown"; }
function getMemberName(m) { return m.full_name || m.name || getMemberId(m); }
function getInitial(m) { return (getMemberName(m)[0] || "?").toUpperCase(); }

const AVATAR_COLOURS = [
  "#2e7d32","#1565c0","#6a1b9a","#ad1457","#e65100",
  "#00838f","#4e342e","#37474f","#558b2f","#283593",
];
function avatarColour(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLOURS[Math.abs(h) % AVATAR_COLOURS.length];
}

function PresentIcon() {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      width:20, height:20, borderRadius:"50%",
      background:"#e8f5e9", border:"1.5px solid #4caf50",
      color:"#2e7d32", fontSize:11, fontWeight:900, flexShrink:0,
    }}>✓</span>
  );
}
function AbsentIcon() {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      width:20, height:20, borderRadius:"50%",
      background:"#fce4ec", border:"1.5px solid #e91e63",
      color:"#c2185b", fontSize:10, fontWeight:900, flexShrink:0,
    }}>✕</span>
  );
}
function PendingIcon() {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      width:20, height:20, borderRadius:"50%",
      background:"#f5f5f5", border:"1.5px solid #ccc",
      color:"#bbb", fontSize:10, flexShrink:0,
    }}>–</span>
  );
}

export default function AttendanceModal({ members = [], onClose }) {
  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [year,            setYear]            = useState(now.getFullYear());
  const [month,           setMonth]           = useState(now.getMonth() + 1);
  const [attendanceMap,   setAttendanceMap]   = useState({});
  const [timeMap,         setTimeMap]         = useState({});
  const [daysInMonth,     setDaysInMonth]     = useState(
    new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  );
  const [error,           setError]           = useState(null);
  const [search,          setSearch]          = useState("");
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [page,            setPage]            = useState(0); // day-page index

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

  // Reset to first page when month/year changes
  useEffect(() => { setPage(0); }, [year, month]);

  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth]
  );

  const totalPages = Math.ceil(days.length / DAYS_PER_PAGE);
  const pageDays   = days.slice(page * DAYS_PER_PAGE, (page + 1) * DAYS_PER_PAGE);

  const memberStats = useMemo(() => {
    return members.map((m) => {
      const id       = getMemberId(m);
      const attended = attendanceMap[id] || new Set();
      const pastDays = days.filter(d => new Date(year, month - 1, d) <= todayStart);
      const presentCt = pastDays.filter(d => attended.has(d)).length;
      const absentCt  = pastDays.length - presentCt;
      return { id, presentCt, absentCt };
    });
  }, [members, attendanceMap, days, year, month]);

  const colTotals = useMemo(() => {
    return pageDays.map((d) => {
      const cellDate = new Date(year, month - 1, d);
      if (cellDate > todayStart) return null;
      let p = 0;
      members.forEach(m => {
        if ((attendanceMap[getMemberId(m)] || new Set()).has(d)) p++;
      });
      return { p, a: members.length - p };
    });
  }, [members, attendanceMap, pageDays, year, month]);

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(m => getMemberName(m).toLowerCase().includes(q));
  }, [members, search]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const yearOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position:"fixed", inset:0,
        background:"rgba(0,0,0,0.45)",
        backdropFilter:"blur(3px)",
        display:"flex", alignItems:"center", justifyContent:"center",
        zIndex:10000, padding:16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background:"#fff",
          borderRadius:18,
          width:"min(97vw, 1120px)",
          maxHeight:"90vh",
          display:"flex", flexDirection:"column",
          boxShadow:"0 20px 60px rgba(0,0,0,0.22)",
          overflow:"hidden",
          fontFamily:"Montserrat, sans-serif",
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── TOP HEADER ── */}
        <div style={{
          display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          padding:"20px 28px 14px",
          borderBottom:"1px solid #eee",
          flexShrink:0,
        }}>
          <div>
            <div style={{ fontSize:20, fontWeight:800, color:"#1a1a1a", margin:0 }}>Attendance Records</div>
            <div style={{ fontSize:12, color:"#999", fontWeight:500, marginTop:2 }}>Track member attendance daily.</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            {/* Legend */}
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <LegendItem icon={<PresentIcon />} label="Present" />
              <LegendItem icon={<AbsentIcon />}  label="Absent" />
              <LegendItem icon={<PendingIcon />} label="Pending Record" />
            </div>
            {/* Close */}
            <button onClick={onClose} style={{
              display:"flex", alignItems:"center", gap:5,
              border:"1.5px solid #ddd", borderRadius:8,
              padding:"6px 14px", fontSize:13, fontWeight:700,
              background:"#fafafa", cursor:"pointer", color:"#444",
            }}>✕ Close</button>
          </div>
        </div>

        {/* ── TOOLBAR: search + month nav ── */}
        <div style={{
          display:"flex", alignItems:"center", gap:12,
          padding:"12px 28px",
          borderBottom:"1px solid #eee",
          flexShrink:0,
        }}>
          {/* Search */}
          <div style={{
            display:"flex", alignItems:"center", gap:8,
            background:"#f8f8f8", border:"1.5px solid #e8e8e8",
            borderRadius:10, padding:"8px 14px", flex:"0 0 260px",
          }}>
            <span style={{ color:"#aaa", fontSize:14 }}>🔍</span>
            <input
              style={{
                border:"none", outline:"none", background:"transparent",
                fontSize:13, fontFamily:"Montserrat, sans-serif", color:"#333", flex:1,
              }}
              placeholder="Search member..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Month navigator */}
          <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"flex-start" }}>
            <button onClick={prevMonth} style={iconBtn}>‹</button>
            <div style={{ position:"relative" }}>
              <div
                onClick={() => setShowMonthPicker(v => !v)}
                style={{
                  display:"flex", alignItems:"center", gap:6,
                  border:"1.5px solid #ddd", borderRadius:8,
                  padding:"7px 14px", fontSize:13, fontWeight:700,
                  background:"#fafafa", cursor:"pointer", color:"#222",
                  userSelect:"none", whiteSpace:"nowrap",
                }}
              >
                <span style={{ fontSize:14 }}>📅</span>
                {MONTH_NAMES[month - 1].toUpperCase().slice(0,3)} {year}
                <span style={{ fontSize:11, color:"#888" }}>▾</span>
              </div>
              {showMonthPicker && (
                <div style={{
                  position:"absolute", top:"calc(100% + 6px)", left:0,
                  background:"#fff", border:"1px solid #ddd", borderRadius:12,
                  boxShadow:"0 8px 28px rgba(0,0,0,0.13)",
                  zIndex:200, padding:12, minWidth:200,
                }}>
                  {yearOptions.map(y => (
                    <div key={y} style={{ marginBottom:8 }}>
                      <div style={{ fontSize:10, fontWeight:800, color:"#888", marginBottom:6, paddingLeft:2 }}>{y}</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:4 }}>
                        {MONTH_NAMES.map((mn, idx) => {
                          const sel = y === year && idx + 1 === month;
                          return (
                            <button key={mn}
                              onClick={() => { setYear(y); setMonth(idx+1); setShowMonthPicker(false); }}
                              style={{
                                border:"none", borderRadius:6, padding:"5px 2px",
                                fontSize:10, fontWeight:700, cursor:"pointer",
                                background: sel ? "#2e7d32" : "#f0f0f0",
                                color: sel ? "#fff" : "#333",
                              }}>
                              {mn.slice(0,3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={nextMonth} style={iconBtn}>›</button>
          </div>
        </div>

        {error && (
          <div style={{ color:"#c62828", padding:"8px 28px", background:"#ffebee", fontSize:12, flexShrink:0 }}>
            {error}
          </div>
        )}

        {/* ── TABLE ── */}
        <div style={{ flex:1, overflowY:"auto", minHeight:0 }}>
          <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12, fontFamily:"Montserrat, sans-serif" }}>
            <thead>
              <tr style={{ background:"#fafafa" }}>
                <th style={thName}>Member</th>
                <th style={thSummary}>Status Summary</th>
                {pageDays.map(d => {
                  const dow = DAY_ABBR[new Date(year, month - 1, d).getDay()];
                  const isWeekend = dow === "SAT" || dow === "SUN";
                  return (
                    <th key={d} style={{
                      ...thDay,
                      background: isWeekend ? "#f0faf0" : "#fafafa",
                    }}>
                      <div style={{ fontSize:9, fontWeight:700, color:"#888" }}>{dow}</div>
                      <div style={{ fontSize:12, fontWeight:800, color:"#333" }}>{String(d).padStart(2,"0")}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((m, rowIdx) => {
                const id       = getMemberId(m);
                const attended = attendanceMap[id] || new Set();
                const stat     = memberStats.find(s => s.id === id) || { presentCt:0, absentCt:0 };
                const colour   = avatarColour(id);
                return (
                  <tr key={id} style={{ background: rowIdx % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={tdName}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{
                          width:28, height:28, borderRadius:"50%",
                          background:colour, color:"#fff",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:12, fontWeight:800, flexShrink:0,
                        }}>
                          {getInitial(m)}
                        </div>
                        <span style={{ fontWeight:600, color:"#222", fontSize:13, whiteSpace:"nowrap" }}>
                          {getMemberName(m)}
                        </span>
                      </div>
                    </td>
                    <td style={tdSummary}>
                      <span style={{ fontSize:11, fontWeight:700, color:"#2e7d32", marginRight:8 }}>
                        {stat.presentCt} Present
                      </span>
                      <span style={{ fontSize:11, fontWeight:700, color:"#c2185b" }}>
                        {stat.absentCt} Absent
                      </span>
                    </td>
                    {pageDays.map(d => {
                      const cellDate  = new Date(year, month - 1, d);
                      const isFuture  = cellDate > todayStart;
                      const isPresent = attended.has(d);
                      const time      = timeMap[id]?.[d] || "";
                      return (
                        <td key={d} style={tdDay}
                          title={!isFuture && isPresent && time ? `Attended at ${time}` : ""}>
                          {isFuture ? <PendingIcon /> : isPresent ? <PresentIcon /> : <AbsentIcon />}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Daily Totals */}
              <tr style={{ background:"#f5f5f5", borderTop:"2px solid #e8e8e8" }}>
                <td style={{ ...tdName, fontWeight:800, color:"#333", fontSize:13 }}>Daily Totals</td>
                <td style={tdSummary}></td>
                {colTotals.map((t, i) => (
                  <td key={i} style={{ ...tdDay, padding:"5px 0" }}>
                    {t ? (
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", lineHeight:1.5 }}>
                        <span style={{ fontSize:10, fontWeight:700, color:"#2e7d32" }}>P:{t.p}</span>
                        <span style={{ fontSize:10, fontWeight:700, color:"#c2185b" }}>A:{t.a}</span>
                      </div>
                    ) : (
                      <span style={{ color:"#ccc", fontSize:11 }}>—</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION ── */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          padding:"12px 28px",
          borderTop:"1px solid #eee",
          flexShrink:0,
        }}>
          <button
            onClick={() => setPage(0)}
            disabled={page === 0}
            style={pageBtn(page === 0)}
          >«</button>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={pageBtn(page === 0)}
          >‹</button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              style={{
                ...pageBtn(false),
                background: i === page ? "#2e7d32" : "#f5f5f5",
                color:      i === page ? "#fff"    : "#333",
                border:     i === page ? "1.5px solid #2e7d32" : "1.5px solid #e0e0e0",
                fontWeight: i === page ? 800 : 600,
                minWidth: 34,
              }}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            style={pageBtn(page === totalPages - 1)}
          >›</button>
          <button
            onClick={() => setPage(totalPages - 1)}
            disabled={page === totalPages - 1}
            style={pageBtn(page === totalPages - 1)}
          >»</button>

          <span style={{ fontSize:11, color:"#999", fontWeight:600, marginLeft:8 }}>
            Days {page * DAYS_PER_PAGE + 1}–{Math.min((page + 1) * DAYS_PER_PAGE, daysInMonth)} of {daysInMonth}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Shared style objects ──────────────────────────────────────────────────────

const iconBtn = {
  width:32, height:32, borderRadius:8,
  border:"1.5px solid #ddd", background:"#fafafa",
  cursor:"pointer", fontSize:16, display:"flex",
  alignItems:"center", justifyContent:"center", color:"#444",
};

function pageBtn(disabled) {
  return {
    minWidth:32, height:32, borderRadius:7,
    border:"1.5px solid #e0e0e0", background:"#f5f5f5",
    cursor: disabled ? "default" : "pointer",
    fontSize:13, fontWeight:700, color: disabled ? "#ccc" : "#444",
    fontFamily:"Montserrat, sans-serif",
    opacity: disabled ? 0.5 : 1,
    display:"flex", alignItems:"center", justifyContent:"center",
    padding:"0 6px",
  };
}

const thName = {
  textAlign:"left", padding:"10px 16px 10px 20px",
  fontSize:11, fontWeight:700, color:"#666",
  borderBottom:"2px solid #e0e0e0",
  whiteSpace:"nowrap", minWidth:160, width:160,
  background:"#fafafa",
};

const thSummary = {
  textAlign:"left", padding:"10px 12px",
  fontSize:11, fontWeight:700, color:"#666",
  borderBottom:"2px solid #e0e0e0",
  whiteSpace:"nowrap", minWidth:150, width:150,
  background:"#fafafa",
};

const thDay = {
  textAlign:"center", padding:"8px 4px",
  fontSize:10, fontWeight:700, color:"#666",
  borderBottom:"2px solid #e0e0e0",
  borderRight:"1px solid #f0f0f0",
  minWidth:42, width:42,
};

const tdName = {
  padding:"9px 16px 9px 20px",
  borderBottom:"1px solid #f0f0f0",
  whiteSpace:"nowrap",
};

const tdSummary = {
  padding:"9px 12px",
  borderBottom:"1px solid #f0f0f0",
  whiteSpace:"nowrap",
};

const tdDay = {
  padding:"7px 4px",
  borderBottom:"1px solid #f0f0f0",
  borderRight:"1px solid #f8f8f8",
  textAlign:"center", verticalAlign:"middle",
};

function LegendItem({ icon, label }) {
  return (
    <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#555", fontWeight:600 }}>
      {icon} {label}
    </span>
  );
}