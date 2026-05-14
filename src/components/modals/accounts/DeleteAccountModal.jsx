import { useState } from "react";
import styles from "../Modal.module.css";
import ReAuthModal from "../../ReAuthModal";

export default function DeleteAccountModal({ account, onClose, onConfirm }) {
  const [showReAuth, setShowReAuth] = useState(false);

  const handleDeleteClick = () => setShowReAuth(true);

  const handleReAuthSuccess = () => {
    setShowReAuth(false);
    onConfirm?.(account);
    onClose();
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.deleteIcon}>🗑️</div>
          <h2 className={styles.modalTitle}>Delete Account</h2>
          <p className={styles.deleteMessage}>
            Are you sure you want to delete <strong>{account.name}</strong>?
            <br />This action cannot be undone.
          </p>
          <button className={styles.deletConfirmBtn} onClick={handleDeleteClick}>
            Yes, Delete
          </button>
          <button className={styles.closeBtn} onClick={onClose}>Cancel</button>
        </div>
      </div>

      {showReAuth && (
        <ReAuthModal
          actionLabel="delete this account"
          onSuccess={handleReAuthSuccess}
          onClose={() => setShowReAuth(false)}
        />
      )}
    </>
  );
}