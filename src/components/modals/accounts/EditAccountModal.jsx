import { useEffect, useState } from "react";
import styles from "../Modal.module.css";

const getInitialForm = (account) => {
  const firstName = account?.firstName || account?.name?.split(" ")[0] || "";
  const lastName =
    account?.lastName ||
    account?.name?.split(" ").slice(1).join(" ") ||
    "";

  return {
    firstName,
    lastName,
    initial: "",
    role: account?.role || "Staff",
    username: account?.username || account?.email || "",
    password: "",
    confirmPassword: "",
  };
};

export default function EditAccountModal({ account, onClose, onSave }) {
  const [form, setForm] = useState(getInitialForm(account));
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setForm(getInitialForm(account));
  }, [account]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSave = () => {
    onSave?.({
      ...account,
      name: `${form.firstName} ${form.initial ? form.initial + ". " : ""}${form.lastName}`.trim(),
      firstName: form.firstName,
      lastName: form.lastName,
      role: form.role,
      username: form.username,
      email: form.username,
    });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.createAccountModal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalCloseX} onClick={onClose}>✕</button>
        <h2 className={styles.createAccountTitle}>Edit Account</h2>

        {/* Staff ID */}
        <div className={styles.accountFieldGroup}>
          <label className={styles.accountLabel}>Staff ID</label>
          <div className={styles.staffIdRow}>
            <div className={styles.staffIdBadge}>{account.id}</div>
            <input className={styles.staffIdInput} value={account.id} disabled />
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
                <option value="Admin">Admin</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
          </div>
          <div className={styles.accountFieldGroup}>
            <label className={styles.accountLabel}>Username</label>
            <input className={styles.accountInput} placeholder="Enter Username" type="username"
              value={form.username} onChange={set("username")} />
          </div>
        </div>

        {/* Password */}
        <div className={styles.accountFieldGroup}>
          <label className={styles.accountLabel}>Password</label>
          <div className={styles.passwordRow}>
            <div className={styles.passwordWrapper}>
              <input className={styles.accountInput} placeholder="Enter New Password"
                type={showPass ? "text" : "password"}
                value={form.password} onChange={set("password")} />
              <button className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            <div className={styles.passwordWrapper}>
              <input className={styles.accountInput} placeholder="Enter Password Again"
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword} onChange={set("confirmPassword")} />
              <button className={styles.eyeBtn} onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.createAccountFooter}>
          <button className={styles.accountCancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.accountCreateBtn} onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
