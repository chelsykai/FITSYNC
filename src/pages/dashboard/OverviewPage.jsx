import { useState, useEffect } from "react";
import styles from "./OverviewPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";
import ViewAllModal from "../../components/modals/overview/ViewAllModal";
import ExportModal from "../../components/modals/overview/ExportModal";
import { fetchMembers } from "../../services/memberService";

const stats = { checkins: 44, activeMembers: 890, walkIns: 13 };

const gymActivity = [10, 6, 12, 4, 3, 5, 2, 4, 6, 3, 5, 4];

const population = [
  { label: "Regular", value: 50,   color: "#4a9e4a" },
  { label: "Student", value: 30,   color: "#7fd4c1" },
  { label: "PWD",     value: 9.2,  color: "#a8c8e8" },
  { label: "Senior",  value: 10.3, color: "#c8c8c8" },
];

function DonutChart({ data }) {
  const size = 160, cx = 80, cy = 80, r = 55, innerR = 30;
  let cumulative = 0;
  const slices = data.map((d) => {
    const start = cumulative;
    cumulative += d.value;
    const startAngle = (start / 100) * 2 * Math.PI - Math.PI / 2;
    const endAngle = ((start + d.value) / 100) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle),   y2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(startAngle), iy1 = cy + innerR * Math.sin(startAngle);
    const ix2 = cx + innerR * Math.cos(endAngle),   iy2 = cy + innerR * Math.sin(endAngle);
    const largeArc = d.value > 50 ? 1 : 0;
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
    const midAngle = ((start + d.value / 2) / 100) * 2 * Math.PI - Math.PI / 2;
    const lx = cx + (r + innerR) / 2 * Math.cos(midAngle);
    const ly = cy + (r + innerR) / 2 * Math.sin(midAngle);
    return { ...d, path, lx, ly };
  });
  return (
    <svg width={size} height={size}>
      {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
      {slices.map((s, i) => (
        <text key={i} x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle"
          fontSize="9" fill="white" fontWeight="700" fontFamily="Montserrat, sans-serif">
          {s.value}%
        </text>
      ))}
    </svg>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data), width = 340, height = 120, barW = 18;
  const gap = (width - data.length * barW) / (data.length + 1);
  return (
    <svg width={width} height={height + 20}>
      {[0, 3, 6, 9, 12].map((v) => (
        <text key={v} x={0} y={height - (v / max) * height + 4}
          fontSize="9" fill="#aaa" fontFamily="Montserrat, sans-serif">{v}</text>
      ))}
      {data.map((val, i) => {
        const x = gap + i * (barW + gap) + 12;
        const barH = (val / max) * height;
        return (
          <g key={i}>
            <rect x={x} y={height - barH} width={barW} height={barH} fill="#7eba56" rx={3} />
            <text x={x + barW / 2} y={height + 14} textAnchor="middle"
              fontSize="9" fill="#aaa" fontFamily="Montserrat, sans-serif">{i + 1}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function OverviewPage({ onNavigate, activePage = "overview" }) {
  const [year, setYear] = useState(2025);
  const [showAll, setShowAll] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch members on component mount
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);
        const data = await fetchMembers();
        // Display members sorted by join date (most recent first)
        setMembers(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching members:", err);
        setError("Failed to load members");
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, []);

  return (
    <>
      <div className={styles.layout}>
        <Sidebar activePage={activePage} onNavigate={onNavigate} />
        <div className={styles.content}>
          <h1 className={styles.welcome}>Welcome, User!</h1>

          {/* Stat Cards */}
          <div className={styles.statRow}>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>📅</span>
              <div>
                <p className={styles.statLabel}>Today's Checkins</p>
                <p className={styles.statValue}>{stats.checkins}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>👥</span>
              <div>
                <p className={styles.statLabel}>Active Membership</p>
                <p className={styles.statValue}>{stats.activeMembers}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>🚶</span>
              <div>
                <p className={styles.statLabel}>Today's Walk-in</p>
                <p className={styles.statValue}>{stats.walkIns}</p>
              </div>
            </div>
            <div
              className={`${styles.statCard} ${styles.printCard}`}
              onClick={() => setShowExport(true)}
            >
              <span className={styles.statIcon}>🖨️</span>
            </div>
          </div>

          {/* Expiring Members Table */}
          <div className={styles.tableCard}>
            <h2 className={styles.tableTitle}>Memberships Expiring Soon</h2>
            {error && (
              <div style={{
                color: "#d32f2f",
                padding: "12px",
                backgroundColor: "#ffebee",
                borderRadius: "4px",
                marginBottom: "16px",
              }}>
                {error}
              </div>
            )}
            {loading && (
              <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                Loading members...
              </div>
            )}
            {!loading && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Member ID</th>
                  <th>Name</th>
                  <th>Join Date</th>
                  <th>Membership Type</th>
                  <th>Monthly Validity</th>
                  <th>Membership Validity</th>
                </tr>
              </thead>
              <tbody>
                {members.slice(0, 7).map((m) => (
                  <tr key={m.member_id}>
                    <td>{m.member_id}</td>
                    <td>{m.full_name}</td>
                    <td>{m.join_date ? new Date(m.join_date).toLocaleDateString() : "N/A"}</td>
                    <td>{m.membership_type}</td>
                    <td>{m.monthly_validity}</td>
                    <td>{m.membership_validity}</td>
                  </tr>
                ))}
                {!loading && members.length === 0 && (
                  <tr><td colSpan={6} className={styles.noResults}>No members found.</td></tr>
                )}
              </tbody>
            </table>
            )}
            <div className={styles.viewAllWrapper}>
              <button className={styles.viewAllBtn} onClick={() => setShowAll(true)}>
                View All
              </button>
            </div>
          </div>

          {/* Charts Row */}
          <div className={styles.chartsRow}>
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h2 className={styles.chartTitle}>Gym Activity</h2>
                <select className={styles.yearSelect} value={year}
                  onChange={(e) => setYear(Number(e.target.value))}>
                  {[2023, 2024, 2025 ,2026].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <BarChart data={gymActivity} />
            </div>
            <div className={styles.chartCard}>
              <h2 className={styles.chartTitle}>Population</h2>
              <div className={styles.donutRow}>
                <DonutChart data={population} />
                <div className={styles.legend}>
                  {population.map((p) => (
                    <div key={p.label} className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ backgroundColor: p.color }} />
                      <span className={styles.legendLabel}>{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAll && (
        <ViewAllModal members={members} onClose={() => setShowAll(false)} />
      )}
      {showExport && (
        <ExportModal onClose={() => setShowExport(false)} />
      )}
    </>
  );
}
