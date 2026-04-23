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
              <th>Join Date</th>
              <th>Membership Type</th>
              <th>Monthly Validity</th>
              <th>Membership Validity</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.member_id}>
                <td>{m.member_id}</td>
                <td>{m.full_name}</td>
                <td>{m.join_date ? new Date(m.join_date).toLocaleDateString() : "N/A"}</td>
                <td>{m.membership_type}</td>
                <td>{m.monthly_validity}</td>
                <td>{m.membership_validity}</td>
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
