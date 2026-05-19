import { useState } from "react";
import styles from "./LogInPage.module.css";
import logo from "../../assets/logo.png";
import { supabase } from "../../lib/supabaseClient";
import { getWorkingDaysLeft } from "../../utils/dateUtils";

const POST_LOGIN_REDIRECT_KEY = "postLoginRedirect";

export default function LogInPage({ onNavigate }) {
  const [username,     setUsername]     = useState("");
  const [password,     setPassword]     = useState("");
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      onNavigate("overview");
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

          <button className={styles.loginBtn} onClick={handleLogin} disabled={loading}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            {loading ? "Logging in..." : "Login"}
          </button>
          
        </div>
      </div>
    </div>
  );
}
