import styles from "./Modal.module.css";

export default function ConfirmModal({ title = "Confirm", message, onConfirm, onClose, confirmText = "Yes", cancelText = "Cancel", loading = false, error }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.deleteIcon}>⚠️</div>
        <h2 className={styles.modalTitle}>{title}</h2>
        <p className={styles.deleteMessage}>{message}</p>
        {error && (
          <div style={{
            color: "#d32f2f",
            backgroundColor: "#ffebee",
            padding: "12px",
            borderRadius: "4px",
            marginBottom: "16px",
            fontSize: "14px"
          }}>{error}</div>
        )}
        <button className={styles.deletConfirmBtn} onClick={onConfirm} disabled={loading}>
          {loading ? "Working..." : confirmText}
        </button>
        <button className={styles.closeBtn} onClick={onClose} disabled={loading}>{cancelText}</button>
      </div>
    </div>
  );
}
