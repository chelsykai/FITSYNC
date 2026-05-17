import { useState } from "react";
import styles from "./ChangePasswordPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";
import { supabase } from "../../lib/supabaseClient";

export default function ChangePasswordPage({ onNavigate, activePage = "accounts" }) {
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}");

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword:     "",
    confirmPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setError("");
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("All fields are required."); return;
    }
    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters."); return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match."); return;
    }
    if (form.currentPassword === form.newPassword) {
      setError("New password must be different from your current password."); return;
    }

    setLoading(true);
    try {
      // 1. Verify current password
      const { data, error: authErr } = await supabase
        .from("system_user")
        .select("*")
        .eq("user_id", currentUser.user_id)
        .eq("password", form.currentPassword.trim())
        .single();

      if (authErr || !data) {
        setError("Current password is incorrect.");
        setLoading(false);
        return;
      }

      // 2. Update password
      const { error: updateErr } = await supabase
        .from("system_user")
        .update({
          password:                 form.newPassword.trim(),
          password_change_required: false,
          password_change_deadline: null,
          password_changed_at:      new Date().toISOString(),
        })
        .eq("user_id", currentUser.user_id);

      if (updateErr) throw new Error(updateErr.message);

      // 3. Update localStorage
      sessionStorage.setItem("currentUser", JSON.stringify({
        ...currentUser,
        password:                 form.newPassword.trim(),
        password_change_required: false,
        password_change_deadline: null,
      }));

      setSuccess("Password changed successfully! Redirecting...");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => onNavigate("accounts"), 1500);
    } catch (err) {
      setError(err.message || "Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
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

  return (
    <div className={styles.layout}>
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className={styles.content}>
        <h1 className={styles.title}>Change Password</h1>

        <div className={styles.card}>
          {/* User info */}
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {(currentUser.name || currentUser.user_id || "U")[0].toUpperCase()}
            </div>
            <div>
              <p className={styles.userName}>{currentUser.name || currentUser.user_id}</p>
              <p className={styles.userRole}>{currentUser.role || "Staff"}</p>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Form */}
          <div className={styles.form}>
            {/* Current Password */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Current Password</label>
              <div className={styles.inputWrap}>
                <input
                  className={styles.input}
                  type={showCurrent ? "text" : "password"}
                  placeholder="Enter your current password"
                  value={form.currentPassword}
                  onChange={set("currentPassword")}
                  disabled={loading}
                />
                <button className={styles.eyeBtn}
                  onClick={() => setShowCurrent(!showCurrent)} tabIndex={-1}>
                  {showCurrent ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>New Password</label>
              <div className={styles.inputWrap}>
                <input
                  className={styles.input}
                  type={showNew ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={form.newPassword}
                  onChange={set("newPassword")}
                  disabled={loading}
                />
                <button className={styles.eyeBtn}
                  onClick={() => setShowNew(!showNew)} tabIndex={-1}>
                  {showNew ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
              {/* Strength hints */}
              {form.newPassword && (
                <div className={styles.hints}>
                  <span className={form.newPassword.length >= 8 ? styles.hintPass : styles.hintFail}>
                    {form.newPassword.length >= 8 ? "✓" : "✗"} At least 8 characters
                  </span>
                  <span className={/[A-Z]/.test(form.newPassword) ? styles.hintPass : styles.hintFail}>
                    {/[A-Z]/.test(form.newPassword) ? "✓" : "✗"} One uppercase letter
                  </span>
                  <span className={/[0-9]/.test(form.newPassword) ? styles.hintPass : styles.hintFail}>
                    {/[0-9]/.test(form.newPassword) ? "✓" : "✗"} One number
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Confirm New Password</label>
              <div className={styles.inputWrap}>
                <input
                  className={styles.input}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your new password"
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  disabled={loading}
                  onKeyDown={(e) => e.key === "Enter" && !loading && handleSubmit()}
                />
                <button className={styles.eyeBtn}
                  onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                  {showConfirm ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
              {form.confirmPassword && form.newPassword && (
                <span className={form.newPassword === form.confirmPassword ? styles.hintPass : styles.hintFail}>
                  {form.newPassword === form.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                </span>
              )}
            </div>

            {/* Error / Success */}
            {error && <div className={styles.errorMsg}>⚠ {error}</div>}
            {success && <div className={styles.successMsg}>✓ {success}</div>}

            {/* Buttons */}
            <div className={styles.btnRow}>
              <button className={styles.cancelBtn}
                onClick={() => onNavigate("accounts")} disabled={loading}>
                Cancel
              </button>
              <button className={styles.submitBtn}
                onClick={handleSubmit} disabled={loading}>
                {loading ? "Saving..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
