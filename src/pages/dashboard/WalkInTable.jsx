import styles from "./PaymentsPage.module.css";

export default function WalkInTable({ walkIns = [], search = "", loading = false }) {
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = walkIns.filter((record) =>
    record.name.toLowerCase().includes(normalizedSearch) ||
    record.date.toLowerCase().includes(normalizedSearch) ||
    record.planType.toLowerCase().includes(normalizedSearch) ||
    record.status.toLowerCase().includes(normalizedSearch) ||
    String(record.total).includes(normalizedSearch)
  );

  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Payment Date</th>
            <th>Plan Type</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} className={styles.noResults}>Loading walk-in records...</td>
            </tr>
          ) : walkIns.length === 0 ? (
            <tr>
              <td colSpan={5} className={styles.noResults}>
                No walk-in records yet. Click "Add Walk-in" to create one.
              </td>
            </tr>
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={5} className={styles.noResults}>No records match your search.</td>
            </tr>
          ) : (
            filtered.map((record) => (
              <tr key={record.id}>
                <td>{record.name}</td>
                <td>{record.date}</td>
                <td>{record.planType}</td>
                <td>{record.total.toLocaleString()}</td>
                <td>
                  <span className={`${styles.badge} ${styles.paid}`}>
                    {record.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
