import styles from "./ForgotPasswordPage.module.css";

export default function ForgotPasswordPage({ onNavigate }) {
  return (
    <div className={styles.container}>
      {/* Left Section */}
      <div className={styles.leftSection}>
        <h1 className={styles.welcomeText}>Welcome!</h1>
      </div>

      {/* Right Section */}
      <div className={styles.rightSection}>
        <div className={styles.forgetBox}>
          <div className={styles.logoWrapper}>
            <img
              src="/src/assets/logo.png"
              alt="FitSync Logo"
              className={styles.logoImage}
            />
          </div>

          <p className={styles.subtitle}>Forgot your password?</p>
          <p className={styles.description}>
            Enter your email or employee ID to reset it.
          </p>

          <input
            type="text"
            placeholder="Email or Employee ID"
            className={styles.inputField}
          />

          <button className={styles.sendResetBtn}>
            Send Reset Link
          </button>

          <p className={styles.login}>
            Remember your password?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("login");
              }}
            >
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
