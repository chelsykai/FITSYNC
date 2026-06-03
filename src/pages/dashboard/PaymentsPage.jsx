import { useState, useEffect, useCallback } from "react";
import styles from "./PaymentsPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";
import ViewAllPaymentsModal from "../../components/modals/payments/ViewAllPaymentsModal";
import PaymentReceiptModal from "../../components/modals/payments/PaymentReceiptModal";
import PaymentsExportModal from "../../components/modals/payments/PaymentsExportModal";
import AddWalkInModal from "../../components/modals/payments/AddWalkInModal";
import { supabase } from "../../lib/supabaseClient";
import { fetchMembers } from "../../services/memberService";
import { formatMMDDYYYY, parseLocalISODate } from "../../utils/dateFormat";
import WalkInTable from "./WalkInTable";

/**
 * Fetch total count of members from the database
 */
const fetchMemberCount = async () => {
  try {
    const { count, error } = await supabase
      .from("member")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Error fetching member count:", error);
      return 0;
    }

    console.log("Total members:", count); // Debug
    return count || 0;
  } catch (err) {
    console.error("Error in fetchMemberCount:", err);
    return 0;
  }
};

/**
 * Fetch all payment records from the database with member info
 */
const fetchPayments = async () => {
  try {
    // First, fetch all payment records
    const { data: paymentData, error: paymentError } = await supabase
      .from("record_payment")
      .select("*")
      .order("date", { ascending: false });

    if (paymentError) {
      console.error("Error fetching payment records:", paymentError);
      throw paymentError;
    }

    console.log("Fetched payment records:", paymentData); // Debug

    if (!paymentData || paymentData.length === 0) {
      console.log("No payment records found");
      return [];
    }

    // Get unique member IDs
    const memberIds = [...new Set(paymentData.map((p) => p.member_id))];

    // Fetch member details for those IDs
    const { data: memberData, error: memberError } = await supabase
      .from("member")
      .select("member_id, full_name, membership_type")
      .in("member_id", memberIds);

    if (memberError) {
      console.error("Error fetching member data:", memberError);
      // Continue anyway, we'll use fallback values
    }

    console.log("Fetched member data:", memberData); // Debug

    // Create a map of member data for quick lookup
    const memberMap = {};
    (memberData || []).forEach((member) => {
      memberMap[member.member_id] = member;
    });

    console.log("Payment data length:", paymentData.length); // Debug
    console.log("Member map keys:", Object.keys(memberMap)); // Debug

    // Map all payment records (no deduplication - each record.id should be unique)
    const result = paymentData.map((record) => {
      const memberInfo = memberMap[record.member_id] || {};
      // Handle both possible field names for amount
      const amount = record.amount_paid || record.amount || 0;
      return {
        id: record.id, // Payment record ID (for React keys)
        memberId: record.member_id, // Member ID to display
        name: memberInfo.full_name || "Unknown",
        date: formatMMDDYYYY(record.date),
        rawDate: parseLocalISODate(record.date),
        type: memberInfo.membership_type || "Unknown",
        total: amount,
        status: record.status || "Paid",
        mod: record.payment_method || record.mod || "CASH",
        promoCode: record.promo_code || record.promoCode,
      };
    });

    console.log("Transformed payments:", result); // Debug
    return result;
  } catch (err) {
    console.error("Error fetching payments:", err);
    return [];
  }
};

const fetchWalkIns = async () => {
  try {
    const { data, error } = await supabase
      .from("walk_in")
      .select("*")
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching walk-in records:", error);
      throw error;
    }

    return (data || []).map((record) => ({
      id: record.id,
      name: record.name || "Guest",
      date: formatMMDDYYYY(record.payment_date),
      rawDate: parseLocalISODate(record.payment_date),
      planType: record.plan_type || "Daily",
      total: Number(record.total) || 0,
      status: record.status || "Paid",
    }));
  } catch (err) {
    console.error("Error in fetchWalkIns:", err);
    return [];
  }
};

/**
 * Calculate revenue stats
 */
