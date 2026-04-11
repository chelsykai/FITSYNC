import { useState } from "react";
import styles from "../Modal.module.css";
import { updateMember } from "../../../services/memberService";

export default function EditMemberModal({ member, onClose, onSave }) {
  const [form, setForm] = useState({
    firstName:        (member.full_name?.split(" ")[0]) || "",
    lastName:         (member.full_name?.split(" ").slice(1).join(" ")) || "",
    member_id:        member.member_id || "",
    membership_type:  member.membership_type || "",
    birthday:         member.birthday || "",
    address:          member.address || "",
    phone:            member.phone || "",
    email:            member.email || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const updates = {
        full_name: `${form.firstName} ${form.lastName}`.trim(),
        membership_type: form.membership_type,
        birthday: form.birthday || null,
        address: form.address || null,
        phone: form.phone || null,
        email: form.email || null,
      };

      const updatedMember = await updateMember(member.member_id, updates);
      onSave?.(updatedMember);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save changes");
      console.error("Error saving member:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Edit Member</h2>

        {error && (
          <div style={{
            color: "#d32f2f",
            backgroundColor: "#ffebee",
            padding: "12px",
            borderRadius: "4px",
            marginBottom: "16px",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>First Name</label>
            <input className={styles.formInput} placeholder="First Name"
              value={form.firstName} onChange={set("firstName")} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Last Name</label>
            <input className={styles.formInput} placeholder="Last Name"
              value={form.lastName} onChange={set("lastName")} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Member ID</label>
            <input className={styles.formInput} placeholder="Member ID"
              value={form.member_id} disabled />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Membership Type</label>
            <select className={styles.formInput} value={form.membership_type} onChange={set("membership_type")}>
              <option value="">Select Type</option>
              {["Student", "Regular", "Senior", "PWD"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Birthday</label>
            <input className={styles.formInput} type="date"
              value={form.birthday} onChange={set("birthday")} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Phone Number</label>
            <input className={styles.formInput} placeholder="09XXXXXXXXX"
              value={form.phone} onChange={set("phone")} />
          </div>
          <div className={styles.formGroupFull}>
            <label className={styles.formLabel}>Address</label>
            <input className={styles.formInput} placeholder="Address"
              value={form.address} onChange={set("address")} />
          </div>
          <div className={styles.formGroupFull}>
            <label className={styles.formLabel}>Email</label>
            <input className={styles.formInput} placeholder="email@example.com" type="email"
              value={form.email} onChange={set("email")} />
          </div>
        </div>
        <button className={styles.submitBtn} onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
        <button className={styles.closeBtn} onClick={onClose} disabled={loading}>Cancel</button>
      </div>
    </div>
  );
}
