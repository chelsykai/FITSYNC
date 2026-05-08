import { useState } from "react";
import styles from "./LogInPage.module.css";
import logo from "../../assets/logo.png";
import { supabase } from "../../lib/supabaseClient";

export default function LogInPage({ onNavigate }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      // Query the system_user table for matching credentials
      const { data, error: queryError } = await supabase
        .from("system_user")
        .select("*")
        .eq("user_id", username.trim())
        .eq("password", password.trim());

      if (queryError) {
        console.error("Database error:", queryError);
        setError("Database error. Please try again.");
        setLoading(false);
        return;
      }

      // Check if user found
      if (!data || data.length === 0) {
        setError("Invalid username or password");
        setLoading(false);
        return;
      }

      // Store user info in localStorage for persistence across refreshes and sessions
      localStorage.setItem("currentUser", JSON.stringify(data[0]));

      // Login successful - navigate to overview
      setLoading(false);
      onNavigate && onNavigate("overview");
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className={styles.container}>
      {/* Left Section */}
      <div className={styles.leftSection}>
        <h1 className={styles.welcomeText}>
          Welcome <br /> Back!
        </h1>
      </div>

      {/* Right Section */}
      <div className={styles.rightSection}>
        <div className={styles.loginBox}>
          {/* Logo */}
          <div className={styles.logoWrapper}>
            <img src={logo} alt="FitSync Logo" className={styles.logoImage} />
          </div>

          <p className={styles.subtitle}>Please enter your details</p>

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
            <button
              className={styles.eyeBtn}
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                /* Eye-off icon */
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                /* Eye icon */
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <div className={styles.forgot}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("forgot");
              }}
            >
              Forgot Password?
            </a>
          </div>

          <button
            className={styles.loginBtn}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          
        </div>
      </div>
    </div>
  );
}
