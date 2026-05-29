import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./AccountsPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";
import CreateAccountModal from "../../components/modals/accounts/CreateAccountModal";
import EditAccountModal from "../../components/modals/accounts/EditAccountModal";
import DeleteAccountModal from "../../components/modals/accounts/DeleteAccountModal";
import { supabase } from "../../lib/supabaseClient";
import { fetchAccounts, addAccount, updateAccount, deleteAccount } from "../../services/accountService";
import { addWorkingDays } from "../../utils/dateUtils";
import ReAuthModal from "../../components/ReAuthModal";
import { fetchAuditLogs, getAuditUsers } from "../../services/auditService";

const ITEMS_PER_PAGE = 5;

// ── Dropdown ──────────────────────────────────────────────────────────────────
function ManageDropdown({ account, onEdit, onDelete, onReqChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.dropdownWrap} ref={ref}>
      <button
        className={styles.manageBtn}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        Manage
        <span className={`ti ti-chevron-down ${styles.manageCaret} ${open ? styles.manageCaretOpen : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div className={styles.dropdownMenu}>
          <button className={styles.dropdownItem} onClick={() => { setOpen(false); onEdit(account); }}>
            <span className="ti ti-pencil" aria-hidden="true" /> Edit
          </button>
          <button className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`} onClick={() => { setOpen(false); onDelete(account); }}>
            <span className="ti ti-trash" aria-hidden="true" /> Delete
          </button>
          <div className={styles.dropdownDivider} />
          <button className={`${styles.dropdownItem} ${styles.dropdownItemWarn}`} onClick={() => { setOpen(false); onReqChange(account); }}>
            <span className="ti ti-key" aria-hidden="true" /> Req. Change
          </button>
        </div>
      )}
    </div>
  );
}

