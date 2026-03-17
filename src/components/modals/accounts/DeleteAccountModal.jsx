import styles from "../Modal.module.css";

export default function DeleteAccountModal({ account, onClose, onConfirm }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.deleteIcon}>🗑️</div>
        <h2 className={styles.modalTitle}>Delete Account</h2>
        <p className={styles.deleteMessage}>
          Are you sure you want to delete <strong>{account.name}</strong>?
          <br />This action cannot be undone.
        </p>
        <button className={styles.deletConfirmBtn} onClick={() => { onConfirm?.(account); onClose(); }}>
          Yes, Delete
        </button>
        <button className={styles.closeBtn} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
