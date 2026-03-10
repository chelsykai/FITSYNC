import { useState } from "react";
import styles from "./MembersPage.module.css";
import Sidebar from "../../components/Sidebar/Sidebar";

const stats = {
  totalMembers: 1411,
  activeToday: 112,
  expiringSoon: 23,
  newThisMonth: 38,
};

const members = [
  { id: "00832", name: "Ayvan Lopez", joinDate: "MM/DD/YYYY", type: "Student", monthly: "2 months", validity: "1 Year", lastVisit: "MM/DD/YYYY 16:01:21" },
  { id: "00014", name: "Janine Mae Vios", joinDate: "MM/DD/YYYY", type: "Student", monthly: "5 months", validity: "1 Year", lastVisit: "MM/DD/YYYY 16:32:15" },
  { id: "00281", name: "Allyza Mae Magsipoc", joinDate: "MM/DD/YYYY", type: "Student", monthly: "1 month", validity: "1 Year", lastVisit: "MM/DD/YYYY 17:18:33" },
  { id: "00026", name: "James Allen Victoria", joinDate: "MM/DD/YYYY", type: "Senior", monthly: "2 months", validity: "1 Year", lastVisit: "MM/DD/YYYY 17:21:15" },
  { id: "00002", name: "Carlos Corpuz", joinDate: "MM/DD/YYYY", type: "Regular", monthly: "18 months", validity: "1 Year", lastVisit: "MM/DD/YYYY 17:44:52" },
  { id: "00039", name: "Alvin Perenta", joinDate: "MM/DD/YYYY", type: "PWD", monthly: "2 months", validity: "1 Year", lastVisit: "MM/DD/YYYY 18:12:15" },
  { id: "00132", name: "Khali Cruz", joinDate: "MM/DD/YYYY", type: "Regular", monthly: "5 months", validity: "1 Year", lastVisit: "MM/DD/YYYY 18:22:37" },
];

export default function MembersPage({ onNavigate, activePage = "members" }) {
  const [search, setSearch] = useState("");

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.id.includes(search) ||
    m.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.layout}>
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className={styles.content}>
        <h1 className={styles.title}>Members</h1>

        <div className={styles.statRow}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>👥</span>
            <div>
              <p className={styles.statLabel}>Total Members</p>
              <p className={styles.statValue}>{stats.totalMembers.toLocaleString()}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🏃</span>
            <div>
              <p className={styles.statLabel}>Active Today</p>
              <p className={styles.statValue}>{stats.activeToday}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>⚠️</span>
            <div>
              <p className={styles.statLabel}>Expiring Soon</p>
              <p className={styles.statValue}>{stats.expiringSoon}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🧑‍🤝‍🧑</span>
            <div>
              <p className={styles.statLabel}>New Members This Month</p>
              <p className={styles.statValue}>{stats.newThisMonth}</p>
            </div>
          </div>
        </div>

        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search"
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        <div className={styles.tableCard}>
          <div className={styles.actionRow}>
            <button className={styles.exportBtn}>📤 Export</button>
            <button className={styles.addBtn}>👤 Add Member</button>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Name</th>
                <th>Join Date</th>
                <th>Membership Type</th>
                <th>Monthly Validity</th>
                <th>Membership Validity</th>
                <th>Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td>{m.id}</td>
                  <td>{m.name}</td>
                  <td>{m.joinDate}</td>
                  <td>{m.type}</td>
                  <td>{m.monthly}</td>
                  <td>{m.validity}</td>
                  <td>{m.lastVisit}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className={styles.noResults}>No members found.</td></tr>
              )}
            </tbody>
          </table>
          <div className={styles.viewAllWrapper}>
            <button className={styles.viewAllBtn}>View All</button>
          </div>
        </div>
      </div>
    </div>
  );
}
