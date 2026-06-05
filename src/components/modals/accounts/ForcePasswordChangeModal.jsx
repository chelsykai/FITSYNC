import { useState } from "react";
import styles from "../Modal.module.css";
import { supabase } from "../../../lib/supabaseClient";

export default function ForcePasswordChangeModal({ user, daysLeft, onSuccess }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword:     "",
    confirmPassword: "",
  });
  const [showCurrent, setShowCurrent]   = useState(false);
  const [showNew,     setShowNew]       = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading,     setLoading]       = useState(false);
  const [error,       setError]         = useState("");
  const [success,     setSuccess]       = useState("");

  const isExpired = daysLeft <= 0;
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    // Validation
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setError("New password must be different from current password.");
      return;
    }

    setLoading(true);
    try {
      const userId = user?.user_id || user?.id;
      
      if (!userId) {
        throw new Error("Could not verify current user. Missing user ID.");
      }

      // Fetch user from system_user table to verify current password
      const { data: userData, error: fetchError } = await supabase
        .from("system_user")
        .select("password")
        .eq("user_id", userId)
        .single();

      if (fetchError || !userData) {
        throw new Error("Failed to verify current user.");
      }

      if (userData.password !== form.currentPassword) {
        throw new Error("Current password is incorrect.");
      }

      // Update system_user table to clear the password change requirement
      const { error: tableError } = await supabase
        .from("system_user")
        .update({
          password: form.newPassword,
        })
        .eq("user_id", userId);

      if (tableError) {
        throw new Error(tableError.message || "Failed to update password. Please try again.");
      }

      // Update session storage
      const stored = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      sessionStorage.setItem("currentUser", JSON.stringify({
        ...stored,
        password: form.newPassword,
      }));

      setSuccess("Password changed successfully!");
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => onSuccess?.(), 1200);
    } catch (err) {
      setError(err.message || "Failed to change password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Close without making any network requests
    setForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setError("");
    setSuccess("");
    // Modal closing is handled by parent component
  };

  const EyeOff = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
  const EyeOn = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 440 }}>

        {/* Icon + Title */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>
            {isExpired ? "⛔" : "🔐"}
          </div>
          <h2 className={styles.modalTitle} style={{ marginBottom: 6 }}>
            {isExpired ? "Password Change Overdue" : "Password Change Required"}
          </h2>

          {/* Deadline banner */}
          <div style={{
            background: isExpired ? "#fff0f0" : daysLeft <= 2 ? "#fff8e0" : "#f0f9ea",
            border: `1px solid ${isExpired ? "#ffcccc" : daysLeft <= 2 ? "#ffe066" : "#b8e08a"}`,
            borderRadius: 10,
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 600,
            color: isExpired ? "#c33" : daysLeft <= 2 ? "#b8860b" : "#3a7d1e",
            fontFamily: "Montserrat, sans-serif",
          }}>
            {isExpired
              ? "⚠ Your deadline has passed. You must change your password to continue."
              : daysLeft === 1
              ? "⚠ Last day! Change your password today."
              : `You have ${daysLeft} working day${daysLeft !== 1 ? "s" : ""} remaining to change your password.`}
          </div>
        </div>

        {isExpired ? (
          <p style={{ textAlign:"center", fontSize:13, color:"#666", fontFamily:"Montserrat,sans-serif", marginBottom:16 }}>
            Contact your administrator to reset your access.
          </p>
        ) : (
          <>
            {/* Current Password */}
            <div className={styles.formGroup} style={{ marginBottom: 12 }}>
              <label className={styles.formLabel}>Current Password</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  className={styles.formInput}
                  type={showCurrent ? "text" : "password"}
                  placeholder="Enter current password"
                  value={form.currentPassword}
                  onChange={set("currentPassword")}
                  disabled={loading}
                  style={{ paddingRight: 40 }}
                  autoComplete="current-password"
                />
                <button 
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{ position:"absolute", right:10, background:"none", border:"none", cursor:"pointer", padding:0 }}
                  tabIndex={-1}
                  disabled={loading}
                >
                  {showCurrent ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className={styles.formGroup} style={{ marginBottom: 12 }}>
              <label className={styles.formLabel}>New Password</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  className={styles.formInput}
                  type={showNew ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={form.newPassword}
                  onChange={set("newPassword")}
                  disabled={loading}
                  style={{ paddingRight: 40 }}
                  autoComplete="new-password"
                />
                <button 
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{ position:"absolute", right:10, background:"none", border:"none", cursor:"pointer", padding:0 }}
                  tabIndex={-1}
                  disabled={loading}
                >
                  {showNew ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className={styles.formGroup} style={{ marginBottom: 16 }}>
              <label className={styles.formLabel}>Confirm New Password</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  className={styles.formInput}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  disabled={loading}
                  onKeyDown={(e) => e.key === "Enter" && !loading && handleSubmit()}
                  style={{ paddingRight: 40 }}
                  autoComplete="new-password"
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position:"absolute", right:10, background:"none", border:"none", cursor:"pointer", padding:0 }}
                  tabIndex={-1}
                  disabled={loading}
                >
                  {showConfirm ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
            </div>

            {/* Error / Success */}
            {error && (
              <p style={{ color:"#e05555", fontSize:12, fontWeight:700, marginBottom:12, fontFamily:"Montserrat,sans-serif" }}>
                ⚠ {error}
              </p>
            )}
            {success && (
              <p style={{ color:"#7eba56", fontSize:12, fontWeight:700, marginBottom:12, fontFamily:"Montserrat,sans-serif" }}>
                ✓ {success}
              </p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button 
                className={styles.addMemberCancelBtn} 
                onClick={handleCancel}
                disabled={loading}
                type="button"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                className={styles.addMemberSubmitBtn}
                onClick={handleSubmit} 
                disabled={loading}
                type="button"
                style={{ flex: 1 }}
              >
                {loading ? "Changing..." : "Change Password"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
