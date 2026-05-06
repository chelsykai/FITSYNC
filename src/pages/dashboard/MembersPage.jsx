import { useEffect, useState, useCallback } from "react";
import styles from "./MembersPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";
import MembersExportModal from "../../components/modals/members/MembersExportModal";
import AddMemberModal from "../../components/modals/members/AddMemberModal";
import AttendanceModal from "../../components/modals/members/AttendanceModal";
import MemberProfileModal from "../../components/modals/members/MemberProfileModal";
import ViewAllMembersModal from "../../components/modals/members/ViewAllMembersModal";
import MemberRegisteredModal from "../../components/modals/members/MemberRegisteredModal";
import { supabase } from "../../lib/supabaseClient";
import { fetchMembers, deleteMember } from "../../services/memberService";
import { generateMemberIDPDF } from "../../utils/generateMemberIDPDF";

export default function MembersPage({ onNavigate, activePage = "members" }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState("all");
  const [showExport, setShowExport] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showProfile, setShowProfile] = useState(null);
  const [showViewAll, setShowViewAll] = useState(false);
  const [registeredMember, setRegisteredMember] = useState(null);

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
  const calculateActiveToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    return members.filter((m) => {
      // Check if member visited today
      if (m.last_visit) {
        const lastVisit = new Date(m.last_visit);
        lastVisit.setHours(0, 0, 0, 0);
        if (lastVisit.getTime() === today.getTime()) {
          return true;
        }
      }

      // Check if member's membership is still active (hasn't expired)
      if (m.join_date && m.membership_validity) {
        const joinDate = new Date(m.join_date);
        let expiryDate = new Date(joinDate);

        // Parse membership_validity (e.g., "1 Year", "2 Months", "3 Days")
        const validityMatch = m.membership_validity.match(/(\d+)\s*(year|month|day|week)s?/i);
        if (validityMatch) {
          const amount = parseInt(validityMatch[1]);
          const unit = validityMatch[2].toLowerCase();

          if (unit === 'year') {
            expiryDate.setFullYear(expiryDate.getFullYear() + amount);
          } else if (unit === 'month') {
            expiryDate.setMonth(expiryDate.getMonth() + amount);
          } else if (unit === 'week') {
            expiryDate.setDate(expiryDate.getDate() + amount * 7);
          } else if (unit === 'day') {
            expiryDate.setDate(expiryDate.getDate() + amount);
          }

          // Member is active if expiry date is in the future
          if (expiryDate > today) {
            return true;
          }
        }
      }

      return false;
    }).length;
  };

  const calculateExpiringMembers = () => {
    const today = new Date();
    const thirtyDaysAhead = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    return members.filter((m) => {
      if (!m.join_date || !m.membership_validity) return false;

      const joinDate = new Date(m.join_date);
      let expiryDate = new Date(joinDate);

      // Parse membership_validity (e.g., "1 Year", "2 Months", "3 Days")
      const validityMatch = m.membership_validity.match(/(\d+)\s*(year|month|day|week)s?/i);
      if (validityMatch) {
        const amount = parseInt(validityMatch[1]);
        const unit = validityMatch[2].toLowerCase();

        if (unit === 'year') {
          expiryDate.setFullYear(expiryDate.getFullYear() + amount);
        } else if (unit === 'month') {
          expiryDate.setMonth(expiryDate.getMonth() + amount);
        } else if (unit === 'week') {
          expiryDate.setDate(expiryDate.getDate() + amount * 7);
        } else if (unit === 'day') {
          expiryDate.setDate(expiryDate.getDate() + amount);
        }
      }

      return expiryDate >= today && expiryDate <= thirtyDaysAhead;
    }).length;
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
    activeToday: calculateActiveToday(),
    expiringSoon: calculateExpiringMembers(),
    newThisMonth: calculateNewThisMonth(),
  };

  const getMemberExpiryDate = (member) => {
    if (!member?.join_date) return null;
    const joinDate = new Date(member.join_date);
    if (Number.isNaN(joinDate.getTime())) return null;

    const yearlyRaw = String(member.membership_validity || "").trim();
    if (yearlyRaw) {
      const yearlyMatch = yearlyRaw.match(/(\d+)/);
      if (!yearlyMatch) return null;
      const years = Number.parseInt(yearlyMatch[1], 10);
      if (!Number.isInteger(years) || years <= 0) return null;
      const expiryDate = new Date(joinDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + years);
      return expiryDate;
    }

    const monthlyRaw = String(member.monthly_validity || "").trim();
    if (monthlyRaw) {
      const monthlyMatch = monthlyRaw.match(/(\d+)/);
      if (!monthlyMatch) return null;
      const months = Number.parseInt(monthlyMatch[1], 10);
      if (!Number.isInteger(months) || months <= 0) return null;
      const expiryDate = new Date(joinDate);
      expiryDate.setMonth(expiryDate.getMonth() + months);
      return expiryDate;
    }

    return null;
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
      const expiryDate = getMemberExpiryDate(m);
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

  const getMembershipPlanParts = (membershipValidity, monthlyValidity) => {
    const yearlyRaw = String(membershipValidity || "").trim();
    const monthlyRaw = String(monthlyValidity || "").trim();

    // CASE A: Yearly Membership (long-term)
    if (yearlyRaw) {
      return {
        term: formatValidity(yearlyRaw, "Year"),
        frequency: "",
      };
    }

    // CASE B: Monthly Pay (short-term)
    if (monthlyRaw) {
      return {
        term: formatValidity(monthlyRaw, "Month"),
        frequency: "Monthly Pay",
      };
    }

    return {
      term: "N/A",
      frequency: "",
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
      await deleteMember(memberId);
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
        <Sidebar activePage={activePage} onNavigate={onNavigate} />
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
              <button className={styles.exportBtn} onClick={() => setShowExport(true)}>📤 Export</button>
              <button className={styles.addBtn} onClick={() => setShowAddMember(true)}>👤 Add Member</button>
              <button className={styles.addBtn} onClick={() => setShowAttendance(true)}>🗓️ Attendance</button>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Member ID</th>
                  <th>Name</th>
                  <th>Birthday</th>
                  <th>Membership Type</th>
                  <th className={styles.membershipPlanCol}>Membership Plan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const membershipPlan = getMembershipPlanParts(m.membership_validity, m.monthly_validity);
                  return (
                    <tr key={m.member_id} className={styles.clickableRow}
                      onClick={() => setShowProfile(m)}>
                      <td>{m.member_id}</td>
                      <td>{m.full_name}</td>
                      <td>{m.birthday ? new Date(m.birthday).toLocaleDateString() : "N/A"}</td>
                      <td>{m.membership_type}</td>
                      <td className={styles.membershipPlanCol}>
                        <span className={styles.membershipPlanTerm}>{membershipPlan.term}</span>
                        {membershipPlan.frequency ? (
                          <span className={styles.membershipPlanFrequency}> ({membershipPlan.frequency})</span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className={styles.noResults}>No members found.</td></tr>
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
          onPrint={async (m) => {
            try {
              await generateMemberIDPDF(m);
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error("Failed to generate PDF:", err);
            }
          }}
        />
      )}
      {showProfile && (
        <MemberProfileModal
          member={showProfile}
          onClose={() => setShowProfile(null)}
          onDelete={handleProfileDelete}
          onMembershipUpdated={handleMembershipUpdated}
        />
      )}
      {showViewAll && (
        <ViewAllMembersModal
          members={members}
          onClose={() => setShowViewAll(false)}
          onMemberDeleted={handleMemberDeleted}
        />
      )}
    </>
  );
}
