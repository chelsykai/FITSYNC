import { useState, useEffect, useRef } from "react";
import styles from "./RecordPaymentPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";
import { supabase } from "../../lib/supabaseClient";
import { getAuditActorRole } from "../../services/auditService";
import { updateMemberMembership } from "../../services/memberService";

// ── Helpers ───────────────────────────────────────────────────────────────────
const getTodayDateString = () => new Date().toISOString().split("T")[0];

const formatExpiry = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
};

/** Returns days until expiry (negative = already expired) */
const daysUntilExpiry = (dateStr) => {
  if (!dateStr) return null;
  const expiry = new Date(dateStr);
  if (isNaN(expiry.getTime())) return null;
  const today  = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((expiry - today) / 86400000);
};

// ── Default form states ───────────────────────────────────────────────────────
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

const defaultWalkInForm = {
  description: "",
  modeOfPayment: "Cash",
  referenceNumber: "",
  status: "Paid",
  total: "",
};

const defaultRegForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  plan: "",
};

// ── Fetch members ─────────────────────────────────────────────────────────────
const fetchMembers = async () => {
  try {
    const { data, error } = await supabase
      .from("member")
      .select("member_id, full_name, membership_type, monthly_validity, membership_validity, expiration_date")
      .order("full_name");
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching members:", err);
    return [];
  }
};

