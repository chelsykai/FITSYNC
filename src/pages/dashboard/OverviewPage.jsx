  import { useState, useEffect, useCallback } from "react";
import styles from "./OverviewPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";
import ViewAllModal from "../../components/modals/overview/ViewAllModal";
import ExportModal from "../../components/modals/overview/ExportModal";
import { supabase } from "../../lib/supabaseClient";
import { fetchMembers } from "../../services/memberService";
import {
  fetchTodayAttendanceByTimeBins,
  fetchTodayAttendanceCount,
  fetchCurrentMonthAttendanceByDay,
  fetchCurrentYearAttendanceByMonth,
} from "../../services/attendanceService";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const stats = { walkIns: 13 };

const EMPTY_DAILY_ACTIVITY = Array(12).fill(0);
const CHECKIN_SLOT_LABELS = ["12A", "2A", "4A", "6A", "8A", "10A", "12P", "2P", "4P", "6P", "8P", "10P"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

function BarChart({ data, labels }) {
  const max = Math.max(...data, 1);
  const width = 560;
  const height = 190;
  const leftPad = 24;
  const rightPad = 10;
  const chartWidth = width - leftPad - rightPad;
  const barW = Math.max(14, Math.floor(chartWidth / (data.length * 1.8)));
  const gap = (chartWidth - data.length * barW) / (data.length + 1);
  const step = Math.max(1, Math.ceil(max / 4));
  const ticks = [0, step, step * 2, step * 3, step * 4];

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height + 32}`}>
      {ticks.map((v) => (
        <text key={v} x={0} y={height - (v / max) * height + 4}
          fontSize="9" fill="#aaa" fontFamily="Montserrat, sans-serif">{v}</text>
      ))}

      {data.map((val, i) => {
        const x = leftPad + gap + i * (barW + gap);
        const barH = (val / max) * height;
        return (
          <g key={i}>
            <rect x={x} y={height - barH} width={barW} height={barH} fill="#7eba56" rx={3} />
            <text x={x + barW / 2} y={height + 14} textAnchor="middle"
              fontSize="9" fill="#aaa" fontFamily="Montserrat, sans-serif">{labels?.[i] || i + 1}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function OverviewPage({ onNavigate, activePage = "overview" }) {
  const [showAll, setShowAll] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [populationData, setPopulationData] = useState([]);
  const [todayCheckIns, setTodayCheckIns] = useState(0);
  const [gymActivity, setGymActivity] = useState(EMPTY_DAILY_ACTIVITY);
  const [activityRange, setActivityRange] = useState("today");

  const loadOverviewData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      let memberData = [];
      let walkInCount = 0;

      try {
        memberData = await fetchMembers();
        setMembers(memberData);
        setPopulationData(calculatePopulation(memberData));
      } catch (err) {
        console.error("Error fetching members:", err);
        setError(`Failed to load members: ${err?.message || err}`);
        setMembers([]);
      }

      try {
        walkInCount = await fetchTodayAttendanceCount();
        setTodayCheckIns(walkInCount);
      } catch (err) {
        console.error("Error fetching today attendance count:", err);
        // If members already failed, keep that error; otherwise show attendance error.
        setError((prev) => prev ? prev : `Failed to load attendance: ${err?.message || err}`);
        setTodayCheckIns(0);
      }

      // Clear error if both succeeded
      if (memberData.length > 0 && typeof walkInCount === 'number' && !error) {
        setError(null);
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  const loadActivity = useCallback(async () => {
    try {
      if (activityRange === "today") {
        const todayBins = await fetchTodayAttendanceByTimeBins();
        setGymActivity(todayBins);
        return;
      }

      if (activityRange === "month") {
        const monthByDay = await fetchCurrentMonthAttendanceByDay();
        setGymActivity(monthByDay);
        return;
      }

      const yearByMonth = await fetchCurrentYearAttendanceByMonth();
      setGymActivity(yearByMonth);
    } catch (err) {
      console.error("Error fetching attendance activity:", err);
      setGymActivity(EMPTY_DAILY_ACTIVITY);
    }
  }, [activityRange]);

  useEffect(() => {
    loadOverviewData(true);

    const overviewChannel = supabase
      .channel("overview-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "member" }, () => {
        loadOverviewData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "member_attendance" }, () => {
        loadOverviewData();
        loadActivity();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(overviewChannel);
    };
  }, [loadOverviewData, loadActivity]);

  // Fallback auto-refresh in case realtime events are delayed or unavailable.
  useEffect(() => {
    const refreshInterval = window.setInterval(() => {
      loadOverviewData();
      loadActivity();
    }, 5000);

    const handleFocus = () => {
      loadOverviewData();
      loadActivity();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadOverviewData, loadActivity]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const activityLabels =
    activityRange === "today"
      ? CHECKIN_SLOT_LABELS
      : activityRange === "month"
      ? Array.from({ length: gymActivity.length }, (_, index) => String(index + 1))
      : MONTH_LABELS;

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
                <p className={styles.statValue}>{loading ? "..." : todayCheckIns}</p>
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
                <h2 className={styles.chartTitle}>Today's Check-ins Activity</h2>
                <select
                  className={styles.yearSelect}
                  value={activityRange}
                  onChange={(e) => setActivityRange(e.target.value)}
                  aria-label="Select activity range"
                >
                  <option value="today">Today</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>
              </div>
              <BarChart data={gymActivity} labels={activityLabels} />
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
        <ExportModal members={members} onClose={() => setShowExport(false)} />
      )}
    </>
  );
}