const calculateStats = (payments, activeMemberships = 0) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of today
  
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  let todayRevenue = 0;
  let monthRevenue = 0;
  let pendingRevenue = 0;

  payments.forEach((p) => {
    if (!p.rawDate) return;
    const paymentDate = new Date(p.rawDate);
    paymentDate.setHours(0, 0, 0, 0); // Set to start of payment date
    const paymentAmount = Number(p.total) || 0;
    const normalizedStatus = String(p.status || "").trim().toLowerCase();

    if (paymentDate.getTime() === today.getTime() && normalizedStatus === "paid") {
      todayRevenue += paymentAmount;
    }

    if (paymentDate >= monthStart && normalizedStatus === "paid") {
      monthRevenue += paymentAmount;
    }

    if (normalizedStatus === "pending" || normalizedStatus === "unpaid") {
      pendingRevenue += paymentAmount;
    }
  });

  return {
    totalTransactions: payments.length,
    activeMemberships: activeMemberships,
    today: todayRevenue,
    thisMonth: monthRevenue,
    pending: pendingRevenue,
  };
};

export default function PaymentsPage({ onNavigate, activePage = "payments", isAdmin = false }) {
  const [activeTab, setActiveTab] = useState("payments");
  const [payments, setPayments] = useState([]);
  const [walkIns, setWalkIns] = useState([]);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalTransactions: 0,
    activeMemberships: 0,
  });
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingWalkIns, setLoadingWalkIns] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [search, setSearch] = useState("");
  const [showViewAll, setShowViewAll] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAddWalkIn, setShowAddWalkIn] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [members, setMembers] = useState([]);

  const loadMembers = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoadingMembers(true);
      const data = await fetchMembers();
      setMembers(data);
    } catch (err) {
      console.error("Error fetching members:", err);
      setMembers([]);
    } finally {
      if (showLoader) setLoadingMembers(false);
    }
  }, []);

  const loadPayments = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoadingPayments(true);
      setError("");

      const [paymentData, memberCount] = await Promise.all([
        fetchPayments(),
        fetchMemberCount(),
      ]);

      setPayments(paymentData);

      const calculatedStats = calculateStats(paymentData, memberCount);
      setStats({
        totalTransactions: calculatedStats.totalTransactions,
        activeMemberships: calculatedStats.activeMemberships,
      });
    } catch (err) {
      console.error("Error loading payments:", err);
      setError("Unable to load payment records right now. Please try again.");
      setPayments([]);
      setStats({ totalTransactions: 0, activeMemberships: 0 });
    } finally {
      if (showLoader) setLoadingPayments(false);
    }
  }, []);

  const loadWalkIns = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoadingWalkIns(true);
      const walkInData = await fetchWalkIns();
      setWalkIns(walkInData);
    } catch (err) {
      console.error("Error loading walk-in records:", err);
      setWalkIns([]);
    } finally {
      if (showLoader) setLoadingWalkIns(false);
    }
  }, []);

  useEffect(() => {
    loadMembers(true);
    loadPayments(true);
    loadWalkIns(true);

    const paymentsChannel = supabase
      .channel("payments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "record_payment" }, () => {
        loadPayments();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "walk_in" }, () => {
        loadWalkIns();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "member" }, () => {
        loadMembers();
        loadPayments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(paymentsChannel);
    };
  }, [loadMembers, loadPayments, loadWalkIns]);

  // Fallback auto-refresh when user returns to the page
  useEffect(() => {
    const handleFocus = () => {
      loadMembers();
      loadPayments();
      loadWalkIns();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadMembers, loadPayments, loadWalkIns]);

  const filtered = payments.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.memberId.toString().includes(search) ||
    p.type.toLowerCase().includes(search.toLowerCase()) ||
    p.status.toLowerCase().includes(search.toLowerCase())
  );

  if (loadingPayments) {
    return (
      <div className={styles.layout}>
        <Sidebar activePage={activePage} onNavigate={onNavigate} isAdmin={isAdmin} />
        <div className={`${styles.content} tab-slide-animation`}>
          <h1 className={styles.title}>Payments</h1>
          <div style={{ textAlign: "center", padding: "40px", fontSize: "16px", color: "#666" }}>
            Loading payment records...
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.layout}>
        <Sidebar activePage={activePage} onNavigate={onNavigate} isAdmin={isAdmin} />
        <div className={`${styles.content} tab-slide-animation`}>
          <h1 className={styles.title}>Payments</h1>

          {/* Stat Cards */}
          <div className={styles.statRow}>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>📅</span>
              <div>
                <p className={styles.statLabel}>Total Transactions</p>
                <p className={styles.statValue}>{stats.totalTransactions}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>👥</span>
              <div>
                <p className={styles.statLabel}>Active Memberships</p>
                <p className={styles.statValue}>{loadingMembers ? "..." : members.length}</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className={styles.searchWrapper}>
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

          {/* Error Message */}
          {error && (
            <div style={{
              padding: "12px 16px",
              marginBottom: "16px",
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: "6px",
              color: "#c00",
              fontSize: "14px",
            }}>
              {error}
            </div>
          )}

          {/* Table Card */}
          <div className={styles.tableCard}>
            <div className={styles.tabSwitcher} role="tablist" aria-label="Payment record type">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "payments"}
                className={`${styles.tabButton} ${activeTab === "payments" ? styles.tabButtonActive : ""}`}
                onClick={() => setActiveTab("payments")}
              >
                Payment Records
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "walkIns"}
                className={`${styles.tabButton} ${activeTab === "walkIns" ? styles.tabButtonActive : ""}`}
                onClick={() => setActiveTab("walkIns")}
              >
                Walk-in Records
              </button>
            </div>

            <div className={styles.tableHeader}>
              <h2 className={styles.tableTitle}>
                {activeTab === "payments" ? "Payment Records Table" : "Walk-in Records Table"}
              </h2>
              <div className={styles.tableActions}>
                {activeTab === "payments" && isAdmin && (
                  <button className={styles.exportBtn} onClick={() => setShowExport(true)}>
                    Export
                  </button>
                )}
                {activeTab === "payments" ? (
                  <button className={styles.addBtn} onClick={() => onNavigate("recordPayment")}>
                    Add / Record Payment
                  </button>
                ) : (
                  <button className={styles.addBtn} onClick={() => setShowAddWalkIn(true)}>
                    Add Walk-in
                  </button>
                )}
              </div>
            </div>

            {activeTab === "payments" ? (
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Member ID</th>
                      <th>Name</th>
                      <th>Payment Date</th>
                      <th>Membership Type</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr key="no-payments"><td colSpan={6} className={styles.noResults}>
                        No payment records yet. Click "Add / Record Payment" to create one.
                      </td></tr>
                    ) : filtered.length === 0 ? (
                      <tr key="no-match"><td colSpan={6} className={styles.noResults}>
                        No records match your search.
                      </td></tr>
                    ) : (
                      filtered.map((p, index) => (
                        <tr
                          key={`${p.id || p.memberId}-${p.date}-${index}`}
                          className={styles.clickableRow}
                          onClick={() => setSelectedPayment(p)}
                        >
                          <td>{p.memberId}</td>
                          <td>
                            <button
                              type="button"
                              className={styles.paymentNameBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPayment(p);
                              }}
                            >
                              {p.name}
                            </button>
                          </td>
                          <td>{p.date}</td>
                          <td>{p.type}</td>
                          <td>{p.total.toLocaleString()}</td>
                          <td>
                            <span className={`${styles.badge} ${p.status === "Paid" ? styles.paid : styles.pending}`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <WalkInTable walkIns={walkIns} search={search} loading={loadingWalkIns} />
            )}

            {activeTab === "payments" && (
              <div className={styles.viewAllWrapper}>
                <button className={styles.viewAllBtn} onClick={() => setShowViewAll(true)}>
                  View All
                </button>
              </div>
            )}
          </div>


        </div>
      </div>

      {/* Modals */}
      {showViewAll && (
        <ViewAllPaymentsModal
          payments={payments}
          onClose={() => setShowViewAll(false)}
          onAddPayment={() => { setShowViewAll(false); onNavigate("recordPayment"); }}
        />
      )}
      {selectedPayment && (
        <PaymentReceiptModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onAddPayment={() => {
            setSelectedPayment(null);
            onNavigate("recordPayment");
          }}
        />
      )}
      {showExport && isAdmin && (
        <PaymentsExportModal
          payments={payments}
          members={members}
          onClose={() => setShowExport(false)}
          isAdmin={isAdmin}
        />
      )}
      {showAddWalkIn && (
        <AddWalkInModal
          onClose={() => setShowAddWalkIn(false)}
          onSaved={() => loadWalkIns()}
        />
      )}
    </>
  );
}