// ── Record payment (existing member) ──────────────────────────────────────────
const add_record = async (formData) => {
  try {
    if (!formData.memberId) throw new Error("Please select a valid member");
    const requiresRef = ["GCash", "Bank Transfer", "Credit Card"].includes(formData.modeOfPayment);
    const refNum = requiresRef && String(formData.referenceNumber || "").trim()
      ? String(formData.referenceNumber).trim() : null;

    const { error } = await supabase.from("record_payment").insert([{
      member_id:   formData.memberId,
      date:        formData.date,
      mop:         formData.modeOfPayment,
      ref_number:  refNum,
      status:      formData.status,
      amount_paid: parseInt(formData.total) || 0,
    }]);
    if (error) throw new Error(error.message);

    // Audit log
    try {
      const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      const actorName = currentUser?.username || currentUser?.name || "system";
      const actorRole = await getAuditActorRole();
      await supabase.from("audit_trail").insert([{
        user_name: actorName, user_role: actorRole,
        action_performed: "Recorded payment", affected_module: "Payments",
        affected_data: {
          memberId: formData.memberId, memberName: formData.memberName,
          amount: parseInt(formData.total) || 0, date: formData.date,
          mop: formData.modeOfPayment, ref_number: refNum, status: formData.status,
        },
        created_at: new Date().toISOString(),
      }]);
    } catch (logErr) { console.warn("Audit log failed:", logErr); }

    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
};

// ── Tabs config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: "existing", label: "1. Existing Member Payment", icon: "ti-user-check" },
  { id: "walkin",   label: "2. Walk-in Payment",          icon: "ti-walk"       },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function RecordPaymentPage({ onNavigate, activePage = "payments" }) {
  const [activeTab,       setActiveTab]       = useState("existing");
  const [form,            setForm]            = useState(defaultExistingForm);
  const [renewalForm,     setRenewalForm]     = useState(defaultRenewalForm);
  const [walkInForm,      setWalkInForm]      = useState(defaultWalkInForm);
  const [regForm,         setRegForm]         = useState(defaultRegForm);
  const [members,         setMembers]         = useState([]);
  const [selectedMember,  setSelectedMember]  = useState(null);
  const [error,           setError]           = useState("");
  const [walkInError,     setWalkInError]     = useState("");
  const [regError,        setRegError]        = useState("");
  const [renewalError,    setRenewalError]    = useState("");
  const [loading,         setLoading]         = useState(false);
  const [renewalLoading,  setRenewalLoading]  = useState(false);
  const [walkInLoading,   setWalkInLoading]   = useState(false);
  const [regLoading,      setRegLoading]      = useState(false);
  const [successMsg,      setSuccessMsg]      = useState("");
  const [renewalSuccess,  setRenewalSuccess]  = useState("");
  const [walkInSuccess,   setWalkInSuccess]   = useState("");
  const [regSuccess,      setRegSuccess]      = useState("");
  const [membersLoading,  setMembersLoading]  = useState(true);
  const [showDropdown,    setShowDropdown]    = useState(false);
  const [showRenewal,     setShowRenewal]     = useState(false);
  const dropdownRef = useRef(null);

  // Load members on mount
  useEffect(() => {
    (async () => {
      setMembersLoading(true);
      setMembers(await fetchMembers());
      setMembersLoading(false);
    })();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Member selection ────────────────────────────────────────────────────────
  const handleMemberInputChange = (e) => {
    setForm((prev) => ({ ...prev, memberName: e.target.value, memberId: "" }));
    setSelectedMember(null);
    setShowRenewal(false);
    setShowDropdown(true);
  };

  const handleSelectMember = (member) => {
    const days = daysUntilExpiry(member.expiration_date);
    // Auto-fill description and flag expiring/expired members
    const autoDesc = days !== null && days <= 7 ? "Monthly Renewal" : "";
    setForm((prev) => ({
      ...prev,
      memberName: member.full_name,
      memberId:   member.member_id,
      description: autoDesc,
    }));
    setSelectedMember(member);
    setShowDropdown(false);
    // Auto-open renewal panel if expiring within 7 days or already expired
    setShowRenewal(days !== null && days <= 7);
    setRenewalForm(defaultRenewalForm);
    setRenewalError("");
    setRenewalSuccess("");
  };

  // ── Form field setters ──────────────────────────────────────────────────────
  const set = (field) => (e) => {
    const value = e.target.value;
    if (field === "modeOfPayment") {
      const req = ["GCash", "Bank Transfer", "Credit Card"].includes(value);
      setForm({ ...form, modeOfPayment: value, referenceNumber: req ? form.referenceNumber : "" });
      return;
    }
    setForm({ ...form, [field]: value });
  };

  const setWI = (field) => (e) => {
    const value = e.target.value;
    if (field === "modeOfPayment") {
      const req = ["GCash", "Bank Transfer", "Credit Card"].includes(value);
      setWalkInForm({ ...walkInForm, modeOfPayment: value, referenceNumber: req ? walkInForm.referenceNumber : "" });
      return;
    }
    setWalkInForm({ ...walkInForm, [field]: value });
  };

  const filteredMembers = form.memberName
    ? members.filter((m) =>
        m.full_name.toLowerCase().includes(form.memberName.toLowerCase()) ||
        String(m.member_id).includes(form.memberName))
    : members;

  // ── Submit: existing member payment ────────────────────────────────────────
  const handleSubmit = async () => {
    setError(""); setSuccessMsg("");
    if (!form.memberName.trim()) { setError("Member Info is required"); return; }
    if (!form.memberId)          { setError("Please select a valid member from the list"); return; }
    if (!form.date)              { setError("Date is required"); return; }
    if (!form.total)             { setError("Total is required"); return; }
    const reqRef = ["GCash", "Bank Transfer", "Credit Card"].includes(form.modeOfPayment);
    if (reqRef && !form.referenceNumber.trim()) { setError("Reference Number is required"); return; }

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

  // ── Submit: renewal ─────────────────────────────────────────────────────────
  const handleRenewalSubmit = async () => {
    setRenewalError(""); setRenewalSuccess("");
    const months = parseInt(renewalForm.months, 10);
    const years  = parseInt(renewalForm.years,  10);
    const hasMonths = Number.isInteger(months) && months > 0;
    const hasYears  = Number.isInteger(years)  && years  > 0;

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
      // TODO: backend dev — also record a payment row for the renewal fee if needed
      await updateMemberMembership(selectedMember.member_id, {
        monthlyValidity:    hasMonths ? `${months} Month${months === 1 ? "" : "s"}` : selectedMember.monthly_validity    || "",
        membershipValidity: hasYears  ? `${years} Year${years   === 1 ? "" : "s"}`  : selectedMember.membership_validity || "",
        joinDate: getTodayDateString(), // extend from today
      });

      // Refresh member list so expiry reflects the update
      const refreshed = await fetchMembers();
      setMembers(refreshed);
      const updated = refreshed.find(m => m.member_id === selectedMember.member_id);
      if (updated) setSelectedMember(updated);

      setRenewalSuccess(
        `Renewed! New expiry: ${formatExpiry(updated?.expiration_date)}`
      );
      setRenewalForm(defaultRenewalForm);
    } catch (err) {
      setRenewalError(err.message || "Renewal failed. Please try again.");
    } finally {
      setRenewalLoading(false);
    }
  };

  // ── Submit: walk-in payment (UI stub) ───────────────────────────────────────
  const handleWalkInSubmit = async () => {
    setWalkInError(""); setWalkInSuccess("");
    if (!walkInForm.total) { setWalkInError("Total is required"); return; }
    setWalkInLoading(true);
    // TODO: backend dev — wire up walk-in payment API here
    setTimeout(() => {
      setWalkInSuccess("Walk-in payment recorded! (UI only — backend pending)");
      setWalkInForm(defaultWalkInForm);
      setWalkInLoading(false);
    }, 800);
  };

  // ── Submit: walk-in registration (UI stub) ──────────────────────────────────
  const handleRegSubmit = async () => {
    setRegError(""); setRegSuccess("");
    if (!regForm.firstName.trim() || !regForm.lastName.trim()) {
      setRegError("First and last name are required"); return;
    }
    if (!regForm.plan) { setRegError("Please select a plan"); return; }
    setRegLoading(true);
    // TODO: backend dev — wire up walk-in registration API here
    setTimeout(() => {
      setRegSuccess("Walk-in registration submitted! (UI only — backend pending)");
      setRegForm(defaultRegForm);
      setRegLoading(false);
    }, 800);
  };

  // ── Expiry status helpers ───────────────────────────────────────────────────
  const expiryDays    = daysUntilExpiry(selectedMember?.expiration_date);
  const isExpired     = expiryDays !== null && expiryDays < 0;
  const isExpiringSoon = expiryDays !== null && expiryDays >= 0 && expiryDays <= 7;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={styles.layout}>
      <Sidebar activePage={activePage} onNavigate={onNavigate} />

      <div className={`${styles.content} tab-slide-animation`}>

        {/* Title */}
        <div className={styles.titleRow}>
          <span className={styles.titleIcon}>🗂️</span>
          <h1 className={styles.title}>Record Payment</h1>
        </div>

        <div className={styles.mainLayout}>

          {/* ── LEFT — tabbed panel ── */}
          <div className={styles.leftPanel}>

            {/* Tab bar */}
            <div className={styles.tabBar}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className={`ti ${tab.icon}`} aria-hidden="true" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Tab 1: Existing Member Payment ── */}
            {activeTab === "existing" && (
              <div className={styles.formCard}>

                {error      && <div className={styles.alertError}>{error}</div>}
                {successMsg && <div className={styles.alertSuccess}>{successMsg}</div>}
                {membersLoading && <div className={styles.alertInfo}>Loading members…</div>}

                {/* Search */}
                <div className={styles.formGroup} ref={dropdownRef}>
                  <label className={styles.formLabel}>Search Member</label>
                  <div className={styles.searchWrap}>
                    <span className="ti ti-search" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#aaa", fontSize:15 }} aria-hidden="true" />
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
                      {filteredMembers.length > 0 ? filteredMembers.map((m) => (
                        <div key={m.member_id} className={styles.dropdownItem} onClick={() => handleSelectMember(m)}>
                          <span className={styles.dropdownName}>{m.full_name}</span>
                          <span className={styles.dropdownId}>ID: {m.member_id}</span>
                        </div>
                      )) : (
                        <div className={styles.dropdownEmpty}>
                          {form.memberName ? `No members found matching "${form.memberName}"` : "Start typing to see members"}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Member details */}
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
                      {isExpired      && " (Expired)"}
                      {isExpiringSoon && ` (${expiryDays === 0 ? "Today" : `${expiryDays}d left`})`}
                    </span>
                  </p>

                </div>

                {/* ── Renewal toggle button — outside member details, always visible after selection ── */}
                {selectedMember && (
                  <button
                    className={`${styles.renewalToggleBtn} ${showRenewal ? styles.renewalToggleBtnActive : ""}`}
                    onClick={() => { setShowRenewal(v => !v); setRenewalError(""); setRenewalSuccess(""); }}
                  >
                    <span className="ti ti-refresh" aria-hidden="true" />
                    {showRenewal ? "▲ Hide Renewal" : (isExpired || isExpiringSoon) ? " Renew Membership ⚠️" : " Renew Membership"}
                  </button>
                )}

                {/* ── Renewal panel ── */}
                {showRenewal && selectedMember && (
                  <div className={styles.renewalPanel}>
                    <p className={styles.renewalPanelTitle}>
                      <span className="ti ti-refresh" aria-hidden="true" />
                      Renewal — extends expiry from today
                    </p>

                    {renewalError   && <p className={styles.renewalError}>{renewalError}</p>}
                    {renewalSuccess && <p className={styles.renewalSuccess}>{renewalSuccess}</p>}

                    <div className={styles.renewalInputRow}>
                      {/* Months */}
                      <div className={styles.renewalInputGroup}>
                        <label className={styles.renewalInputLabel}>Months</label>
                        <div className={styles.renewalInputWrap}>
                          <input
                            className={styles.renewalInput}
                            type="number" min="1" step="1" placeholder="0"
                            value={renewalForm.months}
                            onChange={e => setRenewalForm(p => ({ ...p, months: e.target.value.replace(/[^\d]/g, "") }))}
                          />
                          <span className={styles.renewalUnit}>mo</span>
                        </div>
                      </div>
                      {/* Years */}
                      <div className={styles.renewalInputGroup}>
                        <label className={styles.renewalInputLabel}>Years</label>
                        <div className={styles.renewalInputWrap}>
                          <input
                            className={styles.renewalInput}
                            type="number" min="1" step="1" placeholder="0"
                            value={renewalForm.years}
                            onChange={e => setRenewalForm(p => ({ ...p, years: e.target.value.replace(/[^\d]/g, "") }))}
                          />
                          <span className={styles.renewalUnit}>yr</span>
                        </div>
                      </div>
                      {/* Confirm */}
                      <button
                        className={styles.renewalSubmitBtn}
                        onClick={handleRenewalSubmit}
                        disabled={renewalLoading || (!renewalForm.months && !renewalForm.years)}
                      >
                        {renewalLoading ? "Renewing…" : "Confirm"}
                      </button>
                    </div>

                    <p className={styles.renewalHint}>
                      This updates the member's expiration date in the database.
                      To also record a payment, fill in the form below and click "Add Record".
                    </p>
                  </div>
                )}

                {/* Date + Payment Details */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Date</label>
                    <input className={styles.formInput} type="date" value={form.date} disabled />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Payment Details</label>
                    <input className={styles.formInput} placeholder="e.g. Monthly Renewal"
                      value={form.description} onChange={set("description")} />
                  </div>
                </div>

                {/* Mode of Payment */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Mode Of Payment</label>
                    <select className={styles.formInput} value={form.modeOfPayment} onChange={set("modeOfPayment")}>
                      {["Cash","GCash","Bank Transfer","Credit Card"].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  {["GCash","Bank Transfer","Credit Card"].includes(form.modeOfPayment) && (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Reference Number</label>
                      <input className={styles.formInput} placeholder="Enter Reference Number"
                        value={form.referenceNumber} onChange={set("referenceNumber")} />
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Total</label>
                  <input className={styles.formInput} type="number" placeholder="Enter Total Amount"
                    value={form.total} onChange={set("total")} />
                </div>

                {/* Status + actions */}
                <div className={styles.formRowStatus}>
                  <div className={styles.statusGroup}>
                    <label className={styles.formLabel}>Status</label>
                    <div className={styles.radioRow}>
                      {["Paid","Unpaid"].map((s) => (
                        <label key={s} className={styles.radioOption}>
                          <input type="radio" name="status" value={s}
                            checked={form.status === s} onChange={set("status")}
                            style={{ accentColor:"#7eba56" }} />
                          {s}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className={styles.actionBtns}>
                    <button className={styles.addRecordBtn} onClick={handleSubmit} disabled={loading}>
                      {loading ? "Adding…" : "Add Record"}
                    </button>
                    <button className={styles.cancelBtn}
                      onClick={() => { setForm({ ...defaultExistingForm, date: getTodayDateString() }); setSelectedMember(null); setShowRenewal(false); setError(""); }}
                      disabled={loading}>
                      Clear
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* ── Tab 2: Walk-in Payment ── */}
            {activeTab === "walkin" && (
              <div className={styles.formCard}>

                {walkInError   && <div className={styles.alertError}>{walkInError}</div>}
                {walkInSuccess && <div className={styles.alertSuccess}>{walkInSuccess}</div>}

                {/* Member search */}
                <div className={styles.formGroup} ref={dropdownRef}>
                  <label className={styles.formLabel}>Search Member</label>
                  <div className={styles.searchWrap}>
                    <span className="ti ti-search" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#aaa", fontSize:15 }} aria-hidden="true" />
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
                      {filteredMembers.length > 0 ? filteredMembers.map((m) => (
                        <div key={m.member_id} className={styles.dropdownItem} onClick={() => handleSelectMember(m)}>
                          <span className={styles.dropdownName}>{m.full_name}</span>
                          <span className={styles.dropdownId}>ID: {m.member_id}</span>
                        </div>
                      )) : (
                        <div className={styles.dropdownEmpty}>
                          {form.memberName ? `No members found matching "${form.memberName}"` : "Start typing to see members"}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Mode Of Payment</label>
                    <select className={styles.formInput} value={walkInForm.modeOfPayment} onChange={setWI("modeOfPayment")}>
                      {["Cash","GCash","Bank Transfer","Credit Card"].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  {["GCash","Bank Transfer","Credit Card"].includes(walkInForm.modeOfPayment) && (
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Reference Number</label>
                      <input className={styles.formInput} placeholder="Enter Reference Number"
                        value={walkInForm.referenceNumber} onChange={setWI("referenceNumber")} />
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Payment Details</label>
                  <input className={styles.formInput} placeholder="e.g. Day Pass"
                    value={walkInForm.description} onChange={setWI("description")} />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Total</label>
                  <input className={styles.formInput} type="number" placeholder="Enter Total Amount"
                    value={walkInForm.total} onChange={setWI("total")} />
                </div>

                <div className={styles.formRowStatus}>
                  <div className={styles.statusGroup}>
                    <label className={styles.formLabel}>Status</label>
                    <div className={styles.radioRow}>
                      {["Paid","Unpaid"].map((s) => (
                        <label key={s} className={styles.radioOption}>
                          <input type="radio" name="wi-status" value={s}
                            checked={walkInForm.status === s} onChange={setWI("status")}
                            style={{ accentColor:"#7eba56" }} />
                          {s}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className={styles.actionBtns}>
                    <button className={styles.addRecordBtn} onClick={handleWalkInSubmit} disabled={walkInLoading}>
                      {walkInLoading ? "Adding…" : "Add Record"}
                    </button>
                    <button className={styles.cancelBtn}
                      onClick={() => { setWalkInForm(defaultWalkInForm); setWalkInError(""); }}
                      disabled={walkInLoading}>
                      Clear
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* ── RIGHT — Walk-in Registration ── */}
          <div className={styles.rightPanel}>
            <div className={styles.regCard}>
              <div className={styles.regHeader}>
                <span className="ti ti-clipboard-plus" style={{ fontSize:18 }} aria-hidden="true" />
                <h2 className={styles.regTitle}>3. Walk-in Registration</h2>
              </div>

              {regError   && <div className={styles.alertError}>{regError}</div>}
              {regSuccess && <div className={styles.alertSuccess}>{regSuccess}</div>}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>First Name</label>
                <input className={styles.formInput} placeholder="First Name"
                  value={regForm.firstName} onChange={e => setRegForm({ ...regForm, firstName: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Last Name</label>
                <input className={styles.formInput} placeholder="Last Name"
                  value={regForm.lastName} onChange={e => setRegForm({ ...regForm, lastName: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email Address</label>
                <input className={styles.formInput} placeholder="Email Address" type="email"
                  value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone Number</label>
                <input className={styles.formInput} placeholder="Phone Number"
                  value={regForm.phone} onChange={e => setRegForm({ ...regForm, phone: e.target.value })} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Select a Plan</label>
                <div className={styles.planList}>
                  {["Day Pass", "7-Day Pass", "Monthly"].map((plan) => (
                    <label key={plan} className={styles.planOption}>
                      <input type="radio" name="reg-plan" value={plan}
                        checked={regForm.plan === plan}
                        onChange={e => setRegForm({ ...regForm, plan: e.target.value })}
                        style={{ accentColor:"#7eba56" }} />
                      {plan}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.regActions}>
                <button className={styles.addRecordBtn} onClick={handleRegSubmit} disabled={regLoading}>
                  {regLoading ? "Registering…" : "Register"}
                </button>
                <button className={styles.cancelBtn}
                  onClick={() => { setRegForm(defaultRegForm); setRegError(""); }}
                  disabled={regLoading}>
                  Clear
                </button>
              </div>
            </div>

            <div className={styles.regCloseRow}>
              <button className={styles.closePageBtn} onClick={() => onNavigate("payments")}>Close</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}