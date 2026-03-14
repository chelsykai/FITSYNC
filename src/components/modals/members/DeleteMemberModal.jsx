import styles from "../Modal.module.css";

export default function DeleteMemberModal({ member, onClose, onConfirm }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.deleteIcon}>🗑️</div>
        <h2 className={styles.modalTitle}>Delete Member</h2>
        <p className={styles.deleteMessage}>
          Are you sure you want to delete <strong>{member.name}</strong>?
          <br />This action cannot be undone.
        </p>
        <button className={styles.deletConfirmBtn} onClick={() => onConfirm?.(member)}>
          Yes, Delete
        </button>
        <button className={styles.closeBtn} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
