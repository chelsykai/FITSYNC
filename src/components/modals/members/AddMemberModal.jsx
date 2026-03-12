import { useState } from "react";
import styles from "../Modal.module.css";

const defaultForm = {
  firstName: "", lastName: "", id: "", type: "Student",
  birthday: "", address: "", phone: "", email: "",
};

export default function AddMemberModal({ onClose }) {
  const [newMember, setNewMember] = useState(defaultForm);

  const set = (field) => (e) => setNewMember({ ...newMember, [field]: e.target.value });

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Add New Member</h2>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>First Name</label>
            <input className={styles.formInput} placeholder="First Name"
              value={newMember.firstName} onChange={set("firstName")} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Last Name</label>
            <input className={styles.formInput} placeholder="Last Name"
              value={newMember.lastName} onChange={set("lastName")} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Member ID</label>
            <input className={styles.formInput} placeholder="Member ID"
              value={newMember.id} onChange={set("id")} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Membership Type</label>
            <select className={styles.formInput} value={newMember.type} onChange={set("type")}>
              {["Student", "Regular", "Senior", "PWD"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Birthday</label>
            <input className={styles.formInput} type="date"
              value={newMember.birthday} onChange={set("birthday")} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Phone Number</label>
            <input className={styles.formInput} placeholder="09XXXXXXXXX"
              value={newMember.phone} onChange={set("phone")} />
          </div>
          <div className={styles.formGroupFull}>
            <label className={styles.formLabel}>Address</label>
            <input className={styles.formInput} placeholder="Address"
              value={newMember.address} onChange={set("address")} />
          </div>
          <div className={styles.formGroupFull}>
            <label className={styles.formLabel}>Email</label>
            <input className={styles.formInput} placeholder="email@example.com" type="email"
              value={newMember.email} onChange={set("email")} />
          </div>
        </div>
        <button className={styles.submitBtn}>Add Member</button>
        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
