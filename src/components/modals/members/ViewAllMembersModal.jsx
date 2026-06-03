import { useState } from "react";
import styles from "../Modal.module.css";
import EditMemberModal from "./EditMemberModal";
import DeleteMemberModal from "./DeleteMemberModal";
import MemberProfileModal from "./MemberProfileModal";
import { formatMMDDYYYY } from "../../../utils/dateFormat";

export default function ViewAllMembersModal({ members, onClose, onMemberDeleted, isAdmin = false }) {
  const [removedMemberIds, setRemovedMemberIds] = useState([]);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [search, setSearch] = useState("");

  const handleMemberDeleted = (deletedMember) => {
    setRemovedMemberIds((prev) => [...prev, deletedMember.member_id]);
    setDeleteTarget(null);
    // Call parent callback if provided
    onMemberDeleted?.(deletedMember);
  };

  const displayMembers = (members || []).filter(
    (member) => !removedMemberIds.includes(member.member_id)
  );

  const filteredMembers = displayMembers.filter((member) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;

    return [
      member.member_id,
      member.full_name,
      member.join_date ? formatMMDDYYYY(member.join_date) : "",
      member.membership_type,
      member.membership_validity,
      member.monthly_validity,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.viewAllMembersModal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.paymentModalHeader}>
            <h2 className={styles.paymentModalTitle}>Membership List</h2>
            <button className={styles.modalCloseX} onClick={onClose}>✕</button>
          </div>

          <div className={styles.paymentModalSearch}>
            <span>☰</span>
            <input
              type="text"
              placeholder="Search...."
              className={styles.modalSearchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <table className={styles.modalTable}>
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Name</th>
                <th>Join Date</th>
                <th>Membership Type</th>
                <th className={styles.membershipPlanCol}>Membership Validity</th>
                <th>Monthly Expiry</th>
                {isAdmin && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((m) => {
                const formatValidity = (value, unit) => {
                  const raw = String(value || "").trim();
                  if (!raw) return "N/A";
                  if (/[a-z]/i.test(raw)) return raw;
                  return `${raw} ${unit}${raw === "1" ? "" : "s"}`;
                };

                const yearlyRaw = String(m.membership_validity || "").trim();
                const monthlyRaw = String(m.monthly_validity || "").trim();
                const membershipTerm = formatValidity(yearlyRaw, "Year");

                const getExpiry = () => {
                  if (!m?.join_date) return null;
                  const join = new Date(m.join_date);
                  if (Number.isNaN(join.getTime())) return null;

                  if (monthlyRaw) {
                    const match = monthlyRaw.match(/(\d+)/);
                    if (!match) return null;
                    const months = Number.parseInt(match[1], 10);
                    if (!Number.isInteger(months) || months <= 0) return null;
                    const expiry = new Date(join);
                    expiry.setMonth(expiry.getMonth() + months);
                    return expiry;
                  }

                  return null;
                };

                const expiryDate = getExpiry();

                return (
                  <tr
                    key={m.member_id}
                    onClick={() => setSelectedMember(m)}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
                  >
                    <td>
                      <span className={styles.viewAllMemberIdCell}>{m.member_id}</span>
                    </td>
                    <td>{m.full_name}</td>
                    <td>{m.join_date ? formatMMDDYYYY(m.join_date) : "N/A"}</td>
                    <td>{m.membership_type}</td>
                    <td className={styles.membershipPlanCol}>
                      <span className={styles.membershipPlanTerm}>{membershipTerm}</span>
                    </td>
                    <td>{expiryDate ? formatMMDDYYYY(expiryDate) : "N/A"}</td>
                    {isAdmin && (
                      <td onClick={(e) => e.stopPropagation()}>
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
                    )}
                  </tr>
                );
              })}
              {filteredMembers.length === 0 && (
                <tr><td colSpan={isAdmin ? 7 : 6} className={styles.noResults}>No members found.</td></tr>
              )}
            </tbody>
          </table>
          <div className={styles.paymentModalFooter}>
            <div />
            <button className={styles.addRecordBtn} onClick={onClose}>Close</button>
          </div>
        </div>
      </div>

      {editTarget && isAdmin && (
        <EditMemberModal
          member={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(updated) => {
            console.log("saved", updated);
            setEditTarget(null);
          }}
        />
      )}

      {deleteTarget && isAdmin && (
        <DeleteMemberModal
          member={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleMemberDeleted}
        />
      )}

      {selectedMember && (
        <MemberProfileModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
}
