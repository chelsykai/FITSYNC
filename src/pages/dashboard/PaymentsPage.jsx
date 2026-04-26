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
    const { data, error } = await supabase
      .from("record_payment")
      .select(`
        transaction_id,
        date,
        amount_paid,
        status,
        member_id,
        members(full_name, membership_type)
      `)
      .order("date", { ascending: false });

    if (error) throw error;

    return data.map((record) => ({
      id: record.member_id,
      name: record.members?.full_name || "Unknown",
      date: new Date(record.date).toLocaleDateString("en-US"),
      type: record.members?.membership_type || "Unknown",
      total: record.amount_paid,
      status: record.status,
    })) || [];
  } catch (err) {
    console.error("Error fetching payments:", err);
    return [];
  }
};

/**
 * Calculate revenue stats
 */
const calculateStats = (payments) => {
  const today = new Date().toDateString();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  let todayRevenue = 0;
  let monthRevenue = 0;
  let pendingRevenue = 0;

  payments.forEach((p) => {
    const paymentDate = new Date(p.date).toDateString();
    const paymentAmount = p.total;

    if (paymentDate === today && p.status === "Paid") {
      todayRevenue += paymentAmount;
    }

    if (new Date(p.date) >= monthStart && p.status === "Paid") {
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
  const [search, setSearch] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [showViewAll, setShowViewAll] = useState(false);

  useEffect(() => {
    const loadPayments = async () => {
      setLoading(true);
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
                {filtered.map((p) => (
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
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className={styles.noResults}>No records found.</td></tr>
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
