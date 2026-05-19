import { useState } from "react";
import styles from "../Modal.module.css";
import { sendMemberWelcomeEmail, uploadQRAndGetUrl } from "../../../services/notificationEmailService";
import { generateMemberQRCardDataUrl } from "../../../utils/generateMemberIDPDF";

export default function MemberRegisteredModal({ member, onClose }) {
  const [emailStatus, setEmailStatus] = useState("idle"); // idle | sending | sent | error
  const [emailError, setEmailError] = useState("");

  const handleEmailQR = async () => {
    const email = member?.email;
    if (!email) {
      alert("This member has no email address on record. Please edit the member and add an email first.");
      return;
    }

    setEmailStatus("sending");
    try {
      const memberId = member.memberId || member.member_id;
      const qrCardDataUrl = await generateMemberQRCardDataUrl(member);
      const qrPublicUrl = await uploadQRAndGetUrl(memberId, qrCardDataUrl);
      await sendMemberWelcomeEmail(member, qrPublicUrl);
      setEmailStatus("sent");
    } catch (err) {
      const msg = err?.message || String(err);
      console.error("Failed to send QR email:", msg);
      setEmailError(msg);
      setEmailStatus("error");
    }
  };

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
          {member.email && (
            <p className={styles.registeredInfoRow}>
              <strong>Email :</strong> {member.email}
            </p>
          )}
        </div>

        {/* Email status feedback */}
        {emailStatus === "sent" && (
          <p style={{ color: "#7eba56", fontSize: "13px", textAlign: "center", margin: "8px 0 0" }}>
            QR ID sent to {member.email}
          </p>
        )}
        {emailStatus === "error" && (
          <p style={{ color: "#e05555", fontSize: "13px", textAlign: "center", margin: "8px 0 0" }}>
            {emailError || "Failed to send email. Check your EmailJS config and try again."}
          </p>
        )}

        {/* Buttons */}
        <div className={styles.registeredBtns}>
          <button className={styles.addMemberCancelBtn} onClick={onClose}>Done</button>
          <button
            className={styles.addMemberSubmitBtn}
            onClick={handleEmailQR}
            disabled={emailStatus === "sending" || emailStatus === "sent"}
            style={{ opacity: emailStatus === "sending" ? 0.7 : 1 }}
          >
            {emailStatus === "sending" ? "Sending..." : emailStatus === "sent" ? "Sent ✓" : "Email QR ID"}
          </button>
        </div>
      </div>
    </div>
  );
}
