import { useState, useEffect, useCallback } from "react";
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

export default function AccountsPage({ onNavigate, activePage = "accounts" }) {
  const [accounts, setAccounts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [auditLogs, setAuditLogs]     = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError]   = useState(null);
  const [admins, setAdmins]           = useState(["all users"]);
  const [showAudit, setShowAudit]     = useState(false);
  const [filterAdmin, setFilterAdmin] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage]               = useState(1);
  const [showCreate, setShowCreate]   = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [changePassTarget, setChangePassTarget] = useState(null);
  const [showReAuth,    setShowReAuth]    = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const loadAccounts = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      const data = await fetchAccounts();
      setAccounts(data);
    } catch (err) {
      setError(err.message || "Failed to load accounts");
      console.error("Error loading accounts:", err);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts(true);

    const accountsChannel = supabase
      .channel("accounts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "system_user" }, () => {
        loadAccounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(accountsChannel);
    };
  }, [loadAccounts]);

  // Fallback auto-refresh in case realtime delete events are not emitted by DB settings.
  useEffect(() => {
    const refreshInterval = window.setInterval(() => {
      loadAccounts();
    }, 5000);

    const handleFocus = () => {
      loadAccounts();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadAccounts]);

  const loadAuditData = useCallback(async () => {
    try {
      setAuditLoading(true);
      setAuditError(null);
      const [logs, users] = await Promise.all([
        fetchAuditLogs(),
        getAuditUsers()
      ]);
      setAuditLogs(logs);
      setAdmins(users);
      // Reset filter to empty when loading new data
      setFilterAdmin("");
    } catch (err) {
      setAuditError(err.message || "Failed to load audit logs");
      console.error("Error loading audit data:", err);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  // Fetch audit logs from Supabase when audit tab is opened
  useEffect(() => {
    if (!showAudit) return; // Only fetch when audit tab is shown

    loadAuditData();

    const auditChannel = supabase
      .channel("audit-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_trail" }, () => {
        loadAuditData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(auditChannel);
    };
  }, [showAudit, loadAuditData]);

  const totalPages = Math.ceil(accounts.length / ITEMS_PER_PAGE);
  const paginated  = accounts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const filteredLogs = (() => {
    const val = (filterAdmin || '').trim().toLowerCase();
    if (!val || val === 'all users' || val === 'all admins') return auditLogs;
    return auditLogs.filter((l) => (l.user || '').toLowerCase().includes(val));
  })();

  // Apply date range filter on top of admin filter
  const filteredLogsByDate = (() => {
    const s = startDate ? new Date(startDate + 'T00:00:00') : null;
    const e = endDate ? new Date(endDate + 'T23:59:59.999') : null;

    return filteredLogs.filter((l) => {
      const timeStr = l.timeISO || l.time || null;
      if (!timeStr) return true; // keep logs without parseable time
      const t = new Date(timeStr);
      if (Number.isNaN(t.getTime())) return true;
      if (s && t < s) return false;
      if (e && t > e) return false;
      return true;
    });
  })();

  const handleCreate = async (newAccount) => {
    try {
      const createdAccount = await addAccount(newAccount);
      setAccounts((prev) => [createdAccount, ...prev]);
    } catch (err) {
      setError("Failed to create account: " + err.message);
      throw err;
    }
  };

  const handleSave = async (updated) => {
    try {
      const updatedAccount = await updateAccount(updated.id, updated);
      const updatedId = String(updated.id);
      setAccounts((prev) => prev.map((a) => String(a.id) === updatedId ? updatedAccount : a));
      setEditTarget(null); // Close the modal
      loadAccounts(); // Refresh the table
    } catch (err) {
      setError("Failed to update account: " + err.message);
    }
  };

  const handleDelete = async (target) => {
    try {
      await deleteAccount(target.id, target);
      const deletedId = String(target.id);
      setAccounts((prev) => prev.filter((a) => String(a.id) !== deletedId));
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
        <Sidebar activePage={activePage} onNavigate={onNavigate} />
        <div className={`${styles.content} tab-slide-animation`}>

          {/* ACCOUNTS PAGE */}
          {!showAudit && (
            <>
              <div className={styles.pageHeader}>
                <h1 className={styles.title}>Accounts</h1>
                <button className={styles.auditBtn} onClick={() => requestAction("audit")}>
                  Audit Trail &nbsp;›
                </button>
              </div>

              <div className={styles.tableCard}>
                {error && (
                  <div style={{
                    padding: "15px",
                    marginBottom: "15px",
                    backgroundColor: "#fee",
                    border: "1px solid #fcc",
                    borderRadius: "4px",
                    color: "#c33",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    {error}
                    <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>✕</button>
                  </div>
                )}

                <div className={styles.actionRow}>
                  <button className={styles.addBtn} onClick={() => requestAction("create")}>
                    ＋ Add Account
                  </button>
                </div>

                {loading ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                    Loading accounts...
                  </div>
                ) : accounts.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
                    No accounts found. Click "Add Account" to create one.
                  </div>
                ) : (
                  <>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Staff ID</th>
                          <th>Name</th>
                          <th>Role</th>
                          <th>Username</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map((a) => (
                          <tr key={a.id}>
                            <td>{a.id}</td>
                            <td>{a.name}</td>
                            <td>{a.role}</td>
                            <td>{a.email}</td>
                            <td>
                              <button className={styles.editBtn} onClick={() => requestAction("edit", a)}>Edit</button>
                              <button className={styles.deleteBtn} onClick={() => requestAction("delete", a)}>Delete</button>
                              <button className={styles.changePassBtn} onClick={() => requestAction("reqChange", a)}>Req. Change</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    <div className={styles.pagination}>
                      <button className={styles.pageBtn}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}>‹</button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button key={i + 1}
                          className={`${styles.pageBtn} ${page === i + 1 ? styles.activePage : ""}`}
                          onClick={() => setPage(i + 1)}>{i + 1}</button>
                      ))}
                      <button className={styles.pageBtn}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}>›</button>
                      <span className={styles.pageInfo}>
                        {(page - 1) * ITEMS_PER_PAGE + 1} out of {accounts.length} entries
                      </span>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* AUDIT TRAIL */}
          {showAudit && (
            <>
              <h1 className={styles.title}>Audit Trail</h1>
              <div className={styles.tableCard}>
                {auditError && (
                  <div style={{
                    padding: "15px",
                    marginBottom: "15px",
                    backgroundColor: "#fee",
                    border: "1px solid #fcc",
                    borderRadius: "4px",
                    color: "#c33",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    {auditError}
                    <button onClick={() => setAuditError(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>✕</button>
                  </div>
                )}

                <p className={styles.auditDesc}>
                  Track staff/admin actions with timestamps. Use the <em>filter</em> to view by user.
                </p>

                <div className={styles.filterRow}>
                  <span className={styles.filterLabel}>Search user</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      className={styles.filterSelect}
                      placeholder="Type username..."
                      value={filterAdmin}
                      onChange={(e) => setFilterAdmin(e.target.value)}
                    />
                  </div>

                  <span className={styles.filterLabel} style={{ marginLeft: '16px' }}>Date range</span>
                  <input type="date" className={styles.filterDate} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  <span style={{ margin: '0 8px' }}>to</span>
                  <input type="date" className={styles.filterDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  <button className={styles.clearBtn} onClick={() => { setStartDate(''); setEndDate(''); }}>Clear Dates</button>
                </div>

                {auditLoading ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                    Loading audit logs...
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
                    No audit logs found.
                  </div>
                ) : (
                  <>
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
                        <td>{log.role || 'N/A'}</td>
                        <td>{log.action}</td>
                        <td>
                          <div className={styles.changes}>
                            {(() => {
                              const action = log.action || '';
                              const accountName = log.changes?.accountName || '';
                              const subjectName =
                                log.changes?.accountName ||
                                log.changes?.memberName ||
                                log.changes?.fullName ||
                                log.changes?.name ||
                                log.changes?.member ||
                                log.changes?.member_id ||
                                '';
                              const changes = log.changes || {};

                              if (action.includes('Deleted')) {
                                return (
                                  <span style={{ color: '#dc3545', fontWeight: '500' }}>
                                    deleted {subjectName || accountName}
                                  </span>
                                );
                              } else if (action.includes('Created')) {
                                return (
                                  <span style={{ color: '#28a745', fontWeight: '500' }}>
                                    created {subjectName || accountName}
                                  </span>
                                );
                              } else if (action.includes('Updated')) {
                                // Show field changes: name: old -> new
                                const changeEntries = Object.entries(changes).filter(
                                  ([k]) => k !== 'accountId' && k !== 'accountName'
                                );

                                if (changeEntries.length === 0) {
                                  return <span>No changes recorded</span>;
                                }

                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {subjectName && (
                                      <div>
                                        <span style={{ fontWeight: '500' }}>Updated:</span> {subjectName}
                                      </div>
                                    )}
                                    {changeEntries.map(([k, v]) => {
                                      if (typeof v === 'object' && v.old !== undefined && v.new !== undefined) {
                                        return (
                                          <div key={k}>
                                            <span style={{ fontWeight: '500' }}>{k}:</span> {v.old} → {v.new}
                                          </div>
                                        );
                                      }
                                      return null;
                                    })}
                                  </div>
                                );
                              }

                              // Recorded payment actions
                              if (action.toLowerCase().includes('record')) {
                                const memberId = changes.memberId || changes.member_id || changes.member || '';
                                const amount = changes.amount || changes.amount_paid || '';
                                return (
                                  <span style={{ color: '#007bff', fontWeight: '500' }}>
                                    recorded payment{memberId ? ` for ${memberId}` : ''}{amount ? ` — ₱${amount}` : ''}
                                  </span>
                                );
                              }

                              return <span>Unknown action</span>;
                            })()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                  </>
                )}

                <div className={styles.closeRow}>
                  <button className={styles.closeBtn} onClick={() => setShowAudit(false)}>Close</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateAccountModal
          accounts={accounts}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
      {editTarget && (
        <EditAccountModal
          account={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSave}
        />
      )}
      {deleteTarget && (
        <DeleteAccountModal
          account={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
      {showReAuth && (
        <ReAuthModal
          actionLabel={
            pendingAction?.type === "create"    ? "add a new account" :
            pendingAction?.type === "edit"      ? "edit this account" :
            pendingAction?.type === "delete"    ? "delete this account" :
            pendingAction?.type === "reqChange" ? "request a password change" :
            "view the audit trail"
          }
          onSuccess={handleReAuthSuccess}
          onClose={() => { setShowReAuth(false); setPendingAction(null); }}
        />
      )}
    </>
  );
}
