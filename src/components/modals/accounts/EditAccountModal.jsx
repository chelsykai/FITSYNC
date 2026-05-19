import { useEffect, useState } from "react";
import styles from "../Modal.module.css";
import ReAuthModal from "../../ReAuthModal";

const getInitialForm = (account) => {
  const firstName = account?.firstName || account?.name?.split(" ")[0] || "";
  const lastName  = account?.lastName  || account?.name?.split(" ").slice(1).join(" ") || "";
  return {
    firstName,
    lastName,
    initial:         "",
    role:            account?.role     || "Staff",
    username:        account?.username || account?.email || "",
    password:        "",
    confirmPassword: "",
  };
};

const EyeOff = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const EyeOn = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

export default function EditAccountModal({ account, onClose, onSave }) {
  const [form,        setForm]        = useState(getInitialForm(account));
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReAuth,  setShowReAuth]  = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    setForm(getInitialForm(account));
  }, [account]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSaveClick = () => {
    setSubmitError("");
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setSubmitError("First and last name are required."); return;
    }
    if (form.password && form.password !== form.confirmPassword) {
      setSubmitError("Passwords do not match."); return;
    }
    setShowReAuth(true);
  };

  const handleSave = () => {
    onSave?.({
      ...account,
      firstName: form.firstName,
      lastName:  form.lastName,
      name:      `${form.firstName} ${form.initial ? form.initial + ". " : ""}${form.lastName}`.trim(),
      role:      form.role,
      email:     form.username,
      username:  form.username,
      password:  form.password || undefined,
    });
    onClose();
  };

  return (
    <>
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

          {/* Role + Username */}
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
              <input className={styles.accountInput} placeholder="Enter Username"
                type="text" value={form.username} onChange={set("username")} />
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
                <button type="button" className={styles.eyeBtn} tabIndex={-1}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPass(!showPass); }}>
                  {showPass ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
              <div className={styles.passwordWrapper}>
                <input className={styles.accountInput} placeholder="Enter Password Again"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword} onChange={set("confirmPassword")} />
                <button type="button" className={styles.eyeBtn} tabIndex={-1}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirm(!showConfirm); }}>
                  {showConfirm ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
            </div>
          </div>

          {submitError && (
            <div style={{ color:"#c33", marginTop:6, marginBottom:8, fontSize:13 }}>
              {submitError}
            </div>
          )}

          {/* Footer */}
          <div className={styles.createAccountFooter}>
            <button className={styles.accountCancelBtn} onClick={onClose}>Cancel</button>
            <button className={styles.accountCreateBtn} onClick={handleSaveClick}>
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {showReAuth && (
        <ReAuthModal
          actionLabel="save account changes"
          onSuccess={() => { setShowReAuth(false); handleSave(); }}
          onClose={() => setShowReAuth(false)}
        />
      )}
    </>
  );
}
