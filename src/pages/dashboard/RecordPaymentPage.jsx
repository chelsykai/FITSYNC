import { useState, useEffect, useRef } from "react";
import styles from "./RecordPaymentPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";
import { supabase } from "../../lib/supabaseClient";
import { getAuditActorRole } from "../../services/auditService";
import { updateMemberMembership } from "../../services/memberService";

const getTodayDateString = () => new Date().toISOString().split("T")[0];

const formatExpiry = (dateStr) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
};

const daysUntilExpiry = (dateStr) => {
  if (!dateStr) return null;
  const expiry = new Date(dateStr);
  if (Number.isNaN(expiry.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((expiry - today) / 86400000);
};

const defaultExistingForm = {
  memberName: "",
  memberId: "",
  date: getTodayDateString(),
  description: "",
  modeOfPayment: "Cash",
  referenceNumber: "",
  status: "Paid",
  total: "",
};

const defaultRenewalForm = {
  months: "",
  years: "",
};

const fetchMembers = async () => {
  try {
    const { data, error } = await supabase
      .from("member")
      .select("member_id, full_name, membership_type, monthly_validity, membership_validity, expiration_date")
      .order("full_name");
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching members:", error);
    return [];
  }
};

const add_record = async (formData) => {
  try {
    if (!formData.memberId) throw new Error("Please select a valid member");
    const requiresRef = ["GCash", "Bank Transfer", "Credit Card"].includes(formData.modeOfPayment);
    const refNum = requiresRef && String(formData.referenceNumber || "").trim()
      ? String(formData.referenceNumber).trim()
      : null;

    const { error } = await supabase.from("record_payment").insert([{
      member_id: formData.memberId,
      date: formData.date,
      mop: formData.modeOfPayment,
      ref_number: refNum,
      status: formData.status,
      amount_paid: Number.parseInt(formData.total, 10) || 0,
    }]);

    if (error) throw new Error(error.message);

    try {
      const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      const actorName = currentUser?.username || currentUser?.name || "system";
      const actorRole = await getAuditActorRole();
      await supabase.from("audit_trail").insert([{
        user_name: actorName,
        user_role: actorRole,
        action_performed: "Recorded payment",
        affected_module: "Payments",
        affected_data: {
          memberId: formData.memberId,
          memberName: formData.memberName,
          amount: Number.parseInt(formData.total, 10) || 0,
          date: formData.date,
          mop: formData.modeOfPayment,
          ref_number: refNum,
          status: formData.status,
        },
        created_at: new Date().toISOString(),
      }]);
    } catch (logErr) {
      console.warn("Audit log failed:", logErr);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};



export default function RecordPaymentPage({ onNavigate, activePage = "payments" }) {
  const [form, setForm] = useState(defaultExistingForm);
  const [renewalForm, setRenewalForm] = useState(defaultRenewalForm);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [error, setError] = useState("");
  const [renewalError, setRenewalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [renewalSuccess, setRenewalSuccess] = useState("");
  const [membersLoading, setMembersLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showRenewal, setShowRenewal] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    (async () => {
      setMembersLoading(true);
      setMembers(await fetchMembers());
      setMembersLoading(false);
    })();
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMemberInputChange = (event) => {
    setForm((prev) => ({ ...prev, memberName: event.target.value, memberId: "" }));
    setSelectedMember(null);
    setShowRenewal(false);
    setShowDropdown(true);
  };

  const handleSelectMember = (member) => {
    const days = daysUntilExpiry(member.expiration_date);
    setForm((prev) => ({
      ...prev,
      memberName: member.full_name,
      memberId: member.member_id,
      description: days !== null && days <= 7 ? "Monthly Renewal" : "",
    }));
    setSelectedMember(member);
    setShowDropdown(false);
    setShowRenewal(days !== null && days <= 7);
    setRenewalForm(defaultRenewalForm);
    setRenewalError("");
    setRenewalSuccess("");
  };

  const set = (field) => (event) => {
    const value = event.target.value;
    if (field === "modeOfPayment") {
      const requiresRef = ["GCash", "Bank Transfer", "Credit Card"].includes(value);
      setForm({
        ...form,
        modeOfPayment: value,
        referenceNumber: requiresRef ? form.referenceNumber : "",
      });
      return;
    }
    setForm({ ...form, [field]: value });
  };

  const filteredMembers = form.memberName
    ? members.filter((member) =>
        member.full_name.toLowerCase().includes(form.memberName.toLowerCase()) ||
        String(member.member_id).includes(form.memberName)
      )
    : members;

  const handleSubmit = async () => {
    setError("");
    setSuccessMsg("");

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
    const requiresRef = ["GCash", "Bank Transfer", "Credit Card"].includes(form.modeOfPayment);
    if (requiresRef && !form.referenceNumber.trim()) {
      setError("Reference Number is required");
      return;
    }

    setLoading(true);
    const result = await add_record(form);
    if (result.success) {
      setSuccessMsg("Payment record added successfully!");
      setForm({ ...defaultExistingForm, date: getTodayDateString() });
      setSelectedMember(null);
      setShowRenewal(false);
      setTimeout(() => onNavigate("payments"), 1500);
    } else {
      setError(result.error || "Failed to add payment record");
    }
    setLoading(false);
  };

  const handleRenewalSubmit = async () => {
    setRenewalError("");
    setRenewalSuccess("");

    const months = Number.parseInt(renewalForm.months, 10);
    const years = Number.parseInt(renewalForm.years, 10);
    const hasMonths = Number.isInteger(months) && months > 0;
    const hasYears = Number.isInteger(years) && years > 0;

    if (!hasMonths && !hasYears) {
      setRenewalError("Please enter months or years to renew.");
      return;
    }
    if (!selectedMember?.member_id) {
      setRenewalError("No member selected.");
      return;
    }

    setRenewalLoading(true);
    try {
      await updateMemberMembership(selectedMember.member_id, {
        monthlyValidity: hasMonths ? `${months} Month${months === 1 ? "" : "s"}` : selectedMember.monthly_validity || "",
        membershipValidity: hasYears ? `${years} Year${years === 1 ? "" : "s"}` : selectedMember.membership_validity || "",
        joinDate: getTodayDateString(),
      });

      const refreshed = await fetchMembers();
      setMembers(refreshed);
      const updated = refreshed.find((member) => member.member_id === selectedMember.member_id);
      if (updated) setSelectedMember(updated);

      setRenewalSuccess(`Renewed! New expiry: ${formatExpiry(updated?.expiration_date)}`);
      setRenewalForm(defaultRenewalForm);
    } catch (error) {
      setRenewalError(error.message || "Renewal failed. Please try again.");
    } finally {
      setRenewalLoading(false);
    }
  };

  const expiryDays = daysUntilExpiry(selectedMember?.expiration_date);
  const isExpired = expiryDays !== null && expiryDays < 0;
  const isExpiringSoon = expiryDays !== null && expiryDays >= 0 && expiryDays <= 7;

  return (
    <div className={styles.layout}>
      <Sidebar activePage={activePage} onNavigate={onNavigate} />

      <div className={`${styles.content} tab-slide-animation`}>
        <div className={styles.titleRow}>
          <span className={styles.titleIcon}>🗂️</span>
          <h1 className={styles.title}>Record Payment</h1>
        </div>

        <div className={styles.mainLayout}>
          <div className={styles.leftPanel}>
            <div className={styles.formCard}>
              {error && <div className={styles.alertError}>{error}</div>}
              {successMsg && <div className={styles.alertSuccess}>{successMsg}</div>}
              {membersLoading && <div className={styles.alertInfo}>Loading members…</div>}

              <div className={styles.formGroup} ref={dropdownRef}>
              <label className={styles.formLabel}>Search Member</label>
              <div className={styles.searchWrap}>
                <span className="ti ti-search" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: 15 }} aria-hidden="true" />
                <input
                  className={styles.searchInput}
                  placeholder="Search member name or ID"
                  value={form.memberName}
                  onChange={handleMemberInputChange}
                  onFocus={() => setShowDropdown(true)}
                  disabled={membersLoading}
                  autoComplete="off"
                />
              </div>
              {showDropdown && !membersLoading && (
                <div className={styles.dropdown}>
                  {filteredMembers.length > 0 ? filteredMembers.map((member) => (
                    <div key={member.member_id} className={styles.dropdownItem} onClick={() => handleSelectMember(member)}>
                      <span className={styles.dropdownName}>{member.full_name}</span>
                      <span className={styles.dropdownId}>ID: {member.member_id}</span>
                    </div>
                  )) : (
                    <div className={styles.dropdownEmpty}>
                      {form.memberName ? `No members found matching "${form.memberName}"` : "Start typing to see members"}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.memberDetails}>
              <p className={styles.memberDetailsTitle}>Member Details</p>
              <p className={styles.memberDetailsRow}>
                <span className={styles.memberDetailsKey}>Name:</span>
                <span>{selectedMember?.full_name || "[Auto-populated]"}</span>
              </p>
              <p className={styles.memberDetailsRow}>
                <span className={styles.memberDetailsKey}>Current Plan:</span>
                <span>{selectedMember?.membership_type || "[Auto-populated]"}</span>
              </p>
              <p className={styles.memberDetailsRow}>
                <span className={styles.memberDetailsKey}>Expiration:</span>
                <span className={isExpired ? styles.expiryExpired : isExpiringSoon ? styles.expiryWarn : undefined}>
                  {selectedMember ? formatExpiry(selectedMember.expiration_date) : "[Auto-populated]"}
                  {isExpired && " (Expired)"}
                  {isExpiringSoon && ` (${expiryDays === 0 ? "Today" : `${expiryDays}d left`})`}
                </span>
              </p>
            </div>

            {selectedMember && (
              <button
                type="button"
                className={`${styles.renewalToggleBtn} ${showRenewal ? styles.renewalToggleBtnActive : ""}`}
                onClick={() => { setShowRenewal((value) => !value); setRenewalError(""); setRenewalSuccess(""); }}
              >
                <span className="ti ti-refresh" aria-hidden="true" />
                {showRenewal ? "▲ Hide Renewal" : (isExpired || isExpiringSoon) ? " Renew Membership ⚠️" : " Renew Membership"}
              </button>
            )}

            {showRenewal && selectedMember && (
              <div className={styles.renewalPanel}>
                <p className={styles.renewalPanelTitle}>
                  <span className="ti ti-refresh" aria-hidden="true" />
                  Renewal — extends expiry from today
                </p>
                {renewalError && <p className={styles.renewalError}>{renewalError}</p>}
                {renewalSuccess && <p className={styles.renewalSuccess}>{renewalSuccess}</p>}

                <div className={styles.renewalInputRow}>
                  <div className={styles.renewalInputGroup}>
                    <label className={styles.renewalInputLabel}>Months</label>
                    <div className={styles.renewalInputWrap}>
                      <input
                        className={styles.renewalInput}
                        type="number"
                        min="1"
                        step="1"
                        placeholder="0"
                        value={renewalForm.months}
                        onChange={(event) => setRenewalForm((prev) => ({ ...prev, months: event.target.value.replace(/[^\d]/g, "") }))}
                      />
                      <span className={styles.renewalUnit}>mo</span>
                    </div>
                  </div>
                  <div className={styles.renewalInputGroup}>
                    <label className={styles.renewalInputLabel}>Years</label>
                    <div className={styles.renewalInputWrap}>
                      <input
                        className={styles.renewalInput}
                        type="number"
                        min="1"
                        step="1"
                        placeholder="0"
                        value={renewalForm.years}
                        onChange={(event) => setRenewalForm((prev) => ({ ...prev, years: event.target.value.replace(/[^\d]/g, "") }))}
                      />
                      <span className={styles.renewalUnit}>yr</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.renewalSubmitBtn}
                    onClick={handleRenewalSubmit}
                    disabled={renewalLoading || (!renewalForm.months && !renewalForm.years)}
                  >
                    {renewalLoading ? "Renewing…" : "Confirm"}
                  </button>
                </div>

                <p className={styles.renewalHint}>
                  This updates the member&apos;s expiration date in the database.
                </p>
              </div>
            )}

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Date</label>
                <input className={styles.formInput} type="date" value={form.date} disabled />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Payment Details</label>
                <input className={styles.formInput} placeholder="e.g. Monthly Renewal" value={form.description} onChange={set("description")} />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mode Of Payment</label>
                <select className={styles.formInput} value={form.modeOfPayment} onChange={set("modeOfPayment")}>
                  {["Cash", "GCash", "Bank Transfer", "Credit Card"].map((mode) => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>
              {["GCash", "Bank Transfer", "Credit Card"].includes(form.modeOfPayment) && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Reference Number</label>
                  <input className={styles.formInput} placeholder="Enter Reference Number" value={form.referenceNumber} onChange={set("referenceNumber")} />
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Total</label>
              <input className={styles.formInput} type="number" placeholder="Enter Total Amount" value={form.total} onChange={set("total")} />
            </div>

            <div className={styles.formRowStatus}>
              <div className={styles.statusGroup}>
                <label className={styles.formLabel}>Status</label>
                <div className={styles.radioRow}>
                  {["Paid", "Unpaid"].map((status) => (
                    <label key={status} className={styles.radioOption}>
                      <input type="radio" name="status" value={status} checked={form.status === status} onChange={set("status")} style={{ accentColor: "#7eba56" }} />
                      {status}
                    </label>
                  ))}
                </div>
              </div>
              <div className={styles.actionBtns}>
                <button className={styles.addRecordBtn} onClick={handleSubmit} disabled={loading}>
                  {loading ? "Adding…" : "Add Record"}
                </button>
                <button
                  className={styles.cancelBtn}
                  onClick={() => {
                    setForm({ ...defaultExistingForm, date: getTodayDateString() });
                    setSelectedMember(null);
                    setShowRenewal(false);
                    setError("");
                  }}
                  disabled={loading}
                >
                  Clear
                </button>
              </div>
            </div>
            </div>

            <div className={styles.closeRow}>
              <button className={styles.closePageBtn} onClick={() => onNavigate("payments")}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
