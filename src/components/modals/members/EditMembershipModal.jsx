import { useState } from "react";
import styles from "../Modal.module.css";
import { updateMember } from "../../../services/memberService";
import ReAuthModal from "../../ReAuthModal";

export default function EditMembershipModal({ member, onClose, onSaved }) {
  const [form, setForm] = useState({
    membership_type: member.membership_type || "",
    expiration_date: member.expiration_date || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showReAuth, setShowReAuth] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSaveClick = () => setShowReAuth(true);

  const handleReAuthSuccess = async () => {
    setShowReAuth(false);
    try {
      setLoading(true);
      setError(null);

      const updates = {};

      if (form.membership_type !== member.membership_type) {
        updates.membership_type = form.membership_type;
      }
      if (form.expiration_date !== member.expiration_date) {
        updates.expiration_date = form.expiration_date || null;
      }

      // Only call updateMember if there are actual changes
      if (Object.keys(updates).length === 0) {
        alert("No changes made");
        onClose();
        return;
      }

      const updatedMember = await updateMember(member.member_id, updates);
      onSaved?.(updatedMember);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save changes");
      console.error("Error saving membership:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.profileModal} onClick={(e) => e.stopPropagation()}>
          <h2 className={styles.modalTitle} style={{ padding: "20px 28px 0", marginBottom: "16px" }}>
            Edit Membership
          </h2>

          {error && (
            <div style={{ color: "#d32f2f", backgroundColor: "#ffebee", padding: "12px", borderRadius: "4px", marginBottom: "16px", fontSize: "14px", margin: "0 28px 16px" }}>
              {error}
            </div>
          )}

          <div style={{ padding: "0 28px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", width: "100%" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label className={styles.formLabel} style={{ margin: 0 }}>
                  Membership Type
                </label>
                <select className={styles.formInput} value={form.membership_type} onChange={set("membership_type")}>
                  <option value="">Select Type</option>
                  {["Student", "Regular", "Senior", "PWD"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label className={styles.formLabel} style={{ margin: 0 }}>
                  Expiration Date
                </label>
                <input
                  className={styles.formInput}
                  type="date"
                  value={form.expiration_date}
                  onChange={set("expiration_date")}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", padding: "16px 28px", borderTop: "1px solid #eee", flexWrap: "wrap" }}>
            <button
              className={styles.submitBtn}
              onClick={handleSaveClick}
              disabled={loading}
              style={{ flex: 1, minWidth: "140px", margin: 0 }}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              className={styles.closeBtn}
              onClick={onClose}
              disabled={loading}
              style={{ flex: 1, minWidth: "140px", margin: 0 }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {showReAuth && (
        <ReAuthModal
          actionLabel="save membership changes"
          onSuccess={handleReAuthSuccess}
          onClose={() => setShowReAuth(false)}
        />
      )}
    </>
  );
}
