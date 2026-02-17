import styles from "./LogInPage.module.css";

export default function LogInPage({ onNavigate }) {
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
            <img
              src="/src/assets/logo.png"
              alt="FitSync Logo"
              className={styles.logoImage}
            />
          </div>

          <p className={styles.subtitle}>Please enter your details</p>

          <input
            type="text"
            placeholder="Username"
            className={styles.inputField}
          />

          <input
            type="password"
            placeholder="Password"
            className={styles.inputField}
          />

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

          <button className={styles.loginBtn}>Login</button>

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
