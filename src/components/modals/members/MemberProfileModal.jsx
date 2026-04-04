import styles from "../Modal.module.css";

export default function MemberProfileModal({ member, onClose }) {
  if (!member) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.profileModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.profileAvatar}>👤</div>
        <h2 className={styles.profileName}>{member.name}</h2>
        <span className={styles.profileBadge}>{member.type}</span>
        <div className={styles.profileGrid}>
          <div>
            <p className={styles.profileLabel}>Member ID:</p>
            <p className={styles.profileValue}>{member.id}</p>
          </div>
          <div>
            <p className={styles.profileLabel}>Join Date:</p>
            <p className={styles.profileValue}>{member.joinDate}</p>
          </div>
          <div>
            <p className={styles.profileLabel}>Birthday:</p>
            <p className={styles.profileValue}>{member.birthday}</p>
          </div>
          <div>
            <p className={styles.profileLabel}>Expiry:</p>
            <p className={styles.profileValue}>{member.expiry}</p>
          </div>
          <div>
            <p className={styles.profileLabel}>Address:</p>
            <p className={styles.profileValue}>{member.address}</p>
          </div>
          <div>
            <p className={styles.profileLabel}>Last Activity:</p>
            <p className={styles.profileValue}>{member.lastActivity}</p>
          </div>
          <div>
            <p className={styles.profileLabel}>Phone Number:</p>
            <p className={styles.profileValue}>{member.phone}</p>
          </div>
          <div>
            <p className={styles.profileLabel}>Email:</p>
            <p className={styles.profileValue}>{member.email}</p>
          </div>
        </div>
        <button className={styles.submitBtn}>Email</button>
        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
