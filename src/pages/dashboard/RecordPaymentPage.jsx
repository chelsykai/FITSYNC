import { useState } from "react";
import styles from "./RecordPaymentPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";

const defaultForm = {
  memberName: "",
  date: "",
  description: "",
  promoCode: "",
  modeOfPayment: "Cash",
  referenceNumber: "",
  status: "Paid",
};

export default function RecordPaymentPage({ onNavigate, activePage = "payments" }) {
  const [form, setForm] = useState(defaultForm);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = () => {
    console.log("Record payment:", form);
    // TODO: wire up to real data
    onNavigate("payments");
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
              <button className={styles.addRecordBtn} onClick={handleSubmit}>Add Record</button>
              <button className={styles.cancelBtn} onClick={() => onNavigate("payments")}>Cancel</button>
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
