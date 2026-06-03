import { useEffect, useState, useCallback } from "react";
import styles from "./MembersPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";
import AddMemberModal from "../../components/modals/members/AddMemberModal";
import AttendanceModal from "../../components/modals/members/AttendanceModal";
import MemberProfileModal from "../../components/modals/members/MemberProfileModal";
import ViewAllMembersModal from "../../components/modals/members/ViewAllMembersModal";
import MemberRegisteredModal from "../../components/modals/members/MemberRegisteredModal";
import MembersExportModal from "../../components/modals/members/MembersExportModal";
import { supabase } from "../../lib/supabaseClient";
import { fetchMembers, deleteMember } from "../../services/memberService";
import { fetchTodayAttendanceRecords } from "../../services/attendanceService";
import { formatMMDDYYYY } from "../../utils/dateFormat";
import { getMembershipExpiryDate, isMembershipExpiringSoon } from "../../utils/membershipUtils";

export default function MembersPage({ onNavigate, activePage = "members", isAdmin = false }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState("all");
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showProfile, setShowProfile] = useState(null);
  const [showViewAll, setShowViewAll] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [registeredMember, setRegisteredMember] = useState(null);
  const [todayAttendanceRecords, setTodayAttendanceRecords] = useState([]);

  const loadMembers = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const data = await fetchMembers();
      setMembers(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching members:", err);
      setError("Failed to load members");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  // Fetch members on component mount and subscribe to realtime member changes
  useEffect(() => {
    loadMembers(true);

    (async () => {
      try {
        setTodayAttendanceRecords(await fetchTodayAttendanceRecords());
      } catch (err) {
        console.error("Error fetching today attendance records:", err);
        setTodayAttendanceRecords([]);
      }
    })();

    const memberChannel = supabase
      .channel("members-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "member" }, () => {
        loadMembers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(memberChannel);
    };
  }, [loadMembers]);

  // Refresh members when user returns to the page
  useEffect(() => {
    const handleFocus = () => {
      loadMembers();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadMembers]);

  // Calculate stats from members data
  const calculateExpiringMembers = () => {
    return members.filter((member) => isMembershipExpiringSoon(member, 30)).length;
  };

  const calculateNewThisMonth = () => {
    const today = new Date();
    return members.filter((m) => {
      if (!m.join_date) return false;
      const joinDate = new Date(m.join_date);
      return joinDate.getMonth() === today.getMonth() &&
             joinDate.getFullYear() === today.getFullYear();
    }).length;
  };

  const stats = {
    totalMembers: members.length,
    activeToday: new Set(todayAttendanceRecords.map((record) => record.member_id)).size,
    expiringSoon: calculateExpiringMembers(),
    newThisMonth: calculateNewThisMonth(),
  };

  const filtered = members.filter((m) => {
    const matchesSearch =
      m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.member_id?.includes(search) ||
      m.membership_type?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (quickFilter === "all") return true;
    if (quickFilter === "students") return (m.membership_type || "").toLowerCase() === "student";
    if (quickFilter === "seniors") return (m.membership_type || "").toLowerCase() === "senior";
    if (quickFilter === "expired") {
      const expiryDate = getMembershipExpiryDate(m);
      if (!expiryDate) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return expiryDate < today;
    }
    return true;
  });

  const formatValidity = (value, unit) => {
    const raw = String(value || "").trim();
    if (!raw) return "N/A";
    if (/[a-z]/i.test(raw)) return raw;
    return `${raw} ${unit}${raw === "1" ? "" : "s"}`;
  };

  const getMembershipPlanParts = (membershipValidity) => {
    const yearlyRaw = String(membershipValidity || "").trim();

    return {
      term: formatValidity(yearlyRaw, "Year"),
    };
  };

  const handleMemberAdded = (newMember) => {
    // Add new member to the list
    setMembers([newMember, ...members]);
    setShowAddMember(false);
    setRegisteredMember(newMember);
  };

  const handleMemberDeleted = (deletedMember) => {
    // Remove deleted member from the list
    setMembers(prevMembers => prevMembers.filter(m => m.member_id !== deletedMember.member_id));
  };

  const handleProfileDelete = async (member) => {
    try {
      const memberId = member?.member_id || member?.memberId || member?.id;
      if (!memberId) throw new Error('Missing member ID');
      await deleteMember(memberId, member);
      setMembers(prevMembers => prevMembers.filter(m => m.member_id !== memberId));
    } catch (err) {
      console.error('Failed to delete member from profile modal:', err);
      throw err;
    }
  };

  const handleMembershipUpdated = (updatedMember) => {
    if (!updatedMember?.member_id) return;
    setMembers((prev) => prev.map((m) => (
      m.member_id === updatedMember.member_id ? { ...m, ...updatedMember } : m
    )));
    setShowProfile((prev) => (prev && prev.member_id === updatedMember.member_id
      ? { ...prev, ...updatedMember }
      : prev));
  };

  return (
    <>
      <div className={styles.layout}>
        <Sidebar activePage={activePage} onNavigate={onNavigate} isAdmin={isAdmin} />
        <div className={`${styles.content} tab-slide-animation`}>
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
          <div className={styles.quickFilterRow}>
            <button
              className={`${styles.quickFilterBtn} ${quickFilter === "all" ? styles.quickFilterBtnActive : ""}`}
              onClick={() => setQuickFilter("all")}
            >
              All Members
            </button>
            <button
              className={`${styles.quickFilterBtn} ${quickFilter === "students" ? styles.quickFilterBtnActive : ""}`}
              onClick={() => setQuickFilter("students")}
            >
              Students
            </button>
            <button
              className={`${styles.quickFilterBtn} ${quickFilter === "seniors" ? styles.quickFilterBtnActive : ""}`}
              onClick={() => setQuickFilter("seniors")}
            >
              Seniors
            </button>
            <button
              className={`${styles.quickFilterBtn} ${quickFilter === "expired" ? styles.quickFilterBtnActive : ""}`}
              onClick={() => setQuickFilter("expired")}
            >
              Expired Members
            </button>
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
              <button className={styles.addBtn} onClick={() => setShowAddMember(true)}>👤 Add Member</button>
              <button className={styles.addBtn} onClick={() => setShowAttendance(true)}>🗓️ Attendance</button>
              {isAdmin && (
                <button className={styles.exportBtn} onClick={() => setShowExport(true)}>
                  Export
                </button>
              )}
            </div>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Member ID</th>
                    <th>Name</th>
                    <th>Birthday</th>
                    <th>Membership Type</th>
                    <th className={styles.membershipPlanCol}>Membership Plan</th>
                    <th>Monthly Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => {
                    const membershipPlan = getMembershipPlanParts(m.membership_validity);
                    const expiryDate = getMembershipExpiryDate(m);
                    return (
                      <tr key={m.member_id} className={styles.clickableRow}
                        onClick={() => setShowProfile(m)}>
                        <td>
                          <span className={styles.memberIdCell}>{m.member_id}</span>
                        </td>
                        <td>{m.full_name}</td>
                        <td>{m.birthday ? formatMMDDYYYY(m.birthday) : "N/A"}</td>
                        <td>{m.membership_type}</td>
                        <td className={styles.membershipPlanCol}>
                          <span className={styles.membershipPlanTerm}>{membershipPlan.term}</span>
                        </td>
                        <td>{expiryDate ? formatMMDDYYYY(expiryDate) : "N/A"}</td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className={styles.noResults}>No members found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
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
        {showAddMember && (
        <AddMemberModal
          onClose={() => setShowAddMember(false)}
          onSuccess={handleMemberAdded}
        />
      )}
        {showAttendance && (
        <AttendanceModal
          members={members}
          onClose={() => setShowAttendance(false)}
        />
      )}
      {registeredMember && (
        <MemberRegisteredModal
          member={registeredMember}
          onClose={() => setRegisteredMember(null)}
        />
      )}
      {showProfile && (
        <MemberProfileModal
          member={showProfile}
          onClose={() => setShowProfile(null)}
          onDelete={handleProfileDelete}
          onMembershipUpdated={handleMembershipUpdated}
          isAdmin={isAdmin}
        />
      )}
      {showViewAll && (
        <ViewAllMembersModal
          members={members}
          onClose={() => setShowViewAll(false)}
          onMemberDeleted={handleMemberDeleted}
          isAdmin={isAdmin}
        />
      )}
      {showExport && isAdmin && (
        <MembersExportModal
          members={members}
          onClose={() => setShowExport(false)}
        />
      )}
    </>
  );
}
