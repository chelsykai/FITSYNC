import { useState } from "react";
import styles from "./AccountsPage.module.css";
import Sidebar from "../../components/Sidebar/Sidebar";

const initialAccounts = [
  { id: "1001", name: "Chelsy Kai Paralejas", role: "Admin", email: "chelsykaip@fitnesszone@gmail.com" },
  { id: "1002", name: "Coco Paralejas",        role: "Staff", email: "cocop@fitnesszone@gmail.com" },
  { id: "1003", name: "Zap Lopez",             role: "Staff", email: "zapl@fitnesszone@gmail.com" },
  { id: "1004", name: "Zoe Tugay",             role: "Staff", email: "zoet@fitnesszone@gmail.com" },
  { id: "1005", name: "Chambi Celebre",        role: "Staff", email: "chambic@fitnesszone@gmail.com" },
  { id: "1006", name: "Name",                  role: "Staff", email: "name@fitnesszone@gmail.com" },
  { id: "1007", name: "Name",                  role: "Staff", email: "name@fitnesszone@gmail.com" },
  { id: "1008", name: "Name",                  role: "Staff", email: "name@fitnesszone@gmail.com" },
];

const auditLogs = [
  { time: "12/12/2025, 16:01:21", user: "chelsykaip", action: "add_record_payment",        changes: { transaction: "Tw9f32gL0p", name: "**********", status: "record added" },     statusType: "success" },
  { time: "12/12/2025, 13:23:54", user: "chelsykaip", action: "add_record_payment",        changes: { transaction: "Q8mZ4L2xTa", name: "**********", status: "failed to add record" }, statusType: "error" },
  { time: "12/12/2025, 09:36:03", user: "chelsykaip", action: "add_record_payment",        changes: { transaction: "kP7F3wN0E9", name: "**********", status: "record added" },     statusType: "success" },
  { time: "12/11/2025, 22:14:34", user: "chelsykaip", action: "add_member",                changes: { member_id: "M9X2L4A7",  name: "**********", status: "member added" },       statusType: "success" },
  { time: "12/11/2025, 21:34:41", user: "chambic",    action: "add_record_payment",        changes: { transaction: "R2xM9aW5Lc", name: "**********", status: "record added" },    statusType: "success" },
  { time: "12/11/2025, 16:23:12", user: "chambic",    action: "notified_member_overdue",   changes: { member_id: "M9X2L4A7",  name: "**********", status: "notification sent" },  statusType: "info" },
];

const ITEMS_PER_PAGE = 5;

export default function AccountsPage({ onNavigate, activePage = "accounts" }) {
  const [showAudit, setShowAudit] = useState(false);
  const [filterAdmin, setFilterAdmin] = useState("all admins");
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(initialAccounts.length / ITEMS_PER_PAGE);
  const paginated = initialAccounts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const admins = ["all admins", ...new Set(auditLogs.map((l) => l.user))];
  const filteredLogs = filterAdmin === "all admins"
    ? auditLogs
    : auditLogs.filter((l) => l.user === filterAdmin);

  return (
    <div className={styles.layout}>
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className={styles.content}>

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
              <div className={styles.actionRow}>
                <button className={styles.addBtn}>＋ Add Account</button>
              </div>

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Email</th>
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
                        <button className={styles.editBtn}>Edit</button>
                        <button className={styles.deleteBtn}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >‹</button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={`${styles.pageBtn} ${page === i + 1 ? styles.activePage : ""}`}
                    onClick={() => setPage(i + 1)}
                  >{i + 1}</button>
                ))}
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >›</button>
                <span className={styles.pageInfo}>
                  {(page - 1) * ITEMS_PER_PAGE + 1} out of {initialAccounts.length} entries
                </span>
              </div>
            </div>
          </>
        )}

        {/* AUDIT TRAIL */}
        {showAudit && (
          <>
            <h1 className={styles.title}>Audit Trail</h1>
            <div className={styles.tableCard}>
              <p className={styles.auditDesc}>
                Track staff/admin actions with timestamps. Use the <em>filter</em> to view by user.
              </p>

              <div className={styles.filterRow}>
                <span className={styles.filterLabel}>Filter by admin</span>
                <select
                  className={styles.filterSelect}
                  value={filterAdmin}
                  onChange={(e) => setFilterAdmin(e.target.value)}
                >
                  {admins.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

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

              <div className={styles.closeRow}>
                <button className={styles.closeBtn} onClick={() => setShowAudit(false)}>Close</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}