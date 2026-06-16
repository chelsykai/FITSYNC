import styles from "./Modal.module.css";

export default function TermsAndConditionsModal({ isOpen, onClose, onAccept }) {
  if (!isOpen) return null;

  return (
    <div className={styles.termsAndConditionsModalOverlay}>
      <div className={styles.termsAndConditionsModal}>
        <div className={styles.termsAndConditionsModalHeader}>
          <h2>Terms & Conditions</h2>
        </div>

        <div className={styles.termsAndConditionsModalContent}>
          <h3>1. Acceptance of terms</h3>
          <p>By accessing and using the FitSync Gym Management System, you confirm that you are an authorized personnel and agree to comply with these terms. Unauthorized access is strictly prohibited.</p>

          <h3>2. User accounts</h3>
          <p>Each user is responsible for maintaining the confidentiality of their account credentials. You must not share your User ID or password with anyone. Report any suspected unauthorized access to your administrator immediately.</p>

          <h3>3. Data privacy</h3>
          <p>All member information accessed through this system is confidential. You must not share, copy, or export member data outside of authorized workflows. Data handling must comply with applicable privacy laws.</p>

          <h3>4. Acceptable use</h3>
          <p>This system must only be used for legitimate gym management purposes. Any misuse, including unauthorized modification of records, tampering with payment data, or accessing restricted areas, may result in account termination and legal action.</p>

          <h3>5. Payment records</h3>
          <p>All payment transactions recorded in the system must be accurate and truthful. Falsification of payment records is a serious violation and may result in disciplinary action.</p>

          <h3>6. Audit trail</h3>
          <p>All actions performed within the system are logged in an audit trail. Users acknowledge that their activities are monitored for security and compliance purposes.</p>

          <h3>7. Password policy</h3>
          <p>Users are required to maintain a secure password and change it when prompted. Passwords must meet the minimum security requirements set by the administrator.</p>

          <h3>8. Termination</h3>
          <p>Access to this system may be revoked at any time by an administrator. Upon termination, users must immediately cease all use of the system and return any confidential information.</p>
        </div>

        <div className={styles.termsAndConditionsModalFooter}>
          <label className={styles.termsAndConditionsCheckboxLabel}>
            <input type="checkbox" onChange={(e) => onAccept(e.target.checked)} />
            I agree to the Terms & Conditions
          </label>
          <button className={styles.termsAndConditionsCloseBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
