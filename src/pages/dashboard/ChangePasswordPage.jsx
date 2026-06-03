import { useState } from "react";
import styles from "./ChangePasswordPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";
import ConfirmModal from "../../components/modals/ConfirmModal";
import { supabase } from "../../lib/supabaseClient";

// ── Validation ────────────────────────────────────────────────────────────────
const SPECIAL_CHAR_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

function validate(current, next, confirm) {
  if (!current) return "Please enter your current password.";
  if (!next) return "Please enter a new password.";
  if (next.length < 6) return "New password must be at least 6 characters.";
  if (!SPECIAL_CHAR_RE.test(next)) return "New password must contain at least one special character.";
  if (next === current) return "New password must be different from your current password.";
  if (next !== confirm) return "Passwords do not match.";
  return null;
}

// ── Placeholder API call — backend dev: replace this function ─────────────────
async function changePasswordApi(userId, currentPassword, newPassword) {
  // TODO: replace with real endpoint, e.g.:
  // const res = await fetch("/api/users/change-password", {
  //   method: "PUT",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ userId, currentPassword, newPassword }),
  // });
  // if (!res.ok) throw new Error((await res.json()).message || "Failed.");

  // ── Supabase placeholder ──────────────────────────────────────────────────
  const { data, error: fetchError } = await supabase
    .from("system_user")
    .select("password")
    .eq("user_id", userId)
    .single();

  if (fetchError || !data) throw new Error("Could not verify current password.");
  if (data.password !== currentPassword) throw new Error("Current password is incorrect.");

  const { error: updateError } = await supabase
    .from("system_user")
    .update({
      password: newPassword,
      password_change_required: false,
      password_change_deadline: null,
    })
    .eq("user_id", userId);

  if (updateError) throw new Error("Failed to update password. Please try again.");
}

// ── Eye icon SVG ──────────────────────────────────────────────────────────────
function EyeIcon({ visible }) {
  return visible ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

// ── Password field ─────────────────────────────────────────────────────────────
function PasswordField({ label, value, onChange, show, onToggle, disabled, id }) {
  return (
    <div className={styles.fieldGroup}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <div className={styles.inputWrap}>
        <input
          id={id}
          type={show ? "text" : "password"}
          className={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete="off"
        />
        <button
          type="button"
          className={styles.eyeBtn}
          onClick={onToggle}
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          <EyeIcon visible={show} />
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ChangePasswordPage({ onNavigate, userRole = "staff", isAdmin = false }) {
  const currentUser = (() => {
    try { return JSON.parse(sessionStorage.getItem("currentUser") || "{}"); }
    catch { return {}; }
  })();

  const [current,  setCurrent]  = useState("");
  const [next,     setNext]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showC,    setShowC]    = useState(false);
  const [showN,    setShowN]    = useState(false);
  const [showCf,   setShowCf]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalError, setModalError] = useState("");

  const role = String(userRole || "staff").toLowerCase();
  const activeSidebarPage = isAdmin ? "accounts" : "overview";

  // Requirements checklist state
  const reqs = [
    { label: "At least 6 characters",      met: next.length >= 6 },
    { label: "One special character",       met: SPECIAL_CHAR_RE.test(next) },
    { label: "Different from current",      met: next.length > 0 && next !== current },
    { label: "Passwords match",             met: next.length > 0 && next === confirm },
  ];

  const handleSubmitClick = () => {
    const err = validate(current, next, confirm);
    if (err) { setError(err); return; }
    setError("");
    setModalError("");
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setModalError("");
    try {
      await changePasswordApi(currentUser.user_id, current, next);

      // Update session so password_change_required is cleared
      const updated = { ...currentUser, password: next, password_change_required: false, password_change_deadline: null };
      sessionStorage.setItem("currentUser", JSON.stringify(updated));

      setShowConfirmModal(false);
      // Redirect to login after success
      onNavigate("logout");
    } catch (err) {
      setModalError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar activePage={activeSidebarPage} onNavigate={onNavigate} isAdmin={isAdmin} />

      <main className={styles.content}>
        {/* Hero */}
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Account settings</p>
            <h1 className={styles.title}>Change Password</h1>
            <p className={styles.subtitle}>
              Update your password regularly to keep your account secure.
              You are signed in as <strong>{role}</strong>.
            </p>
          </div>

          <div className={styles.statusCard}>
            <span className={styles.statusLabel}>Signed in as</span>
            <strong className={styles.statusValue}>{currentUser.user_id || "—"}</strong>
            <p className={styles.statusNote}>
              {isAdmin ? "Admin account — full system access." : "Staff account — limited access."}
            </p>
          </div>
        </section>

        {/* Form card */}
        <section className={styles.formCard}>
          <div className={styles.formHeader}>
            <span className={styles.formIconWrap} aria-hidden="true">
              <span className="ti ti-lock" style={{ fontSize: 22 }} />
            </span>
            <div>
              <p className={styles.formCardTitle}>New password</p>
              <p className={styles.formCardSub}>Fill in all fields to update your credentials.</p>
            </div>
          </div>

          <div className={styles.fields}>
            <PasswordField
              id="current"
              label="Current password"
              value={current}
              onChange={setCurrent}
              show={showC}
              onToggle={() => setShowC((v) => !v)}
              disabled={loading}
            />
            <PasswordField
              id="new"
              label="New password"
              value={next}
              onChange={setNext}
              show={showN}
              onToggle={() => setShowN((v) => !v)}
              disabled={loading}
            />
            <PasswordField
              id="confirm"
              label="Confirm new password"
              value={confirm}
              onChange={setConfirm}
              show={showCf}
              onToggle={() => setShowCf((v) => !v)}
              disabled={loading}
            />
          </div>

          {/* Requirements checklist */}
          {next.length > 0 && (
            <ul className={styles.reqList}>
              {reqs.map((r) => (
                <li key={r.label} className={r.met ? styles.reqMet : styles.reqUnmet}>
                  <span className={`ti ${r.met ? "ti-circle-check" : "ti-circle-x"}`} aria-hidden="true" />
                  {r.label}
                </li>
              ))}
            </ul>
          )}

          {error && <p className={styles.errorText}>{error}</p>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => onNavigate(isAdmin ? "adminDashboard" : "staffDashboard")}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.submitBtn}
              onClick={handleSubmitClick}
              disabled={loading}
            >
              <span className="ti ti-lock" aria-hidden="true" />
              {loading ? "Updating…" : "Update password"}
            </button>
          </div>
        </section>

        {/* Notice panel */}
        <section className={styles.noticePanel}>
          <p className={styles.noticeTitle}>Password guidelines</p>
          <ul className={styles.noticeList}>
            <li>Use at least 6 characters with one special character (e.g. !, @, #).</li>
            <li>Do not reuse your current password.</li>
            <li>After a successful change, you will be logged out and redirected to login.</li>
            <li>Contact an admin if you have forgotten your current password.</li>
          </ul>
        </section>
      </main>

      {showConfirmModal && (
        <ConfirmModal
          title="Change password?"
          message="You will be logged out after your password is updated. Make sure to remember your new password."
          confirmText="Yes, update password"
          cancelText="Cancel"
          loading={loading}
          error={modalError}
          onConfirm={handleConfirm}
          onClose={() => { if (!loading) setShowConfirmModal(false); }}
        />
      )}
    </div>
  );
}