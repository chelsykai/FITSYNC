import { useState } from "react";
import styles from "./CreatePage.module.css";
import logo from "../../assets/logo.png";
import { supabase } from "../../lib/supabaseClient";

export default function CreatePage({ onNavigate }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleCreateAccount = async () => {
    setError("");
    const { error } = await supabase.from("system_user").insert([
      {
        first_name: firstName,
        last_name: lastName,
        user_id: userId,
        password: password,
      },
    ]);

    if (error) {
      setError(error.message);
    } else {
      onNavigate && onNavigate("login");
    }
  };

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
            <img src={logo} alt="FitSync Logo" className={styles.logoImage} />
          </div>

          <p className={styles.subtitleyp}>Please enter your details</p>

          {/* Name Row - First and Last Name */}
          <div className={styles.nameRow}>
            <input 
              type="text" 
              placeholder="First Name" 
              className={styles.nameInput}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Last Name" 
              className={styles.nameInput}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          {/* Other Inputs */}
          <input 
            type="text" 
            placeholder="User ID" 
            className={styles.inputField}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password" 
            className={styles.inputField}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className={styles.errorText}>{error}</p>}
        
          <button
            className={styles.loginBtn}
            onClick={handleCreateAccount}
          >
            Create Account
          </button>

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