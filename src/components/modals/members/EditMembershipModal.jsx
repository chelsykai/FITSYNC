import { useState } from "react";
import styles from "../Modal.module.css";
import { updateMemberMembership } from "../../../services/memberService";

export default function EditMembershipModal({ member, onClose, onSaved }) {
  const [monthly, setMonthly] = useState("");
  const [yearly, setYearly] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setNumber = (setter) => (e) => {
    const nextValue = e.target.value;
    if (nextValue === "") {
      setter("");
      return;
    }
    setter(nextValue.replace(/[^\d]/g, ""));
  };

  const saveMembership = async () => {
    const monthlyValue = Number.parseInt(monthly, 10);
    const yearlyValue = Number.parseInt(yearly, 10);
    const hasMonthly = Number.isInteger(monthlyValue) && monthlyValue > 0;
    const hasYearly = Number.isInteger(yearlyValue) && yearlyValue > 0;

    if (hasMonthly === hasYearly) {
      setError("Set either months or years.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const updated = await updateMemberMembership(member.member_id, {
        joinDate: member.join_date,
        monthlyValidity: hasMonthly ? `${monthlyValue} Month${monthlyValue === 1 ? "" : "s"}` : "",
        membershipValidity: hasYearly ? `${yearlyValue} Year${yearlyValue === 1 ? "" : "s"}` : "",
        cancelMembership: false,
      });
      onSaved?.(updated);
      onClose?.();
    } catch (err) {
      setError(err.message || "Failed to update membership.");
    } finally {
      setLoading(false);
    }
  };

  const cancelMembership = async () => {
    try {
      setLoading(true);
      setError(null);
      const updated = await updateMemberMembership(member.member_id, {
        joinDate: member.join_date,
        monthlyValidity: "",
        membershipValidity: "",
        cancelMembership: true,
      });
      onSaved?.(updated);
      onClose?.();
    } catch (err) {
      setError(err.message || "Failed to cancel membership.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Edit Membership</h2>

        <div className={styles.fieldRow}>
          <div className={styles.unitInputWrap}>
            <input
              className={styles.formInput}
              placeholder="Plan Duration"
              type="number"
              min="1"
              step="1"
              value={monthly}
              onChange={setNumber(setMonthly)}
              disabled={Boolean(yearly)}
            />
            <span className={styles.unitSuffix}>Months</span>
          </div>
          <div className={styles.unitInputWrap}>
            <input
              className={styles.formInput}
              placeholder="Membership Term"
              type="number"
              min="1"
              step="1"
              value={yearly}
              onChange={setNumber(setYearly)}
              disabled={Boolean(monthly)}
            />
            <span className={styles.unitSuffix}>Years</span>
          </div>
        </div>

        {error && (
          <div style={{ color: "#d32f2f", marginTop: 12, fontSize: 13 }}>
            {error}
          </div>
        )}

        <button className={styles.submitBtn} onClick={saveMembership} disabled={loading}>
          {loading ? "Saving..." : "Save Membership"}
        </button>
        <button className={styles.profileDeleteBtn} onClick={cancelMembership} disabled={loading}>
          Cancel Membership
        </button>
        <button className={styles.closeBtn} onClick={onClose} disabled={loading}>Close</button>
      </div>
    </div>
  );
}
