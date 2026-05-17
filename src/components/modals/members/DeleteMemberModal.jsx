import { useState } from "react";
import styles from "../Modal.module.css";
import { deleteMember } from "../../../services/memberService";
import ReAuthModal from "../../ReAuthModal";

export default function DeleteMemberModal({ member, onClose, onConfirm }) {
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [showReAuth,  setShowReAuth]  = useState(false);

  const handleDeleteClick = () => setShowReAuth(true);

  const handleReAuthSuccess = async () => {
    setShowReAuth(false);
    try {
      setLoading(true);
      setError(null);
      await deleteMember(member.member_id, member);
      onConfirm?.(member);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to delete member");
      console.error("Error deleting member:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.deleteIcon}>🗑️</div>
          <h2 className={styles.modalTitle}>Delete Member</h2>
          <p className={styles.deleteMessage}>
            Are you sure you want to delete <strong>{member.full_name}</strong>?
            <br />This action cannot be undone.
          </p>
          {error && (
            <div style={{ color:"#d32f2f", backgroundColor:"#ffebee", padding:"12px", borderRadius:"4px", marginBottom:"16px", fontSize:"14px" }}>
              {error}
            </div>
          )}
          <button
            className={styles.deletConfirmBtn}
            onClick={handleDeleteClick}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Yes, Delete"}
          </button>
          <button className={styles.closeBtn} onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>

      {showReAuth && (
        <ReAuthModal
          actionLabel="delete this member"
          onSuccess={handleReAuthSuccess}
          onClose={() => setShowReAuth(false)}
        />
      )}
    </>
  );
}
