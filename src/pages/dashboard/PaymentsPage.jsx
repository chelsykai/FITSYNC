import { useState } from "react";
import styles from "./PaymentsPage.module.css";
import Sidebar from "../../components/Sidebar/Sidebar";
import PaymentsExportModal from "../../components/modals/payments/PaymentsExportModal";
import ViewAllPaymentsModal from "../../components/modals/payments/ViewAllPaymentsModal";

const stats = {
  totalTransactions: 156,
  activeMemberships: 890,
};

const payments = [
  { id: "00001", name: "Ayvan Lopez",         date: "11/21/2025", type: "Student",  total: 22000, mod: "CASH",  promoCode: "0987", status: "Paid" },
  { id: "00022", name: "Janine Mae Vios",      date: "11/21/2025", type: "Senior",   total: 3500,  mod: "CASH",  promoCode: "8777", status: "Paid" },
  { id: "00014", name: "James Allen Victoria", date: "11/23/2025", type: "PWD",      total: 11000, mod: "GCASH", promoCode: "8777", status: "Pending" },
  { id: "00281", name: "Allyza Mae Magsipoc",  date: "11/23/2025", type: "Regular",  total: 1500,  mod: "BANK",  promoCode: "",     status: "Paid" },
  { id: "00026", name: "Jethro Ramos",         date: "11/26/2025", type: "PWD",      total: 4500,  mod: "CASH",  promoCode: "1237", status: "Paid" },
  { id: "00012", name: "Name",                 date: "11/26/2025", type: "Regular",  total: 1500,  mod: "CASH",  promoCode: "",     status: "Paid" },
  { id: "00342", name: "Name",                 date: "11/26/2025", type: "Regular",  total: 1500,  mod: "GCASH", promoCode: "",     status: "Pending" },
];

const revenue = {
  today: 8230,
  thisMonth: 113130,
  pending: 5600,
};

export default function PaymentsPage({ onNavigate, activePage = "payments" }) {
  const [search, setSearch] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [showViewAll, setShowViewAll] = useState(false);

  const filtered = payments.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.includes(search) ||
    p.type.toLowerCase().includes(search.toLowerCase()) ||
    p.status.toLowerCase().includes(search.toLowerCase())
  );

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
