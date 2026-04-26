import { useState } from "react";
import styles from "../Modal.module.css";

const nextId = (accounts) => {
  const numericIds = (accounts || [])
    .map((a) => parseInt(a.id, 10))
    .filter((value) => !Number.isNaN(value));
  const max = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  return String(max + 1);
};

export default function CreateAccountModal({ accounts, onClose, onCreate }) {
  const generatedId = nextId(accounts);
  const [form, setForm] = useState({
    firstName: "", lastName: "", MI: "",
    role: "", username: "", password: "", confirmPassword: "",
  });
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

<<<<<<< HEAD
  const handleCreate = () => {
    if (!form.firstName || !form.role || !form.username || !form.password) return;
    onCreate?.({
      id: generatedId,
      name: `${form.firstName} ${form.initial ? form.initial + ". " : ""}${form.lastName}`.trim(),
      role: form.role,
      username: form.username,
    });
    onClose();
=======
  const handleCreate = async () => {
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const username = form.email.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    setSubmitError("");

    if (!firstName || !lastName || !form.role || !username || !password) {
      setSubmitError("Please complete all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match.");
        password,
        status: "active",
      });
      const username = form.username.trim();
    } catch (err) {
      setSubmitError(err?.message || "Failed to create account.");
    } finally {
      setSubmitting(false);
    }
>>>>>>> 4a4f810 (Feat: create account modal functional)
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
            <label className={styles.accountLabel}>Username</label>
<<<<<<< HEAD
            <input className={styles.accountInput} placeholder="Enter Username" type="username"
              value={form.username} onChange={set("username")} />
=======
            <input className={styles.accountInput} placeholder="Enter Username" type="text"
              value={form.email} onChange={set("email")} />
>>>>>>> 4a4f810 (Feat: create account modal functional)
          </div>
        </div>

        {/* Password */}
        <div className={styles.accountFieldGroup}>
          <label className={styles.accountLabel}>Password</label>
          <div className={styles.passwordRow}>
                value={form.MI} onChange={set("MI")} />
              <input
                className={styles.accountInput}
                placeholder="Enter Password"
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
              />
              <button className={styles.eyeBtn} type="button" onClick={() => setShowPass(!showPass)}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            <div className={styles.passwordWrapper}>
              <input
                className={styles.accountInput}
                placeholder="Enter Password Again"
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
              </button>
                value={form.username} onChange={set("username")} />
        </div>

        {submitError && (
          <div style={{ color: "#c33", marginTop: "6px", marginBottom: "8px", fontSize: "14px" }}>
            {submitError}
          </div>
        )}

        {/* Footer */}
        <div className={styles.createAccountFooter}>
          <button className={styles.accountCancelBtn} onClick={onClose} disabled={submitting}>Cancel</button>
          <button className={styles.accountCreateBtn} onClick={handleCreate} disabled={submitting}>
            {submitting ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