// ── Last activity badge ───────────────────────────────────────────────────────
function LastActivityBadge({ lastActivity }) {
  if (!lastActivity) return <span className={styles.activityNa}>N/A</span>;
  const date = new Date(lastActivity);
  if (isNaN(date.getTime())) return <span className={styles.activityNa}>N/A</span>;

  const now = new Date();
  const diffMs    = now - date;
  const diffMins  = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays  = Math.floor(diffMs / 86400000);

  let label, cls;
  if (diffMins < 5)        { label = "Just now";           cls = styles.activityNow;    }
  else if (diffMins < 60)  { label = `${diffMins}m ago`;   cls = styles.activityRecent; }
  else if (diffHours < 24) { label = `${diffHours}h ago`;  cls = styles.activityRecent; }
  else if (diffDays === 1) { label = "Yesterday";           cls = styles.activityOld;    }
  else                     { label = `${diffDays}d ago`;    cls = styles.activityOld;    }

  const formatted = date.toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });

  return (
    <span className={`${styles.activityBadge} ${cls}`} title={formatted}>
      <span className={styles.activityDot} aria-hidden="true" />
      {label}
    </span>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AccountsPage({ onNavigate, activePage = "accounts", isAdmin = false }) {
  const [accounts,        setAccounts]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [auditLogs,       setAuditLogs]       = useState([]);
  const [auditLoading,    setAuditLoading]    = useState(false);
  const [auditError,      setAuditError]      = useState(null);
  const [admins,          setAdmins]          = useState(["all users"]);
  const [showAudit,       setShowAudit]       = useState(false);
  const [filterAdmin,     setFilterAdmin]     = useState("");
  const [startDate,       setStartDate]       = useState("");
  const [endDate,         setEndDate]         = useState("");
  const [page,            setPage]            = useState(1);
  const [showCreate,      setShowCreate]      = useState(false);
  const [editTarget,      setEditTarget]      = useState(null);
  const [deleteTarget,    setDeleteTarget]    = useState(null);
  const [showReAuth,      setShowReAuth]      = useState(false);
  const [pendingAction,   setPendingAction]   = useState(null);

  const loadAccounts = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      const data = await fetchAccounts();
      setAccounts(data);
    } catch (err) {
      setError(err.message || "Failed to load accounts");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts(true);
    const ch = supabase
      .channel("accounts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "system_user" }, () => loadAccounts())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [loadAccounts]);

  useEffect(() => {
    const id = window.setInterval(() => loadAccounts(), 5000);
    const onFocus = () => loadAccounts();
    window.addEventListener("focus", onFocus);
    return () => { window.clearInterval(id); window.removeEventListener("focus", onFocus); };
  }, [loadAccounts]);

  const loadAuditData = useCallback(async () => {
    try {
      setAuditLoading(true);
      setAuditError(null);
      const [logs, users] = await Promise.all([fetchAuditLogs(), getAuditUsers()]);
      setAuditLogs(logs);
      setAdmins(users);
      setFilterAdmin("");
    } catch (err) {
      setAuditError(err.message || "Failed to load audit logs");
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showAudit) return;
    loadAuditData();
    const ch = supabase
      .channel("audit-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_trail" }, () => loadAuditData())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [showAudit, loadAuditData]);

  const totalPages = Math.ceil(accounts.length / ITEMS_PER_PAGE);
  const paginated  = accounts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const filteredLogs = (() => {
    const val = (filterAdmin || "").trim().toLowerCase();
    if (!val || val === "all users" || val === "all admins") return auditLogs;
    return auditLogs.filter((l) => (l.user || "").toLowerCase().includes(val));
  })();

  const filteredLogsByDate = filteredLogs.filter((l) => {
    const timeStr = l.timeISO || l.time || null;
    if (!timeStr) return true;
    const t = new Date(timeStr);
    if (isNaN(t.getTime())) return true;
    if (startDate && t < new Date(startDate + "T00:00:00")) return false;
    if (endDate   && t > new Date(endDate   + "T23:59:59.999")) return false;
    return true;
  });

  const handleCreate = async (newAccount) => {
    try {
      const created = await addAccount(newAccount);
      setAccounts((prev) => [created, ...prev]);
    } catch (err) {
      setError("Failed to create account: " + err.message);
      throw err;
    }
  };

  const handleSave = async (updated) => {
    try {
      const result = await updateAccount(updated.id, updated);
      setAccounts((prev) => prev.map((a) => String(a.id) === String(updated.id) ? result : a));
      setEditTarget(null);
      loadAccounts();
    } catch (err) {
      setError("Failed to update account: " + err.message);
    }
  };

  const handleDelete = async (target) => {
    try {
      await deleteAccount(target.id, target);
      setAccounts((prev) => prev.filter((a) => String(a.id) !== String(target.id)));
      loadAccounts();
    } catch (err) {
      setError("Failed to delete account: " + err.message);
    }
  };

  const requestAction = (type, target = null) => {
    setPendingAction({ type, target });
    setShowReAuth(true);
  };

  const handleReAuthSuccess = () => {
    setShowReAuth(false);
    const { type, target } = pendingAction || {};
    if (type === "create")    setShowCreate(true);
    if (type === "edit")      setEditTarget(target);
    if (type === "delete")    setDeleteTarget(target);
    if (type === "audit")     setShowAudit(true);
    if (type === "reqChange") handleRequestPasswordChange(target);
    setPendingAction(null);
  };

  const handleRequestPasswordChange = async (account) => {
    try {
      const deadline = addWorkingDays(new Date(), 5);
      const deadlineStr = deadline.toISOString().split("T")[0];
      await updateAccount(account.id, {
        password_change_required: true,
        password_change_deadline: deadlineStr,
      });
      alert(`Password change requested for ${account.name}.\nDeadline: ${deadlineStr} (5 working days)`);
      loadAccounts();
    } catch (err) {
      setError("Failed to request password change: " + err.message);
    }
  };

  return (
    <>
      <div className={styles.layout}>
        <Sidebar activePage={activePage} onNavigate={onNavigate} isAdmin={isAdmin} />

        <div className={`${styles.content} tab-slide-animation`}>

          {/* ── ACCOUNTS TABLE ── */}
          {!showAudit && (
            <>
              {/* Page header — title left, Audit Trail right */}
              <div className={styles.pageHeader}>
                <h1 className={styles.title}>Accounts</h1>
                {isAdmin && (
                  <button className={styles.auditBtn} onClick={() => requestAction("audit")}>
                    <span className="ti ti-clipboard-list" aria-hidden="true" />
                    Audit Trail
                  </button>
                )}
              </div>

              {/* Table card — fills remaining height */}
              <div className={styles.tableCard}>
                {error && (
                  <div className={styles.errorBanner}>
                    {error}
                    <button onClick={() => setError(null)} className={styles.errorClose}>✕</button>
                  </div>
                )}

                {/* toolbar: Add Account left */}
                {isAdmin && (
                  <div className={styles.actionRow}>
                    <button className={styles.addBtn} onClick={() => requestAction("create")}>
                      <span className="ti ti-user-plus" aria-hidden="true" />
                      Add Account
                    </button>
                  </div>
                )}

                {loading ? (
                  <div className={styles.emptyState}>Loading accounts…</div>
                ) : accounts.length === 0 ? (
                  <div className={styles.emptyState}>No accounts found. Click "Add Account" to create one.</div>
                ) : (
                  <>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Staff ID</th>
                          <th>Name</th>
                          <th>Role</th>
                          <th>Username</th>
                          <th>Last Activity</th>
                          {isAdmin && <th>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map((a) => (
                          <tr key={a.id}>
                            <td>{a.id}</td>
                            <td>{a.name}</td>
                            <td>
                              <span className={`${styles.roleBadge} ${a.role?.toLowerCase() === "admin" ? styles.roleBadgeAdmin : styles.roleBadgeStaff}`}>
                                {a.role}
                              </span>
                            </td>
                            <td>{a.email}</td>
                            <td>
                              <LastActivityBadge lastActivity={a.last_activity || a.lastActivity || a.last_login} />
                            </td>
                            {isAdmin && (
                              <td>
                                <ManageDropdown
                                  account={a}
                                  onEdit={(acc) => requestAction("edit", acc)}
                                  onDelete={(acc) => requestAction("delete", acc)}
                                  onReqChange={(acc) => requestAction("reqChange", acc)}
                                />
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className={styles.pagination}>
                      <button className={styles.pageBtn} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button key={i + 1} className={`${styles.pageBtn} ${page === i + 1 ? styles.activePage : ""}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
                      ))}
                      <button className={styles.pageBtn} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
                      <span className={styles.pageInfo}>{(page - 1) * ITEMS_PER_PAGE + 1} out of {accounts.length} entries</span>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* ── AUDIT TRAIL ── */}
          {showAudit && (
            <>
              <div className={styles.pageHeader}>
                <h1 className={styles.title}>Audit Trail</h1>
                <button className={styles.auditBtn} onClick={() => setShowAudit(false)}>
                  <span className="ti ti-arrow-left" aria-hidden="true" />
                  Back
                </button>
              </div>

              <div className={styles.tableCard}>
                {auditError && (
                  <div className={styles.errorBanner}>
                    {auditError}
                    <button onClick={() => setAuditError(null)} className={styles.errorClose}>✕</button>
                  </div>
                )}

                <p className={styles.auditDesc}>
                  Track staff/admin actions with timestamps. Use the <em>filter</em> to view by user.
                </p>

                <div className={styles.filterRow}>
                  <span className={styles.filterLabel}>Search user</span>
                  <input
                    className={styles.filterSelect}
                    placeholder="Type username..."
                    value={filterAdmin}
                    onChange={(e) => setFilterAdmin(e.target.value)}
                  />
                  <span className={styles.filterLabel} style={{ marginLeft: 16 }}>Date range</span>
                  <input type="date" className={styles.filterDate} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  <span style={{ margin: "0 8px" }}>to</span>
                  <input type="date" className={styles.filterDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  <button className={styles.clearBtn} onClick={() => { setStartDate(""); setEndDate(""); }}>Clear Dates</button>
                </div>

                {auditLoading ? (
                  <div className={styles.emptyState}>Loading audit logs…</div>
                ) : auditLogs.length === 0 ? (
                  <div className={styles.emptyState}>No audit logs found.</div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>User</th>
                        <th>Role</th>
                        <th>Action</th>
                        <th>Changes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogsByDate.map((log, i) => (
                        <tr key={i}>
                          <td className={styles.timeCell}>{log.time}</td>
                          <td><strong>{log.user}</strong></td>
                          <td>{log.role || "N/A"}</td>
                          <td>{log.action}</td>
                          <td>
                            <div className={styles.changes}>
                              {(() => {
                                const action  = log.action || "";
                                const changes = log.changes || {};
                                const subjectName = changes.accountName || changes.memberName || changes.fullName || changes.name || changes.member || changes.member_id || "";
                                if (action.includes("Deleted")) return <span style={{ color: "#dc3545", fontWeight: 500 }}>deleted {subjectName}</span>;
                                if (action.includes("Created")) return <span style={{ color: "#28a745", fontWeight: 500 }}>created {subjectName}</span>;
                                if (action.includes("Updated")) {
                                  const entries = Object.entries(changes).filter(([k]) => k !== "accountId" && k !== "accountName");
                                  if (!entries.length) return <span>No changes recorded</span>;
                                  return (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                      {subjectName && <div><span style={{ fontWeight: 500 }}>Updated:</span> {subjectName}</div>}
                                      {entries.map(([k, v]) => typeof v === "object" && v.old !== undefined
                                        ? <div key={k}><span style={{ fontWeight: 500 }}>{k}:</span> {v.old} → {v.new}</div>
                                        : null)}
                                    </div>
                                  );
                                }
                                if (action.toLowerCase().includes("record")) {
                                  const memberId = changes.memberId || changes.member_id || changes.member || "";
                                  const amount   = changes.amount || changes.amount_paid || "";
                                  return <span style={{ color: "#007bff", fontWeight: 500 }}>recorded payment{memberId ? ` for ${memberId}` : ""}{amount ? ` — ₱${amount}` : ""}</span>;
                                }
                                return <span>Unknown action</span>;
                              })()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

        </div>
      </div>

      {showCreate && isAdmin && (
        <CreateAccountModal accounts={accounts} onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
      {editTarget && isAdmin && (
        <EditAccountModal account={editTarget} onClose={() => setEditTarget(null)} onSave={handleSave} />
      )}
      {deleteTarget && isAdmin && (
        <DeleteAccountModal account={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
      )}
      {showReAuth && (
        <ReAuthModal
          actionLabel={
            pendingAction?.type === "create"    ? "add a new account"          :
            pendingAction?.type === "edit"      ? "edit this account"          :
            pendingAction?.type === "delete"    ? "delete this account"        :
            pendingAction?.type === "reqChange" ? "request a password change"  :
            "view the audit trail"
          }
          onSuccess={handleReAuthSuccess}
          onClose={() => { setShowReAuth(false); setPendingAction(null); }}
        />
      )}
    </>
  );
}