import { useState, useEffect, useRef } from "react";
import styles from "./RecordPaymentPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";
import { supabase } from "../../lib/supabaseClient";
import { getAuditActorRole } from "../../services/auditService";

const getTodayDateString = () => new Date().toISOString().split("T")[0];

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

// ── Fetch members (with plan + expiry) ────────────────────────────────────────
const fetchMembers = async () => {
  try {
    const { data, error } = await supabase
      .from("member")
      .select("member_id, full_name, membership_type, monthly_expiry")
      .order("full_name");
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching members:", err);
    return [];
  }
};

// ── Record existing-member payment ────────────────────────────────────────────
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

    try {
      const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      const actorName = currentUser?.username || currentUser?.name || "system";
      const actorRole = await getAuditActorRole();
      await supabase.from("audit_trail").insert([{
        user_name: actorName, user_role: actorRole,
        action_performed: "Recorded payment", affected_module: "Payments",
        affected_data: { memberId: formData.memberId, memberName: formData.memberName,
          amount: parseInt(formData.total) || 0, date: formData.date,
          mop: formData.modeOfPayment, ref_number: refNum, status: formData.status },
        created_at: new Date().toISOString(),
      }]);
    } catch (logErr) { console.warn("Audit log failed:", logErr); }

    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
};

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "existing", label: "1. Existing Member Payment", icon: "ti-user-check" },
  { id: "walkin",   label: "2. Walk-in Payment",          icon: "ti-walk"       },
];

