import { useState, useEffect } from "react";
import styles from "./MembersPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";
import MembersExportModal from "../../components/modals/members/MembersExportModal";
import AddMemberModal from "../../components/modals/members/AddMemberModal";
import MemberProfileModal from "../../components/modals/members/MemberProfileModal";
import ViewAllMembersModal from "../../components/modals/members/ViewAllMembersModal";
import MemberRegisteredModal from "../../components/modals/members/MemberRegisteredModal";
import { fetchMembers } from "../../services/memberService";

export default function MembersPage({ onNavigate, activePage = "members" }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showProfile, setShowProfile] = useState(null);
  const [showViewAll, setShowViewAll] = useState(false);
  const [registeredMember, setRegisteredMember] = useState(null);

  // Fetch members on component mount
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);
        const data = await fetchMembers();
        setMembers(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching members:", err);
        setError("Failed to load members");
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, []);

  // Calculate stats from members data
  const stats = {
    totalMembers: members.length,
    activeToday: Math.floor(members.length * 0.08), // Approximate
    expiringSoon: Math.floor(members.length * 0.016), // Approximate
    newThisMonth: Math.floor(members.length * 0.027), // Approximate
  };

  const filtered = members.filter((m) =>
    m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.member_id?.includes(search) ||
    m.membership_type?.toLowerCase().includes(search.toLowerCase())
  );

  const handleMemberAdded = (newMember) => {
    // Add new member to the list
    setMembers([newMember, ...members]);
    setShowAddMember(false);
    setRegisteredMember(newMember);
  };

  return (
    <>
      <div className={styles.layout}>
        <Sidebar activePage={activePage} onNavigate={onNavigate} />
        <div className={styles.content}>
          <h1 className={styles.title}>Members</h1>

          {/* Stat Cards */}
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

          {/* Search */}
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

          {/* Error message */}
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

          {/* Loading state */}
          {loading && (
            <div style={{
              textAlign: "center",
              padding: "40px",
              color: "#666",
            }}>
              Loading members...
            </div>
          )}

          {/* Table Card */}
          {!loading && (
          <div className={styles.tableCard}>
            <div className={styles.actionRow}>
              <button className={styles.exportBtn} onClick={() => setShowExport(true)}>📤 Export</button>
              <button className={styles.addBtn} onClick={() => setShowAddMember(true)}>👤 Add Member</button>
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
                  <tr key={m.member_id} className={styles.clickableRow}
                    onClick={() => setShowProfile(m)}>
                    <td>{m.member_id}</td>
                    <td>{m.full_name}</td>
                    <td>{m.join_date ? new Date(m.join_date).toLocaleDateString() : "N/A"}</td>
                    <td>{m.membership_type}</td>
                    <td>{m.monthly_validity}</td>
                    <td>{m.membership_validity}</td>
                    <td>{m.last_visit || "N/A"}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className={styles.noResults}>No members found.</td></tr>
                )}
              </tbody>
            </table>
            <div className={styles.viewAllWrapper}>
              <button className={styles.viewAllBtn} onClick={() => setShowViewAll(true)}>
                View All
              </button>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showExport && (
        <MembersExportModal members={members} onClose={() => setShowExport(false)} />
      )}
      {showAddMember && (
        <AddMemberModal
          onClose={() => setShowAddMember(false)}
          onSuccess={handleMemberAdded}
        />
      )}
      {registeredMember && (
        <MemberRegisteredModal
          member={registeredMember}
          onClose={() => setRegisteredMember(null)}
          onPrint={(m) => console.log("print", m)}
        />
      )}
      {showProfile && (
        <MemberProfileModal member={showProfile} onClose={() => setShowProfile(null)} />
      )}
      {showViewAll && (
        <ViewAllMembersModal
          members={members}
          onClose={() => setShowViewAll(false)}
        />
      )}
    </>
  );
}
