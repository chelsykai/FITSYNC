import styles from "../Modal.module.css";

// Mock transaction history per member
const mockTransactions = [
  { date: "11/21/2025", txId: "00326", desc: "Monthly Fee", promo: "00326", amount: 500,  mod: "Cash", status: "UNPAID" },
  { date: "11/21/2025", txId: "00426", desc: "Monthly Fee", promo: "00326", amount: 200,  mod: "Cash", status: "PAID" },
  { date: "11/21/2025", txId: "00023", desc: "Monthly Fee", promo: "00326", amount: 200,  mod: "Cash", status: "PAID" },
  { date: "11/21/2025", txId: "00027", desc: "Monthly Fee", promo: "00326", amount: 200,  mod: "Cash", status: "PAID" },
  { date: "11/21/2025", txId: "00024", desc: "Monthly Fee", promo: "00326", amount: 200,  mod: "Cash", status: "PAID" },
];

export default function PaymentReceiptModal({ payment, onClose, onAddPayment }) {
  const firstName = payment.name.split(" ")[0];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.receiptModal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.paymentModalHeader}>
          <h2 className={styles.paymentModalTitle}>{firstName}'s Payment Records</h2>
          <button className={styles.modalCloseX} onClick={onClose}>✕</button>
        </div>

        {/* Member Info Card */}
        <div className={styles.receiptMemberCard}>
          <div className={styles.receiptAvatar}>👤</div>
          <div className={styles.receiptMemberInfo}>
            <div className={styles.receiptInfoCol}>
              <p className={styles.receiptInfoLabel}>Name:</p>
              <p className={styles.receiptInfoValue}>{payment.name}</p>
              <p className={styles.receiptInfoLabel}>Membership Type:</p>
              <p className={styles.receiptInfoValue}>{payment.type}</p>
            </div>
            <div className={styles.receiptInfoCol}>
              <p className={styles.receiptInfoLabel}>Client Type:</p>
              <p className={styles.receiptInfoValue}>Member</p>
              <p className={styles.receiptInfoLabel}>Pass Type:</p>
              <p className={styles.receiptInfoValue}>Walk-in</p>
            </div>
            <div className={styles.receiptInfoCol}>
              <p className={styles.receiptInfoLabel}>Due Date:</p>
              <p className={styles.receiptInfoValue}>01/05/2026</p>
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <table className={styles.modalTable}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Transaction ID</th>
              <th>Description</th>
              <th>Promo Code</th>
              <th>Amount</th>
              <th>MOD</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {mockTransactions.map((tx, i) => (
              <tr key={i}>
                <td>{tx.date}</td>
                <td>{tx.txId}</td>
                <td>{tx.desc}</td>
                <td>{tx.promo}</td>
                <td>{tx.amount}</td>
                <td>{tx.mod}</td>
                <td>
                  <span className={`${styles.badge} ${tx.status === "PAID" ? styles.badgePaid : styles.badgeUnpaid}`}>
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
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
  );
}
