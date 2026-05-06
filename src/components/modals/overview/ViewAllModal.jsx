import styles from "../Modal.module.css";

export default function ViewAllModal({ members, onClose }) {
  const formatValidity = (value, unit) => {
    const raw = String(value || "").trim();
    if (!raw) return "N/A";
    if (/[a-z]/i.test(raw)) return raw;
    return `${raw} ${unit}${raw === "1" ? "" : "s"}`;
  };

  const getMembershipPlanParts = (membershipValidity, monthlyValidity) => {
    const yearlyRaw = String(membershipValidity || "").trim();
    const monthlyRaw = String(monthlyValidity || "").trim();

    if (yearlyRaw) return { term: formatValidity(yearlyRaw, "Year"), frequency: "" };
    if (monthlyRaw) return { term: formatValidity(monthlyRaw, "Month"), frequency: "Monthly Pay" };
    return { term: "N/A", frequency: "" };
  };

  const getMembershipExpiryDate = (member) => {
    if (!member?.join_date) return null;
    const joinDate = new Date(member.join_date);
    if (Number.isNaN(joinDate.getTime())) return null;

    const yearlyRaw = String(member.membership_validity || "").trim();
    if (yearlyRaw) {
      const yearlyMatch = yearlyRaw.match(/(\d+)/);
      if (!yearlyMatch) return null;
      const years = Number.parseInt(yearlyMatch[1], 10);
      if (!Number.isInteger(years) || years <= 0) return null;
      const expiryDate = new Date(joinDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + years);
      return expiryDate;
    }

    const monthlyRaw = String(member.monthly_validity || "").trim();
    if (monthlyRaw) {
      const monthlyMatch = monthlyRaw.match(/(\d+)/);
      if (!monthlyMatch) return null;
      const months = Number.parseInt(monthlyMatch[1], 10);
      if (!Number.isInteger(months) || months <= 0) return null;
      const expiryDate = new Date(joinDate);
      expiryDate.setMonth(expiryDate.getMonth() + months);
      return expiryDate;
    }

    return null;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.wideModal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Memberships Expiring Soon</h2>
        <table className={styles.modalTable}>
          <thead>
            <tr>
              <th>Member ID</th>
              <th>Name</th>
              <th>Join Date</th>
              <th>Membership Type</th>
              <th className={styles.membershipPlanCol}>Membership Plan</th>
              <th>Expiration Date</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const membershipPlan = getMembershipPlanParts(m.membership_validity, m.monthly_validity);
              const expiryDate = getMembershipExpiryDate(m);
              return (
                <tr key={m.member_id}>
                  <td>{m.member_id}</td>
                  <td>{m.full_name}</td>
                  <td>{m.join_date ? new Date(m.join_date).toLocaleDateString() : "N/A"}</td>
                  <td>{m.membership_type}</td>
                  <td className={styles.membershipPlanCol}>
                    <span className={styles.membershipPlanTerm}>{membershipPlan.term}</span>
                    {membershipPlan.frequency ? (
                      <span className={styles.membershipPlanFrequency}> ({membershipPlan.frequency})</span>
                    ) : null}
                  </td>
                  <td>{expiryDate ? expiryDate.toLocaleDateString() : "N/A"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className={styles.viewAllWrapper}>
          <button className={styles.viewAllBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
