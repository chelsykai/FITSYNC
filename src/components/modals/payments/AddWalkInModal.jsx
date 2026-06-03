import { useState } from "react";
import styles from "../Modal.module.css";
import { supabase } from "../../../lib/supabaseClient";
import { toISODateString } from "../../../utils/dateFormat";

export default function AddWalkInModal({ onClose, onSaved }) {
  const [name, setName] = useState("");
  const [planType, setPlanType] = useState("Daily");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toISODateString());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const total = Number(amount);
    if (!date) {
      setError("Please choose a payment date.");
      return;
    }

    if (!amount || Number.isNaN(total) || total <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const { error: insertError } = await supabase.from("walk_in").insert([{
        name: name.trim() || "Guest",
        payment_date: date,
        plan_type: planType,
        total,
        status: "Paid",
      }]);

      if (insertError) throw insertError;

      await onSaved?.();
      onClose();
    } catch (err) {
      console.error("Error adding walk-in record:", err);
      setError("Unable to save walk-in record right now. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <form
        className={`${styles.modal} ${styles.walkInModal}`}
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={styles.modalTitle}>Add Walk-in</h2>

        <label className={styles.labeledField}>
          <span className={styles.modernLabel}>Name (optional)</span>
          <input
            type="text"
            className={styles.formInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Guest"
            disabled={saving}
          />
        </label>

        <div className={styles.fieldRow}>
          <label className={styles.labeledField}>
            <span className={styles.modernLabel}>Plan Type</span>
            <select
              className={styles.formInput}
              value={planType}
              onChange={(e) => setPlanType(e.target.value)}
              disabled={saving}
            >
              <option value="Daily">Daily</option>
              <option value="Monthly">Monthly</option>
            </select>
          </label>

          <label className={styles.labeledField}>
            <span className={styles.modernLabel}>Amount</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className={styles.formInput}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={saving}
            />
          </label>
        </div>

        <label className={styles.labeledField}>
          <span className={styles.modernLabel}>Date</span>
          <input
            type="date"
            className={styles.formInput}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={saving}
          />
        </label>

        {error && <p className={styles.formError}>{error}</p>}

        <div className={styles.walkInActions}>
          <button type="submit" className={styles.submitBtn} disabled={saving}>
            {saving ? "Saving..." : "Save Walk-in"}
          </button>
          <button type="button" className={styles.closeBtn} onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
