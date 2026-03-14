import { useState } from "react";
import styles from "../Modal.module.css";

export default function EditMemberModal({ member, onClose, onSave }) {
  const [form, setForm] = useState({
    firstName: member.name.split(" ")[0] || "",
    lastName:  member.name.split(" ").slice(1).join(" ") || "",
    id:        member.id,
    type:      member.type,
    birthday:  member.birthday,
    address:   member.address,
    phone:     member.phone,
    email:     member.email,
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Edit Member</h2>
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
              value={form.id} onChange={set("id")} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Membership Type</label>
            <select className={styles.formInput} value={form.type} onChange={set("type")}>
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
        <button className={styles.submitBtn} onClick={() => onSave?.(form)}>Save Changes</button>
        <button className={styles.closeBtn} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
