import { useState, useEffect } from "react";
import styles from "./RecordPaymentPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";
import { supabase } from "../../lib/supabaseClient";

const getTodayDateString = () => new Date().toISOString().split("T")[0];

const defaultForm = {
  memberName: "",
  memberId: "",
  date: getTodayDateString(),
  description: "",
  promoCode: "",
  modeOfPayment: "Cash",
  referenceNumber: "",
  status: "Paid",
  total: "",
};

/**
 * Fetch all members from the database
 */
const fetchMembers = async () => {
  try {
    const { data, error } = await supabase
      .from("member")
      .select("member_id, full_name")
      .order("full_name");

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }
    
    console.log("Members fetched:", data); // Debug
    return data || [];
  } catch (err) {
    console.error("Error fetching members:", err);
    return [];
  }
};

/**
 * Add a payment record to the record_payment table
 * Maps form fields to database columns
 */
const add_record = async (formData) => {
  try {
    if (!formData.memberId) {
      throw new Error("Please select a valid member");
    }

    const { error } = await supabase.from("record_payment").insert([
      {
        member_id: formData.memberId,
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
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [membersLoading, setMembersLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const loadMembers = async () => {
      setMembersLoading(true);
      const data = await fetchMembers();
      setMembers(data);
      setMembersLoading(false);
    };
    loadMembers();
  }, []);

  const handleMemberInputChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      memberName: value,
      memberId: "", // Reset member ID until they select from dropdown
    }));
    setShowDropdown(true);
  };

  const handleSelectMember = (fullName, memberId) => {
    setForm((prev) => ({
      ...prev,
      memberName: fullName,
      memberId: memberId,
    }));
    setShowDropdown(false);
  };

  const set = (field) => (e) => {
    const value = e.target.value;
    if (field === "modeOfPayment") {
      const requiresReference = ["GCash", "Bank Transfer", "Credit Card"].includes(value);
      setForm({
        ...form,
        modeOfPayment: value,
        referenceNumber: requiresReference ? form.referenceNumber : "",
      });
      return;
    }
    setForm({ ...form, [field]: value });
  };

  // Filter members based on input
  const filteredMembers = form.memberName
    ? members.filter((m) =>
        m.full_name.toLowerCase().includes(form.memberName.toLowerCase())
      )
    : members;

  const handleSubmit = async () => {
    setError("");
    setSuccessMessage("");

    // Validation
    if (!form.memberName.trim()) {
      setError("Member Info is required");
      return;
    }
    if (!form.memberId) {
      setError("Please select a valid member from the list");
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

    const requiresReference = ["GCash", "Bank Transfer", "Credit Card"].includes(form.modeOfPayment);
    if (requiresReference && !form.referenceNumber.trim()) {
      setError("Reference Number is required for selected mode of payment");
      return;
    }

    setLoading(true);
    const result = await add_record(form);

    if (result.success) {
      setSuccessMessage("Payment record added successfully!");
      setForm({ ...defaultForm, date: getTodayDateString() });
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
        <div className={`${styles.content} tab-slide-animation`}>
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

          {/* Loading Members */}
          {membersLoading && (
            <div style={{
              padding: "12px 16px",
              marginBottom: "16px",
              backgroundColor: "#f0f0f0",
              borderRadius: "6px",
              color: "#666",
              fontSize: "14px",
            }}>
              Loading members...
            </div>
          )}

          {/* Row 1 */}
          <div className={styles.formRow}>
            <div className={styles.formGroup} style={{ position: "relative" }}>
              <label className={styles.formLabel}>Member Info</label>
              <input 
                className={styles.formInput}
                placeholder="Type member name (e.g., ay...)"
                value={form.memberName} 
                onChange={handleMemberInputChange}
                onFocus={() => setShowDropdown(true)}
                disabled={membersLoading}
                autoComplete="off"
              />
              
              {/* Dropdown List */}
              {showDropdown && !membersLoading && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "white",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  maxHeight: "250px",
                  overflowY: "auto",
                  zIndex: 1000,
                  marginTop: "4px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}>
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                      <div
                        key={member.member_id}
                        onClick={() => handleSelectMember(member.full_name, member.member_id)}
                        style={{
                          padding: "12px 16px",
                          cursor: "pointer",
                          borderBottom: "1px solid #eee",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8f8f8")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                      >
                        <div style={{ fontWeight: "500", color: "#333" }}>
                          {member.full_name}
                        </div>
                        <div style={{ fontSize: "12px", color: "#999" }}>
                          ID: {member.member_id}
                        </div>
                      </div>
                    ))
                  ) : form.memberName ? (
                    <div style={{
                      padding: "12px 16px",
                      color: "#999",
                      textAlign: "center",
                    }}>
                      No members found matching "{form.memberName}"
                    </div>
                  ) : (
                    <div style={{
                      padding: "12px 16px",
                      color: "#999",
                      textAlign: "center",
                    }}>
                      Start typing to see members
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Date</label>
              <input className={styles.formInput} type="date" placeholder="MM/DD/YYYY"
                value={form.date} onChange={set("date")} disabled />
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
            { ["GCash", "Bank Transfer", "Credit Card"].includes(form.modeOfPayment) && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reference Number</label>
                <input className={styles.formInput} placeholder="Enter Reference Number"
                  value={form.referenceNumber} onChange={set("referenceNumber")} />
              </div>
            )}
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
