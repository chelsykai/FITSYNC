import { useState } from "react";
import styles from "../Modal.module.css";
import PaymentReceiptModal from "./PaymentReceiptModal";

export default function ViewAllPaymentsModal({ payments, onClose, onAddPayment }) {
  const [receipt, setReceipt] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = payments.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.includes(search) ||
    p.type.toLowerCase().includes(search.toLowerCase()) ||
    p.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.viewAllPaymentsModal} onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className={styles.paymentModalHeader}>
            <h2 className={styles.paymentModalTitle}>Payment Records Table</h2>
            <button className={styles.modalCloseX} onClick={onClose}>✕</button>
          </div>

          {/* Search */}
          <div className={styles.paymentModalSearch}>
            <span>☰</span>
            <input
              type="text"
              placeholder="Search...."
              className={styles.modalSearchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span>🔍</span>
          </div>

          {/* Table */}
          <table className={styles.modalTable}>
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Name</th>
                <th>Payment Date</th>
                <th>Membership Type</th>
                <th>Total</th>
                <th>MOD</th>
                <th>Promo Code</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>
                    <span className={styles.paymentNameLink} onClick={() => setReceipt(p)}>
                      {p.name}
                    </span>
                  </td>
                  <td>{p.date}</td>
                  <td>{p.type}</td>
                  <td>{p.total.toLocaleString()}</td>
                  <td>{p.mod || "CASH"}</td>
                  <td>{p.promoCode || "—"}</td>
                  <td>
                    <span className={`${styles.badge} ${p.status === "Paid" ? styles.badgePaid : styles.badgePending}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.receiptActions}>
                      <button className={styles.receiptLinkBtn} onClick={() => setReceipt(p)}>view</button>
                      <span className={styles.receiptDivider}>|</span>
                      <button className={styles.receiptLinkBtn} onClick={() => setReceipt(p)}>receipt</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className={styles.noResults}>No records found.</td></tr>
              )}
            </tbody>
          </table>

          {/* Footer */}
          <div className={styles.paymentModalFooter}>
            <div className={styles.paymentModalFooterLeft}>
              <button className={styles.exportSheetsBtn}>Export to Sheets</button>
              <button className={styles.printBtn}>Print</button>
            </div>
            <button className={styles.addRecordBtn} onClick={onAddPayment}>
              Add / Record Payment
            </button>
          </div>
        </div>
      </div>

      {/* Receipt modal stacked on top */}
      {receipt && (
        <PaymentReceiptModal
          payment={receipt}
          onClose={() => setReceipt(null)}
          onAddPayment={() => { setReceipt(null); onAddPayment(); }}
        />
      )}
    </>
  );
}
