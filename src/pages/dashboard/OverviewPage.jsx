  import { useState, useEffect } from "react";
import styles from "./OverviewPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";
import ViewAllModal from "../../components/modals/overview/ViewAllModal";
import ExportModal from "../../components/modals/overview/ExportModal";
import { fetchMembers } from "../../services/memberService";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const stats = { checkins: 44, activeMembers: 890, walkIns: 13 };

const gymActivity = [10, 6, 12, 4, 3, 5, 2, 4, 6, 3, 5, 4];

const membershipTypeColors = {
  "Regular": "#4a9e4a",
  "Student": "#7fd4c1",
  "PWD": "#a8c8e8",
  "Senior": "#c8c8c8",
};

// Function to calculate population distribution from members
function calculatePopulation(members) {
  if (members.length === 0) {
    return [
      { label: "Regular", value: 0 },
      { label: "Student", value: 0 },
      { label: "PWD", value: 0 },
      { label: "Senior", value: 0 },
    ];
  }

  const typeCounts = {
    "Regular": 0,
    "Student": 0,
    "PWD": 0,
    "Senior": 0,
  };

  members.forEach((m) => {
    const type = m.membership_type || "Regular";
    if (typeCounts.hasOwnProperty(type)) {
      typeCounts[type]++;
    }
  });

  return Object.entries(typeCounts).map(([type, count]) => ({
    label: type,
    value: parseFloat(((count / members.length) * 100).toFixed(1)),
  }));
}

function DonutChart({ data }) {
  // Filter out zero values
  const filteredData = data.filter((d) => d.value > 0);

  const chartData = filteredData.map((d) => ({
    ...d,
    fill: membershipTypeColors[d.label],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ label, value }) => `${label}: ${value}%`}
          labelStyle={{
            fontSize: "12px",
            fontWeight: "600",
            fill: "#333",
            fontFamily: "Montserrat, sans-serif",
          }}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => `${value}%`}
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "8px",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function PopulationLegend({ data }) {
  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "16px",
      justifyContent: "center",
      marginTop: "16px",
    }}>
      {data.map((item) => (
        <div key={item.label} style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <div style={{
            width: "16px",
            height: "16px",
            borderRadius: "3px",
            backgroundColor: membershipTypeColors[item.label],
          }} />
          <span style={{
            fontSize: "14px",
            fontWeight: "500",
            color: "#333",
            fontFamily: "Montserrat, sans-serif",
          }}>
            {item.label} ({item.value}%)
          </span>
        </div>
      ))}
    </div>
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
  const [populationData, setPopulationData] = useState([]);

  // Fetch members on component mount
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);
        const data = await fetchMembers();
        setMembers(data);
        setPopulationData(calculatePopulation(data));
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
                <p className={styles.statValue}>{loading ? "..." : members.length}</p>
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
              <div style={{ width: "100%", height: "350px" }}>
                <DonutChart data={populationData} />
              </div>
              <PopulationLegend data={populationData} />
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
