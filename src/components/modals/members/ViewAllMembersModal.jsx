import { useState } from "react";
import styles from "../Modal.module.css";
import EditMemberModal from "./EditMemberModal";
import DeleteMemberModal from "./DeleteMemberModal";

export default function ViewAllMembersModal({ members, onClose, onMemberDeleted }) {
  const [displayMembers, setDisplayMembers] = useState(members);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleMemberDeleted = (deletedMember) => {
    // Remove the deleted member from the display list
    setDisplayMembers(prev => prev.filter(m => m.member_id !== deletedMember.member_id));
    setDeleteTarget(null);
    // Call parent callback if provided
    onMemberDeleted?.(deletedMember);
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.wideModal} onClick={(e) => e.stopPropagation()}>
          <h2 className={styles.modalTitle}>Membership List</h2>
          <table className={styles.modalTable}>
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Name</th>
                <th>Join Date</th>
                <th>Membership Type</th>
                <th>Monthly Validity</th>
                <th>Membership Validity</th>
                <th>Last Visit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayMembers.map((m) => (
                <tr key={m.member_id}>
                  <td>{m.member_id}</td>
                  <td>{m.full_name}</td>
                  <td>{m.join_date ? new Date(m.join_date).toLocaleDateString() : "N/A"}</td>
                  <td>{m.membership_type}</td>
                  <td>{m.monthly_validity}</td>
                  <td>{m.membership_validity}</td>
                  <td>{m.last_visit || "N/A"}</td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button
                        className={styles.editBtn}
                        onClick={(e) => { e.stopPropagation(); setEditTarget(m); }}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(m); }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {displayMembers.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "20px", color: "#999" }}>No members found.</td></tr>
              )}
            </tbody>
          </table>
          <div className={styles.viewAllWrapper}>
            <button className={styles.viewAllBtn} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>

      {editTarget && (
        <EditMemberModal
          member={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(updated) => {
            console.log("saved", updated);
            setEditTarget(null);
          }}
        />
      )}

      {deleteTarget && (
        <DeleteMemberModal
          member={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleMemberDeleted}
        />
      )}
    </>
  );
}
