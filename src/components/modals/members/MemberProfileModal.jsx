import { useEffect, useRef, useState } from "react";
import styles from "../Modal.module.css";
import ConfirmModal from "../ConfirmModal";

export default function MemberProfileModal({ member, onClose, onDelete }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState(null);
  const qrContainerRef = useRef();

  useEffect(() => {
    const memberId = member?.member_id || member?.memberId || member?.id;
    if (!qrContainerRef.current || !memberId) return;

    const qrContainer = qrContainerRef.current;
    const qrData = memberId;
    const size = 150;

    // Load QR library from CDN
    if (!window.QRCode) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      script.async = true;
      script.onload = () => generateQR();
      document.head.appendChild(script);
    } else {
      generateQR();
    }

    function generateQR() {
      qrContainer.innerHTML = "";
      // eslint-disable-next-line no-undef
      new QRCode(qrContainer, {
        text: qrData,
        width: size,
        height: size,
        colorDark: "#000000",
        colorLight: "#ffffff",
      });
    }

    return () => {
      qrContainer.innerHTML = "";
    };
  }, [member]);

  if (!member) return null;

  const displayName = member.full_name || member.name || "N/A";
  const memberType = member.membership_type || member.type || "N/A";
  const memberId = member.member_id || member.memberId || member.id || "N/A";
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

  const details = [
    { label: "Join Date", value: joinDate },
    { label: "Birthday", value: birthday },
    { label: "Expiry", value: expiry },
    { label: "Last Activity", value: lastActivity },
    { label: "Phone Number", value: phone },
    { label: "Email", value: email },
    { label: "Address", value: address },
  ];

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.profileModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.profileHero}>
          <div className={styles.profileTopRow}>
            <div className={styles.profileAvatar}>
              {member.photo_url ? (
                <img src={member.photo_url} alt={displayName} className={styles.photoPreview} />
              ) : (
                "👤"
              )}
            </div>
          </div>
          <div className={styles.profileIdentity}>
            <h2 className={styles.profileName}>{displayName}</h2>
            <p className={styles.profileIdText}>ID: {memberId}</p>
            <span className={styles.profileBadge}>{memberType}</span>
          </div>
        </div>

        <div className={styles.profileGrid}>
          <div className={styles.profileItem}>
            <p className={styles.profileLabel}>Member ID:</p>
            <p className={styles.profileValue}>{memberId}</p>
          </div>

          {details.map((item) => (
            <div className={styles.profileItem} key={item.label}>
              <p className={styles.profileLabel}>{item.label}:</p>
              <p className={styles.profileValue}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className={styles.profileQrBlock}>
          <div ref={qrContainerRef} className={styles.profileQrCanvas} />
          <p className={styles.profileQrLabel}>Member QR</p>
        </div>

        <div className={styles.profileActions}>
          <a
            className={styles.profileEmailBtn}
            href={email !== "N/A" ? `mailto:${email}` : undefined}
            onClick={(e) => {
              if (email === "N/A") e.preventDefault();
            }}
          >
            Email Member
          </a>
          <button
            className={styles.profileDeleteBtn}
            onClick={() => {
              setConfirmError(null);
              setConfirmOpen(true);
            }}
          >
            Delete
          </button>
          <button className={styles.profileCloseBtn} onClick={onClose}>Close</button>
        </div>
      </div>
      </div>
      {confirmOpen && (
        <ConfirmModal
          title="Delete Member"
          message={`Are you sure you want to delete ${displayName}? This action cannot be undone.`}
          loading={confirmLoading}
          error={confirmError}
          confirmText="Yes, Delete"
          cancelText="Cancel"
          onClose={() => setConfirmOpen(false)}
          onConfirm={async () => {
            try {
              setConfirmLoading(true);
              setConfirmError(null);
              await onDelete?.(member);
              setConfirmOpen(false);
              onClose?.();
            } catch (err) {
              setConfirmError(err?.message || String(err));
            } finally {
              setConfirmLoading(false);
            }
          }}
        />
      )}
    </>
  );
}

