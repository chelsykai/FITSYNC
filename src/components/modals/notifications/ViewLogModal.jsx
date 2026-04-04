import styles from "../Modal.module.css";

export default function ViewLogModal({ notification, onClose }) {
  if (!notification) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.viewLogModal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalCloseX} onClick={onClose}>✕</button>

        {/* Avatar */}
        <div className={styles.logAvatar}>👤</div>

        {/* Status badge */}
        <div className={styles.logStatusBadge}>
          <span className={styles.logDot} />
          ACTIVE / CHECK-IN
        </div>

        {/* Details */}
        <div className={styles.logDetails}>
          <p className={styles.logDetailLabel}>Time In:</p>
          <p className={styles.logDetailValue}>9:00 AM</p>

          <p className={styles.logDetailLabel}>Client Type:</p>
          <p className={styles.logDetailValue}>Visitor</p>

          <p className={styles.logDetailLabel}>Pass Type:</p>
          <p className={styles.logDetailValue}>Walk-in</p>
        </div>

        {/* Buttons */}
        <button className={styles.printLogBtn}>PRINT LOG</button>
        <button className={styles.markLogoutBtn}>MARK AS LOG-OUT</button>
      </div>
    </div>
  );
}
