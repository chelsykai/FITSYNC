import { useState } from "react";
import styles from "./LogInPage.module.css";
import logo from "../../assets/logo.png";
import { supabase } from "../../lib/supabaseClient";
import { getWorkingDaysLeft } from "../../utils/dateUtils";
import TermsAndConditionsModal from "../../components/modals/TermsAndConditionsModal";

const POST_LOGIN_REDIRECT_KEY = "postLoginRedirect";

export default function LogInPage({ onNavigate }) {
  const [username,           setUsername]           = useState("");
  const [password,           setPassword]           = useState("");
  const [error,              setError]              = useState("");
  const [loading,            setLoading]            = useState(false);
  const [showPassword,       setShowPassword]       = useState(false);
  const [termsModalOpen,     setTermsModalOpen]     = useState(false);
  const [termsAccepted,      setTermsAccepted]      = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const { data, error: queryError } = await supabase
        .from("system_user")
        .select("*")
        .eq("user_id", username.trim())
        .eq("password", password.trim());

      if (queryError) {
        setError("Database error. Please try again.");
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setError("Invalid username or password");
        setLoading(false);
        return;
      }

      const user = data[0];

      sessionStorage.setItem("currentUser", JSON.stringify(user));
      setLoading(false);

      const postLoginRedirect = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
      if (postLoginRedirect) {
        sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
        window.location.replace(postLoginRedirect);
        return;
      }

      if (user.password_change_required === true) {
        const daysLeft = getWorkingDaysLeft(user.password_change_deadline);
        onNavigate("overview", { passwordChangeDaysLeft: daysLeft, user });
        return;
      }

      onNavigate(String(user.role || "staff").toLowerCase() === "admin" ? "overview" : "staffDashboard", {
        user,
      });
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        <div className={styles.leftContent}>
          <h1 className={styles.welcomeText}>Welcome<br />Back!</h1>
          <p className={styles.leftSubtitle}>Manage your gym community with ease.</p>
        </div>

        {/* Illustration: QR scan card with floating stat badges */}
        <div className={styles.illustrationContainer}>

          {/* Dumbbell connector icon */}
          <div className={styles.dumbbellRow}>
            <span className={styles.dumbbellPlate} />
            <span className={styles.dumbbellPlateSmall} />
            <span className={styles.dumbbellBar} />
            <span className={styles.dumbbellPlateSmall} />
            <span className={styles.dumbbellPlate} />
          </div>

          {/* QR Card with floating badges */}
          <div className={styles.qrCardWrap}>

            <div className={styles.badgePresent}>
              <span className={styles.presentDot} />
              PRESENT
            </div>

            <div className={styles.badgeMemberId}>
              <span className={styles.badgeLabel}>MEMBER ID</span>
              <span className={styles.badgeValue}>20269893</span>
            </div>

            <div className={styles.qrCard}>
              <svg viewBox="0 0 100 100" className={styles.qrSvg} aria-hidden="true">
                {/* Corner finder patterns */}
                <rect x="4" y="4" width="20" height="20" fill="none" stroke="#1b3d12" strokeWidth="4"/>
                <rect x="10" y="10" width="8" height="8" fill="#1b3d12"/>
                <rect x="76" y="4" width="20" height="20" fill="none" stroke="#1b3d12" strokeWidth="4"/>
                <rect x="82" y="10" width="8" height="8" fill="#1b3d12"/>
                <rect x="4" y="76" width="20" height="20" fill="none" stroke="#1b3d12" strokeWidth="4"/>
                <rect x="10" y="82" width="8" height="8" fill="#1b3d12"/>
                {/* Random data pixels */}
                <rect x="30" y="6" width="6" height="6" fill="#1b3d12"/>
                <rect x="44" y="6" width="6" height="6" fill="#1b3d12"/>
                <rect x="58" y="10" width="6" height="6" fill="#1b3d12"/>
                <rect x="30" y="18" width="6" height="6" fill="#1b3d12"/>
                <rect x="38" y="30" width="6" height="6" fill="#1b3d12"/>
                <rect x="52" y="30" width="6" height="6" fill="#1b3d12"/>
                <rect x="66" y="34" width="6" height="6" fill="#1b3d12"/>
                <rect x="30" y="42" width="6" height="6" fill="#1b3d12"/>
                <rect x="44" y="44" width="6" height="6" fill="#1b3d12"/>
                <rect x="58" y="46" width="6" height="6" fill="#1b3d12"/>
                <rect x="72" y="48" width="6" height="6" fill="#1b3d12"/>
                <rect x="36" y="56" width="6" height="6" fill="#1b3d12"/>
                <rect x="50" y="58" width="6" height="6" fill="#1b3d12"/>
                <rect x="64" y="60" width="6" height="6" fill="#1b3d12"/>
                <rect x="30" y="66" width="6" height="6" fill="#1b3d12"/>
                <rect x="44" y="68" width="6" height="6" fill="#1b3d12"/>
                <rect x="58" y="70" width="6" height="6" fill="#1b3d12"/>
                <rect x="72" y="72" width="6" height="6" fill="#1b3d12"/>
                <rect x="36" y="80" width="6" height="6" fill="#1b3d12"/>
                <rect x="50" y="84" width="6" height="6" fill="#1b3d12"/>
                <rect x="64" y="86" width="6" height="6" fill="#1b3d12"/>
                <rect x="78" y="82" width="6" height="6" fill="#1b3d12"/>
                <rect x="86" y="60" width="6" height="6" fill="#1b3d12"/>
                <rect x="86" y="44" width="6" height="6" fill="#1b3d12"/>
              </svg>
              {/* Scan line animation */}
              <span className={styles.scanLine} />
              {/* Corner brackets */}
              <span className={styles.cornerTL} />
              <span className={styles.cornerTR} />
              <span className={styles.cornerBL} />
              <span className={styles.cornerBR} />
            </div>

            <div className={styles.badgeLoggedIn}>
              <span className={styles.badgeLabel}>LOGGED IN</span>
              <span className={styles.badgeValue}>06:10 PM</span>
            </div>

            <div className={styles.badgeStreak}>
              <span className={styles.badgeLabel}>STREAK</span>
              <span className={styles.badgeValue}>14 days</span>
            </div>
          </div>

          {/* Heartbeat divider */}
          <div className={styles.heartbeatRow}>
            <svg viewBox="0 0 280 40" className={styles.heartbeatSvg} preserveAspectRatio="none" aria-hidden="true">
              <polyline
                points="0,20 60,20 75,5 90,35 105,20 280,20"
                fill="none"
                stroke="#7eba56"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="105" cy="20" r="4" fill="#7eba56" className={styles.heartbeatDot} />
            </svg>
          </div>

          <p className={styles.taglineMain}>Scan. Log. Train.</p>
          <p className={styles.taglineSub}>Attendance tracking made effortless.</p>
        </div>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.loginBox}>
          <div className={styles.logoWrapper}>
            <img src={logo} alt="FitSync Logo" className={styles.logoImage} />
          </div>
          <div className={styles.brandName}>FITSYNC</div>

          <p className={styles.subtitle}>Sign in to your account</p>

          <input
            type="text"
            placeholder="User ID"
            className={styles.inputField}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />

          <div className={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className={styles.inputField}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <button className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <button className={styles.loginBtn} onClick={handleLogin} disabled={loading || !termsAccepted}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className={styles.termsCheckbox}>
            <input 
              type="checkbox" 
              id="termsCheckbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <label htmlFor="termsCheckbox">
              I read and agree to{" "}
              <button 
                className={styles.termsTextLink}
                onClick={(e) => {
                  e.preventDefault();
                  setTermsModalOpen(true);
                }}
                type="button"
              >
                terms and conditions
              </button>
            </label>
          </div>
        </div>
      </div>

      <TermsAndConditionsModal 
        isOpen={termsModalOpen} 
        onClose={() => setTermsModalOpen(false)}
        onAccept={(accepted) => setTermsAccepted(accepted)}
      />
    </div>
  );
}