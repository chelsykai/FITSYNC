import styles from "../Modal.module.css";

export default function ViewAllModal({ members, onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.wideModal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Memberships Expiring Soon</h2>
        <table className={styles.modalTable}>
          <thead>
            <tr>
              <th>Member ID</th>
              <th>Name</th>
              <th>Date</th>
              <th>Membership Type</th>
              <th>Monthly Validity</th>
              <th>Membership Validity</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>{m.id}</td>
                <td>{m.name}</td>
                <td>{m.date}</td>
                <td>{m.type}</td>
                <td>{m.monthly}</td>
                <td>{m.validity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.viewAllWrapper}>
          <button className={styles.viewAllBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
