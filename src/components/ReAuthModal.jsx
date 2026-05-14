import { useState, useEffect, useRef } from "react";
import styles from "./ReAuthModal.module.css";

export default function ReAuthModal({ actionLabel = "continue", onSuccess, onClose }) {
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [shake,    setShake]    = useState(false);
  const inputRef = useRef(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleConfirm = async () => {
    if (!password.trim()) {
      setError("Password is required.");
      triggerShake();
      return;
    }
    setLoading(true);
    setError("");
    try {
      // ── Replace this block with your real auth check ──
      // e.g. Supabase:
      //   const { error } = await supabase.auth.signInWithPassword({
      //     email: currentUser.email,
      //     password,
      //   });
      //   if (error) throw new Error("Incorrect password.");
      // ── Simulated 800ms check for now ──
      await new Promise((res) => setTimeout(res, 800));
      const DEMO_PASSWORD = "admin123"; // remove when wired to real auth
      if (password !== DEMO_PASSWORD) throw new Error("Incorrect password. Access denied.");
      onSuccess();
    } catch (err) {
      setError(err.message || "Authentication failed. Try again.");
      setPassword("");
      triggerShake();
      setTimeout(() => inputRef.current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.card} ${shake ? styles.shake : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className={styles.iconWrap}>
          <span className={styles.lockIcon}>🔒</span>
        </div>

        {/* Title */}
        <h2 className={styles.title}>Admin Verification</h2>
        <p className={styles.subtitle}>
          Re-enter your password to <strong>{actionLabel}</strong>.
        </p>

        {/* Input */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Admin Password</label>
          <div className={`${styles.inputWrap} ${error ? styles.inputError : ""}`}>
            <span className={styles.inputIcon}>🔑</span>
            <input
              ref={inputRef}
              type="password"
              className={styles.input}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleConfirm()}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className={styles.errorMsg}>⚠ {error}</p>
          )}
        </div>

        {/* Buttons */}
        <div className={styles.btnRow}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`${styles.confirmBtn} ${loading ? styles.confirmLoading : ""}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              "Confirm"
            )}
          </button>
        </div>

        {/* Warning note */}
        <p className={styles.warningNote}>
          🛡 This action is logged in the audit trail.
        </p>
      </div>
    </div>
  );
}
