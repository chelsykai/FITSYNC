import { useEffect, useRef } from "react";
import styles from "../Modal.module.css";

export default function MemberRegisteredModal({ member, onClose, onPrint }) {
  const canvasRef = useRef();

  // Generate QR code using the free qrcode.js approach via canvas
  useEffect(() => {
    if (!canvasRef.current || !member?.memberId) return;

    const qrData = `FITSYNC|${member.memberId}|${member.fullName}|${member.membershipType}`;
    const canvas = canvasRef.current;
    const size = 180;
    canvas.width = size;
    canvas.height = size;

    // Load QR library dynamically from CDN
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    script.onload = () => {
      canvas.innerHTML = "";
      const container = document.createElement("div");
      document.body.appendChild(container);
      // eslint-disable-next-line no-undef
      new QRCode(container, {
        text: qrData,
        width: size,
        height: size,
        colorDark: "#000000",
        colorLight: "#ffffff",
      });
      setTimeout(() => {
        const img = container.querySelector("img");
        if (img) {
          const ctx = canvas.getContext("2d");
          const image = new Image();
          image.onload = () => ctx.drawImage(image, 0, 0, size, size);
          image.src = img.src;
        }
        document.body.removeChild(container);
      }, 100);
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
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
          <canvas ref={canvasRef} className={styles.qrCanvas} />
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
