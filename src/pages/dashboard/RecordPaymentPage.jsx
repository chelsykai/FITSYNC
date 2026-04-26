import { useState } from "react";
import styles from "./RecordPaymentPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";
import { supabase } from "../../lib/supabaseClient";

const defaultForm = {
  memberName: "",
  date: "",
  description: "",
  promoCode: "",
  modeOfPayment: "Cash",
  referenceNumber: "",
  status: "Paid",
  total: "",
};

/**
 * Add a payment record to the record_payment table
 * Maps form fields to database columns
 */
const add_record = async (formData) => {
  try {
    const { error } = await supabase.from("record_payment").insert([
      {
        member_id: formData.memberName,
        date: formData.date,
        promo_id: formData.promoCode || null,
        mop: formData.modeOfPayment,
        ref_number: formData.referenceNumber,
        status: formData.status,
        amount_paid: parseInt(formData.total) || 0,
      },
    ]);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export default function RecordPaymentPage({ onNavigate, activePage = "payments" }) {
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async () => {
    setError("");
    setSuccessMessage("");

    // Validation
    if (!form.memberName.trim()) {
      setError("Member Info is required");
      return;
    }
    if (!form.date) {
      setError("Date is required");
      return;
    }
    if (!form.total) {
      setError("Total is required");
      return;
    }

    setLoading(true);
    const result = await add_record(form);

    if (result.success) {
      setSuccessMessage("Payment record added successfully!");
      setForm(defaultForm);
      setTimeout(() => {
        onNavigate("payments");
      }, 1500);
    } else {
      setError(result.error || "Failed to add payment record");
    }

    setLoading(false);
  };

  return (
    <div className={styles.layout}>
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className={styles.content}>

        {/* Page Title */}
        <div className={styles.titleRow}>
          <span className={styles.titleIcon}>🗂️</span>
          <h1 className={styles.title}>Record Payment</h1>
        </div>

        {/* Form Card */}
        <div className={styles.formCard}>

          {/* Error & Success Messages */}
          {error && (
            <div style={{
              padding: "12px 16px",
              marginBottom: "16px",
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: "6px",
              color: "#c00",
              fontSize: "14px",
            }}>
              {error}
            </div>
          )}
          {successMessage && (
            <div style={{
              padding: "12px 16px",
              marginBottom: "16px",
              backgroundColor: "#efe",
              border: "1px solid #cfc",
              borderRadius: "6px",
              color: "#060",
              fontSize: "14px",
            }}>
              {successMessage}
            </div>
          )}

          {/* Row 1 */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Member Info</label>
              <input className={styles.formInput} placeholder="Enter Member Name"
                value={form.memberName} onChange={set("memberName")} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Date</label>
              <input className={styles.formInput} type="date" placeholder="MM/DD/YYYY"
                value={form.date} onChange={set("date")} />
            </div>
          </div>

          {/* Row 2 */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Payment Details</label>
              <input className={styles.formInput} placeholder="Description"
                value={form.description} onChange={set("description")} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>&nbsp;</label>
              <input className={styles.formInput} placeholder="Promo Code"
                value={form.promoCode} onChange={set("promoCode")} />
            </div>
          </div>

          {/* Row 3 */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Mode Of Payment</label>
              <select className={styles.formInput} value={form.modeOfPayment} onChange={set("modeOfPayment")}>
                {["Cash", "GCash", "Bank Transfer", "Credit Card"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Reference Number</label>
              <input className={styles.formInput} placeholder="Enter Reference Number"
                value={form.referenceNumber} onChange={set("referenceNumber")} />
            </div>
          </div>

          {/* Row 3.5 — Total */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Total</label>
              <input className={styles.formInput} type="number" placeholder="Enter Total Amount"
                value={form.total} onChange={set("total")} />
            </div>
          </div>

          {/* Row 4 — Status + Buttons */}
          <div className={styles.formRowStatus}>
            <div className={styles.statusGroup}>
              <label className={styles.formLabel}>Status</label>
              <div className={styles.radioRow}>
                <label className={styles.radioOption}>
                  <input type="radio" name="status" value="Paid"
                    checked={form.status === "Paid"} onChange={set("status")}
                    style={{ accentColor: "#7eba56" }} />
                  Paid
                </label>
                <label className={styles.radioOption}>
                  <input type="radio" name="status" value="Unpaid"
                    checked={form.status === "Unpaid"} onChange={set("status")}
                    style={{ accentColor: "#7eba56" }} />
                  Unpaid
                </label>
              </div>
            </div>
            <div className={styles.actionBtns}>
              <button className={styles.addRecordBtn} onClick={handleSubmit} disabled={loading}>
                {loading ? "Adding..." : "Add Record"}
              </button>
              <button className={styles.cancelBtn} onClick={() => onNavigate("payments")} disabled={loading}>
                Cancel
              </button>
            </div>
          </div>

        </div>

        {/* Close button bottom right */}
        <div className={styles.closeRow}>
          <button className={styles.closePageBtn} onClick={() => onNavigate("payments")}>Close</button>
        </div>

      </div>
    </div>
  );
}
