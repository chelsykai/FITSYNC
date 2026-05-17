import { useEffect, useRef } from "react";
import styles from "../Modal.module.css";

export default function MemberRegisteredModal({ member, onClose, onPrint }) {
  const qrContainerRef = useRef();

  useEffect(() => {
    const memberId = member?.memberId || member?.member_id;
    if (!qrContainerRef.current || !memberId) return;

    const qrContainer = qrContainerRef.current;
    const qrData = memberId;
    const size = 180;

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

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.registeredModal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.registeredHeader}>
          <div className={styles.registeredCheck}>✓</div>
          <h2 className={styles.registeredTitle}>Member Registered</h2>
        </div>

        {/* Info */}
        <div className={styles.registeredInfo}>
          <p className={styles.registeredInfoRow}>
            <strong>Name :</strong> {member.fullName}
          </p>
          <p className={styles.registeredInfoRow}>
            <strong>Member ID :</strong> {member.memberId}
          </p>
        </div>

        {/* QR Code */}
        <div className={styles.qrWrapper}>
          <div ref={qrContainerRef} className={styles.qrCanvas} />
          <p className={styles.qrLabel}>Scan QR to Verify</p>
        </div>

        {/* Buttons */}
        <div className={styles.registeredBtns}>
          <button className={styles.addMemberCancelBtn} onClick={onClose}>Done</button>
          <button className={styles.addMemberSubmitBtn} onClick={() => onPrint?.(member)}>Print ID</button>
        </div>
      </div>
    </div>
  );
}