export default function RecordPaymentPage({ onNavigate, activePage = "payments" }) {
  const [activeTab,      setActiveTab]      = useState("existing");
  const [form,           setForm]           = useState(defaultExistingForm);
  const [walkInForm,     setWalkInForm]     = useState(defaultWalkInForm);
  const [regForm,        setRegForm]        = useState(defaultRegForm);
  const [members,        setMembers]        = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [error,          setError]          = useState("");
  const [walkInError,    setWalkInError]    = useState("");
  const [regError,       setRegError]       = useState("");
  const [loading,        setLoading]        = useState(false);
  const [walkInLoading,  setWalkInLoading]  = useState(false);
  const [regLoading,     setRegLoading]     = useState(false);
  const [successMsg,     setSuccessMsg]     = useState("");
  const [walkInSuccess,  setWalkInSuccess]  = useState("");
  const [regSuccess,     setRegSuccess]     = useState("");
  const [membersLoading, setMembersLoading] = useState(true);
  const [showDropdown,   setShowDropdown]   = useState(false);
  const dropdownRef = useRef(null);

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

  // ── Existing member handlers ────────────────────────────────────────────────
  const handleMemberInputChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, memberName: value, memberId: "" }));
    setSelectedMember(null);
    setShowDropdown(true);
  };

  const handleSelectMember = (member) => {
    setForm((prev) => ({ ...prev, memberName: member.full_name, memberId: member.member_id }));
    setSelectedMember(member);
    setShowDropdown(false);
  };

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
    ? members.filter((m) => m.full_name.toLowerCase().includes(form.memberName.toLowerCase()) ||
        String(m.member_id).includes(form.memberName))
    : members;

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
      setTimeout(() => onNavigate("payments"), 1500);
    } else {
      setError(result.error || "Failed to add payment record");
    }
    setLoading(false);
  };

  // Walk-in submit — UI only, wired up for backend later
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

  // Registration submit — UI only
  const handleRegSubmit = async () => {
    setRegError(""); setRegSuccess("");
    if (!regForm.firstName.trim() || !regForm.lastName.trim()) { setRegError("First and last name are required"); return; }
    if (!regForm.plan) { setRegError("Please select a plan"); return; }
    setRegLoading(true);
    // TODO: backend dev — wire up walk-in registration API here
    setTimeout(() => {
      setRegSuccess("Walk-in registration submitted! (UI only — backend pending)");
      setRegForm(defaultRegForm);
      setRegLoading(false);
    }, 800);
  };

  // ── Format expiry date ──────────────────────────────────────────────────────
  const formatExpiry = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className={styles.layout}>
      <Sidebar activePage={activePage} onNavigate={onNavigate} />

      <div className={`${styles.content} tab-slide-animation`}>

        {/* ── Title ── */}
        <div className={styles.titleRow}>
          <span className={styles.titleIcon}>🗂️</span>
          <h1 className={styles.title}>Record Payment</h1>
        </div>

        {/* ── Main two-column layout ── */}
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

                {/* Search member */}
                <div className={styles.formGroup} ref={dropdownRef}>
                  <label className={styles.formLabel}>Search Member</label>
                  <div className={styles.searchWrap}>
                    <span className="ti ti-search" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#aaa", fontSize:15 }} aria-hidden="true" />
                    <input
                      className={styles.searchInput}
                      placeholder="Search existing member name or ID"
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

                {/* Member details auto-populated */}
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
                    <span>{selectedMember ? formatExpiry(selectedMember.monthly_expiry) : "[Auto-populated]"}</span>
                  </p>
                </div>

                {/* Date + Payment Details */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Date</label>
                    <input className={styles.formInput} type="date" value={form.date} onChange={set("date")} disabled />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Payment Details</label>
                    <input className={styles.formInput} placeholder="e.g. Monthly Renewal" value={form.description} onChange={set("description")} />
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
                      <input className={styles.formInput} placeholder="Enter Reference Number" value={form.referenceNumber} onChange={set("referenceNumber")} />
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Total</label>
                  <input className={styles.formInput} type="number" placeholder="Enter Total Amount" value={form.total} onChange={set("total")} />
                </div>

                {/* Status + actions */}
                <div className={styles.formRowStatus}>
                  <div className={styles.statusGroup}>
                    <label className={styles.formLabel}>Status</label>
                    <div className={styles.radioRow}>
                      {["Paid","Unpaid"].map((s) => (
                        <label key={s} className={styles.radioOption}>
                          <input type="radio" name="status" value={s} checked={form.status === s} onChange={set("status")} style={{ accentColor:"#7eba56" }} />
                          {s}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className={styles.actionBtns}>
                    <button className={styles.addRecordBtn} onClick={handleSubmit} disabled={loading}>
                      {loading ? "Adding…" : "Add Record"}
                    </button>
                    <button className={styles.cancelBtn} onClick={() => { setForm({ ...defaultExistingForm, date: getTodayDateString() }); setSelectedMember(null); setError(""); }} disabled={loading}>Clear</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab 2: Walk-in Payment ── */}
            {activeTab === "walkin" && (
              <div className={styles.formCard}>

                {walkInError   && <div className={styles.alertError}>{walkInError}</div>}
                {walkInSuccess && <div className={styles.alertSuccess}>{walkInSuccess}</div>}

                {/* Mode of Payment + Reference */}
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
                      <input className={styles.formInput} placeholder="Enter Reference Number" value={walkInForm.referenceNumber} onChange={setWI("referenceNumber")} />
                    </div>
                  )}
                </div>

                {/* Payment Details */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Payment Details</label>
                  <input className={styles.formInput} placeholder="e.g. Day Pass" value={walkInForm.description} onChange={setWI("description")} />
                </div>

                {/* Total */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Total</label>
                  <input className={styles.formInput} type="number" placeholder="Enter Total Amount" value={walkInForm.total} onChange={setWI("total")} />
                </div>

                {/* Status + actions */}
                <div className={styles.formRowStatus}>
                  <div className={styles.statusGroup}>
                    <label className={styles.formLabel}>Status</label>
                    <div className={styles.radioRow}>
                      {["Paid","Unpaid"].map((s) => (
                        <label key={s} className={styles.radioOption}>
                          <input type="radio" name="wi-status" value={s} checked={walkInForm.status === s} onChange={setWI("status")} style={{ accentColor:"#7eba56" }} />
                          {s}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className={styles.actionBtns}>
                    <button className={styles.addRecordBtn} onClick={handleWalkInSubmit} disabled={walkInLoading}>
                      {walkInLoading ? "Adding…" : "Add Record"}
                    </button>
                    <button className={styles.cancelBtn} onClick={() => { setWalkInForm(defaultWalkInForm); setWalkInError(""); }} disabled={walkInLoading}>Clear</button>
                  </div>
                </div>
              </div> )}
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
                <input className={styles.formInput} placeholder="First Name" value={regForm.firstName} onChange={(e) => setRegForm({ ...regForm, firstName: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Last Name</label>
                <input className={styles.formInput} placeholder="Last Name" value={regForm.lastName} onChange={(e) => setRegForm({ ...regForm, lastName: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email Address</label>
                <input className={styles.formInput} placeholder="Email Address" type="email" value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone Number</label>
                <input className={styles.formInput} placeholder="Phone Number" value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} />
              </div>

              {/* Plan selection */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Select a Plan</label>
                <div className={styles.planList}>
                  {["Day Pass", "7-Day Pass", "Monthly"].map((plan) => (
                    <label key={plan} className={styles.planOption}>
                      <input
                        type="radio"
                        name="reg-plan"
                        value={plan}
                        checked={regForm.plan === plan}
                        onChange={(e) => setRegForm({ ...regForm, plan: e.target.value })}
                        style={{ accentColor:"#7eba56" }}
                      />
                      {plan}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.regActions}>
                <button className={styles.addRecordBtn} onClick={handleRegSubmit} disabled={regLoading}>
                  {regLoading ? "Registering…" : "Register"}
                </button>
                <button className={styles.cancelBtn} onClick={() => { setRegForm(defaultRegForm); setRegError(""); }} disabled={regLoading}>Clear</button>
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