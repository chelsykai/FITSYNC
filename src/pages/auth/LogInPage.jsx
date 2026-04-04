import { useState } from "react";
import styles from "./LogInPage.module.css";
import logo from "../../assets/logo.png";
import { supabase } from "../../lib/supabaseClient";

export default function LogInPage({ onNavigate }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

      // Store user info in sessionStorage for persistence across pages
      sessionStorage.setItem("currentUser", JSON.stringify(data[0]));

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

          <input
            type="password"
            placeholder="Password"
            className={styles.inputField}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />

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

          <p className={styles.signup}>
            No account?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("create");
              }}
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
