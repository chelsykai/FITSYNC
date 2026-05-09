import { useState, useEffect, useCallback } from "react";
import styles from "./AccountsPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";
import CreateAccountModal from "../../components/modals/accounts/CreateAccountModal";
import EditAccountModal from "../../components/modals/accounts/EditAccountModal";
import DeleteAccountModal from "../../components/modals/accounts/DeleteAccountModal";
import { supabase } from "../../lib/supabaseClient";
import { fetchAccounts, addAccount, updateAccount, deleteAccount } from "../../services/accountService";
import { fetchAuditLogs, getAuditUsers } from "../../services/auditService";

const ITEMS_PER_PAGE = 5;

export default function AccountsPage({ onNavigate, activePage = "accounts" }) {
  const [accounts, setAccounts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [auditLogs, setAuditLogs]     = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError]   = useState(null);
  const [admins, setAdmins]           = useState(["all admins"]);
  const [showAudit, setShowAudit]     = useState(false);
  const [filterAdmin, setFilterAdmin] = useState("all admins");
  const [page, setPage]               = useState(1);
  const [showCreate, setShowCreate]   = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
      // Reset filter to "all admins" when loading new data
      setFilterAdmin("all admins");
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

  const filteredLogs = filterAdmin === "all admins"
    ? auditLogs
    : auditLogs.filter((l) => l.user === filterAdmin);

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
    } catch (err) {
      setError("Failed to update account: " + err.message);
    }
  };

  const handleDelete = async (target) => {
    try {
      await deleteAccount(target.id);
      const deletedId = String(target.id);
      setAccounts((prev) => prev.filter((a) => String(a.id) !== deletedId));
      loadAccounts();
    } catch (err) {
      setError("Failed to delete account: " + err.message);
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
                <button className={styles.auditBtn} onClick={() => setShowAudit(true)}>
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
                  <button className={styles.addBtn} onClick={() => setShowCreate(true)}>
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
                              <button className={styles.editBtn} onClick={() => setEditTarget(a)}>Edit</button>
                              <button className={styles.deleteBtn} onClick={() => setDeleteTarget(a)}>Delete</button>
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
                  <span className={styles.filterLabel}>Filter by admin</span>
                  <select className={styles.filterSelect} value={filterAdmin}
                    onChange={(e) => setFilterAdmin(e.target.value)}>
                    {admins.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
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
                      <th>Action</th>
                      <th>Changes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, i) => (
                      <tr key={i}>
                        <td className={styles.timeCell}>{log.time}</td>
                        <td><strong>{log.user}</strong></td>
                        <td>{log.action}</td>
                        <td>
                          <div className={styles.changes}>
                            {Object.entries(log.changes).map(([k, v]) => (
                              <div key={k}>
                                <span className={styles.changeKey}>{k}:</span>{" "}
                                <span className={
                                  v === "record added" || v === "member added" || v === "notification sent"
                                    ? styles.statusSuccess
                                    : v === "failed to add record"
                                    ? styles.statusError
                                    : ""
                                }>{v}</span>
                              </div>
                            ))}
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
    </>
  );
}
