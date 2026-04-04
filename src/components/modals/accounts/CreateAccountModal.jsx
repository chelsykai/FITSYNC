import { useState } from "react";
import styles from "../Modal.module.css";

const nextId = (accounts) => {
  const max = Math.max(...accounts.map((a) => parseInt(a.id)));
  return String(max + 1);
};

export default function CreateAccountModal({ accounts, onClose, onCreate }) {
  const generatedId = nextId(accounts);
  const [form, setForm] = useState({
    firstName: "", lastName: "", initial: "",
    role: "", email: "", password: "", confirmPassword: "",
  });
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleCreate = () => {
    if (!form.firstName || !form.role || !form.email || !form.password) return;
    onCreate?.({
      id: generatedId,
      name: `${form.firstName} ${form.initial ? form.initial + ". " : ""}${form.lastName}`.trim(),
      role: form.role,
      email: form.email,
    });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.createAccountModal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalCloseX} onClick={onClose}>✕</button>
        <h2 className={styles.createAccountTitle}>Create Account</h2>

        {/* Staff ID */}
        <div className={styles.accountFieldGroup}>
          <label className={styles.accountLabel}>Staff ID</label>
          <div className={styles.staffIdRow}>
            <div className={styles.staffIdBadge}>{generatedId}</div>
            <input className={styles.staffIdInput} value="Automatically Generated ID" disabled />
          </div>
        </div>

        {/* Name */}
        <div className={styles.accountFieldGroup}>
          <label className={styles.accountLabel}>Name</label>
          <div className={styles.nameRow}>
            <input className={styles.accountInput} placeholder="First Name"
              value={form.firstName} onChange={set("firstName")} />
            <input className={styles.accountInput} placeholder="Last Name"
              value={form.lastName} onChange={set("lastName")} />
            <input className={`${styles.accountInput} ${styles.initialInput}`} placeholder="Initial"
              value={form.initial} onChange={set("initial")} />
          </div>
        </div>

        {/* Role + Email */}
        <div className={styles.accountTwoCol}>
          <div className={styles.accountFieldGroup}>
            <label className={styles.accountLabel}>Role</label>
            <div className={styles.selectWrapper}>
              <select className={styles.accountSelect} value={form.role} onChange={set("role")}>
                <option value="" disabled>Select Role</option>
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
          </div>
          <div className={styles.accountFieldGroup}>
            <label className={styles.accountLabel}>Email</label>
            <input className={styles.accountInput} placeholder="Enter Email Address" type="email"
              value={form.email} onChange={set("email")} />
          </div>
        </div>

        {/* Password */}
        <div className={styles.accountFieldGroup}>
          <label className={styles.accountLabel}>Password</label>
          <div className={styles.passwordRow}>
            <div className={styles.passwordWrapper}>
              <input
                className={styles.accountInput}
                placeholder="Enter Password"
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
              />
              <button className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            <div className={styles.passwordWrapper}>
              <input
                className={styles.accountInput}
                placeholder="Enter Password Again"
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
              />
              <button className={styles.eyeBtn} onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.createAccountFooter}>
          <button className={styles.accountCancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.accountCreateBtn} onClick={handleCreate}>Create</button>
        </div>
      </div>
    </div>
  );
}
