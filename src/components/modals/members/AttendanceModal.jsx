import { useEffect, useState } from "react";
import styles from "../Modal.module.css";
import { fetchAttendanceForMembersMonth } from "../../../services/attendanceService";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function AttendanceModal({ members = [], onClose }) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based
  const [attendanceMap, setAttendanceMap] = useState({});
  const [timeMap, setTimeMap] = useState({});
  const [daysInMonth, setDaysInMonth] = useState(31);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setError(null);
      try {
        const memberIds = members.map((m) => m.member_id || m.memberId || m.id).filter(Boolean);
        const res = await fetchAttendanceForMembersMonth(memberIds, year, month);
        if (!mounted) return;
        setAttendanceMap(res.attendanceMap || {});
        setTimeMap(res.timeMap || {});
        setDaysInMonth(res.daysInMonth || 31);
      } catch (err) {
        if (!mounted) return;
        console.error(err);
        setError(err.message || "Failed to load attendance");
      }
    };
    load();
    return () => { mounted = false; };
  }, [members, year, month]);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.attendanceModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.attendanceHeader}>
          <div className={styles.attendanceControls}>
            <button className={styles.navButton} onClick={prevMonth} title="Previous month">← Prev</button>
            <div className={styles.monthLabel}>{monthNames[month - 1]} {year}</div>
            <button className={styles.navButton} onClick={nextMonth} title="Next month">Next →</button>
          </div>
          <div>
            <button className={styles.navButton} onClick={onClose}>✕ Close</button>
          </div>
        </div>

        {error && <div style={{color: '#d32f2f', padding: 8, background: '#ffebee', borderRadius: 6}}>{error}</div>}

        <div className={styles.attendanceBody}>
          <table className={styles.attendanceTable}>
            <thead>
              <tr>
                <th className={styles.attendanceNameCell}>Name</th>
                {days.map((d) => (
                  <th key={d} style={{width: 34, fontSize: 12}}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const id = m.member_id || m.memberId || m.id || "unknown";
                const attendedSet = attendanceMap[id] || new Set();
                return (
                  <tr key={id}>
                    <td className={styles.attendanceNameCell}>{m.full_name || m.name || id}</td>
                    {days.map((d) => {
                      const cellDate = new Date(year, month - 1, d);
                      const isFutureDay = cellDate > todayStart;
                      const attended = attendedSet.has(d);
                      const time = timeMap[id]?.[d] || "";
                      const dayStatusClass = isFutureDay
                        ? styles.future
                        : attended
                          ? styles.present
                          : styles.absent;
                      return (
                        <td key={d}>
                          <span
                            className={`${styles.attDot} ${dayStatusClass}`}
                            data-time={!isFutureDay && attended && time ? time : undefined}
                            title={isFutureDay ? "Not yet" : attended && time ? `Attended at ${time}` : ""}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
