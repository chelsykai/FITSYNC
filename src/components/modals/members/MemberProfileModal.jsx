import styles from "../Modal.module.css";

export default function MemberProfileModal({ member, onClose }) {
  if (!member) return null;

  const displayName = member.full_name || member.name || "N/A";
  const memberType = member.membership_type || member.type || "N/A";
  const memberId = member.member_id || member.id || "N/A";
  const joinDate = member.join_date
    ? new Date(member.join_date).toLocaleDateString()
    : member.joinDate || "N/A";
  const birthday = member.birthday
    ? new Date(member.birthday).toLocaleDateString()
    : "N/A";
  const expiry = member.membership_validity || member.expiry || "N/A";
  const address = member.address || "N/A";
  const lastActivity = member.last_visit || member.lastActivity || "N/A";
  const phone = member.phone || "N/A";
  const email = member.email || "N/A";

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.profileModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.profileAvatar}>
          {member.photo_url ? (
            <img src={member.photo_url} alt={displayName} className={styles.photoPreview} />
          ) : (
            "👤"
          )}
        </div>
        <h2 className={styles.profileName}>{displayName}</h2>
        <span className={styles.profileBadge}>{memberType}</span>
        <div className={styles.profileGrid}>
          <div>
            <p className={styles.profileLabel}>Member ID:</p>
            <p className={styles.profileValue}>{memberId}</p>
          </div>
          <div>
            <p className={styles.profileLabel}>Join Date:</p>
            <p className={styles.profileValue}>{joinDate}</p>
          </div>
          <div>
            <p className={styles.profileLabel}>Birthday:</p>
            <p className={styles.profileValue}>{birthday}</p>
          </div>
          <div>
            <p className={styles.profileLabel}>Expiry:</p>
            <p className={styles.profileValue}>{expiry}</p>
          </div>
          <div>
            <p className={styles.profileLabel}>Address:</p>
            <p className={styles.profileValue}>{address}</p>
          </div>
          <div>
            <p className={styles.profileLabel}>Last Activity:</p>
            <p className={styles.profileValue}>{lastActivity}</p>
          </div>
          <div>
            <p className={styles.profileLabel}>Phone Number:</p>
            <p className={styles.profileValue}>{phone}</p>
          </div>
          <div>
            <p className={styles.profileLabel}>Email:</p>
            <p className={styles.profileValue}>{email}</p>
          </div>
        </div>
        <button className={styles.submitBtn}>Email</button>
        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
