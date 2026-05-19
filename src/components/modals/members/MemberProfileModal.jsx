import { useEffect, useRef, useState } from "react";
import styles from "../Modal.module.css";
import ConfirmModal from "../ConfirmModal";
import { generateMemberIDPDF } from "../../../utils/generateMemberIDPDF";
import EditMembershipModal from "./EditMembershipModal";
import EditMemberModal from "./EditMemberModal";
import { formatMMDDYYYY } from "../../../utils/dateFormat";

export default function MemberProfileModal({ member, onClose, onDelete, onMembershipUpdated, isAdmin = false }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState(null);
  const [showEditMembership, setShowEditMembership] = useState(false);
  const [showEditMember, setShowEditMember] = useState(false);
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
    ? formatMMDDYYYY(member.join_date)
    : member.joinDate || "N/A";
  const birthday = member.birthday
    ? formatMMDDYYYY(member.birthday)
    : "N/A";
  const expiry = member.expiration_date
    ? formatMMDDYYYY(member.expiration_date)
    : member.membership_validity || member.expiry || "N/A";
  const address = member.address || "N/A";
  const phone = member.phone || "N/A";
  const email = member.email || "N/A";

  const emergencyName   = member.emergency_contact_name   || "N/A";
  const emergencyNumber = member.emergency_contact_number || "N/A";

  const details = [
    { label: "Join Date",                value: joinDate       },
    { label: "Birthday",                 value: birthday       },
    { label: "Expiry",                   value: expiry         },
    { label: "Phone Number",             value: phone          },
    { label: "Email",                    value: email          },
    { label: "Address",                  value: address        },
    { label: "Emergency Contact",        value: emergencyName  },
    { label: "Emergency Contact Number", value: emergencyNumber},
  ];

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.profileModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.profileHero}>
          <div className={styles.profileTopRow}>
            <div className={styles.profileAvatar}>
              {member.photo_url ? (
                <img
                  key={member.photo_url || member.member_id}
                  src={member.photo_url}
                  alt={displayName}
                  className={styles.photoPreview}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
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
            className={styles.profileEmailBtn}
            onClick={async () => {
              try {
                const memberForPDF = {
                  photo_url: member.photo_url,
                  memberId: member.member_id || member.memberId || member.id,
                  fullName: member.full_name || member.name,
                  membership_type: member.membership_type,
                };
                await generateMemberIDPDF(memberForPDF);
              } catch (err) {
                // eslint-disable-next-line no-console
                console.error("Failed to generate PDF:", err);
              }
            }}
          >
            Print ID
          </button>
          {isAdmin && (
            <>
              <button
                className={styles.profileEmailBtn}
                onClick={() => setShowEditMember(true)}
              >
                Edit Member
              </button>
              <button
                className={styles.profileEmailBtn}
                onClick={() => setShowEditMembership(true)}
              >
                Edit Membership
              </button>
              <button
                className={styles.profileDeleteBtn}
                onClick={() => {
                  setConfirmError(null);
                  setConfirmOpen(true);
                }}
              >
                Delete
              </button>
            </>
          )}
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
      {showEditMembership && (
        <EditMembershipModal
          member={member}
          onClose={() => setShowEditMembership(false)}
          onSaved={(updatedMember) => onMembershipUpdated?.(updatedMember)}
        />
      )}
      {showEditMember && (
        <EditMemberModal
          member={member}
          onClose={() => setShowEditMember(false)}
          onSave={(updatedMember) => {
            setShowEditMember(false);
            onMembershipUpdated?.(updatedMember);
          }}
        />
      )}
    </>
  );
}