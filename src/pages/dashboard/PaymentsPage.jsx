import { useState, useEffect } from "react";
import styles from "./PaymentsPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";
import PaymentsExportModal from "../../components/modals/payments/PaymentsExportModal";
import ViewAllPaymentsModal from "../../components/modals/payments/ViewAllPaymentsModal";
import { supabase } from "../../lib/supabaseClient";

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

    // Combine payment and member data
    return paymentData.map((record) => {
      const memberInfo = memberMap[record.member_id] || {};
      return {
        id: record.member_id,
        name: memberInfo.full_name || "Unknown",
        date: new Date(record.date).toLocaleDateString("en-US"),
        rawDate: new Date(record.date),
        type: memberInfo.membership_type || "Unknown",
        total: record.amount_paid || 0,
        status: record.status,
      };
    });
  } catch (err) {
    console.error("Error fetching payments:", err);
    return [];
  }
};

/**
 * Calculate revenue stats
 */
const calculateStats = (payments) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of today
  
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  let todayRevenue = 0;
  let monthRevenue = 0;
  let pendingRevenue = 0;

  payments.forEach((p) => {
    const paymentDate = new Date(p.rawDate);
    paymentDate.setHours(0, 0, 0, 0); // Set to start of payment date
    const paymentAmount = p.total || 0;

    if (paymentDate.getTime() === today.getTime() && p.status === "Paid") {
      todayRevenue += paymentAmount;
    }

    if (paymentDate >= monthStart && p.status === "Paid") {
      monthRevenue += paymentAmount;
    }

    if (p.status === "Pending") {
      pendingRevenue += paymentAmount;
    }
  });

  return {
    totalTransactions: payments.length,
    activeMemberships: 890,
    today: todayRevenue,
    thisMonth: monthRevenue,
    pending: pendingRevenue,
  };
};

export default function PaymentsPage({ onNavigate, activePage = "payments" }) {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    activeMemberships: 890,
  });
  const [revenue, setRevenue] = useState({
    today: 0,
    thisMonth: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [showViewAll, setShowViewAll] = useState(false);

  useEffect(() => {
    const loadPayments = async () => {
      setLoading(true);
      setError("");
      const data = await fetchPayments();
      setPayments(data);

      const calculatedStats = calculateStats(data);
      setStats({
        totalTransactions: calculatedStats.totalTransactions,
        activeMemberships: 890,
      });
      setRevenue({
        today: calculatedStats.today,
        thisMonth: calculatedStats.thisMonth,
        pending: calculatedStats.pending,
      });

      setLoading(false);
    };

    loadPayments();

    // Set up real-time subscription
    const subscription = supabase
      .channel("record_payment_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "record_payment" },
        (payload) => {
          console.log("Real-time update received:", payload);
          loadPayments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const filtered = payments.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.includes(search) ||
    p.type.toLowerCase().includes(search.toLowerCase()) ||
    p.status.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className={styles.layout}>
        <Sidebar activePage={activePage} onNavigate={onNavigate} />
        <div className={styles.content}>
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
        <Sidebar activePage={activePage} onNavigate={onNavigate} />
        <div className={styles.content}>
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
                <p className={styles.statValue}>{stats.activeMemberships}</p>
              </div>
            </div>
            <div
              className={`${styles.statCard} ${styles.exportCard}`}
              onClick={() => setShowExport(true)}
            >
              <span className={styles.statIcon}>🖨️</span>
              <div>
                <p className={styles.statLabel}>Export</p>
                <p className={styles.statLabel}>Transactions</p>
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
            <div className={styles.tableHeader}>
              <h2 className={styles.tableTitle}>Payment Records Table</h2>
              <button className={styles.addBtn} onClick={() => onNavigate("recordPayment")}>
                Add / Record Payment
              </button>
            </div>

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
                  <tr><td colSpan={6} className={styles.noResults}>
                    No payment records yet. Click "Add / Record Payment" to create one.
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className={styles.noResults}>
                    No records match your search.
                  </td></tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.name}</td>
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

            <div className={styles.viewAllWrapper}>
              <button className={styles.viewAllBtn} onClick={() => setShowViewAll(true)}>
                View All
              </button>
            </div>
          </div>

          {/* Revenue Cards */}
          <div className={styles.revenueRow}>
            <div className={styles.revenueCard}>
              <span className={styles.revenueIcon}>💰</span>
              <div>
                <p className={styles.revenueLabel}>Today's Revenue</p>
                <p className={styles.revenueValue}>₱ {revenue.today.toLocaleString()}</p>
              </div>
            </div>
            <div className={styles.revenueCard}>
              <span className={styles.revenueIcon}>📊</span>
              <div>
                <p className={styles.revenueLabel}>This month's Revenue</p>
                <p className={styles.revenueValue}>₱ {revenue.thisMonth.toLocaleString()}</p>
              </div>
            </div>
            <div className={`${styles.revenueCard} ${styles.pendingCard}`}>
              <span className={styles.revenueIcon}>🕐</span>
              <div>
                <p className={styles.revenueLabel}>Pending Payments</p>
                <p className={`${styles.revenueValue} ${styles.pendingValue}`}>
                  ₱ {revenue.pending.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showExport && (
        <PaymentsExportModal onClose={() => setShowExport(false)} />
      )}
      {showViewAll && (
        <ViewAllPaymentsModal
          payments={payments}
          onClose={() => setShowViewAll(false)}
          onAddPayment={() => { setShowViewAll(false); onNavigate("recordPayment"); }}
        />
      )}
    </>
  );
}
