import styles from "./CreatePage.module.css";

export default function CreatePage({ onNavigate }) {
  return (
    <div className={styles.container}>
      {/* Left Section */}
      <div className={styles.leftSection}>
        <h1 className={styles.welcomeText}>Welcome!</h1>
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

          {/* Name Row - First and Last Name */}
          <div className={styles.nameRow}>
            <input 
              type="text" 
              placeholder="First Name" 
              className={styles.nameInput} 
            />
            <input 
              type="text" 
              placeholder="Last Name" 
              className={styles.nameInput} 
            />
          </div>

          {/* Other Inputs */}
          <input 
            type="text" 
            placeholder="Employee ID" 
            className={styles.inputField} 
          />
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
        
          <button className={styles.loginBtn}>Create Account</button>

          <p className={styles.signup}>
            Already have an account?{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate && onNavigate("login");
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