import { useState } from "react";
import styles from "../Modal.module.css";
import PaymentReceiptModal from "./PaymentReceiptModal";

export default function ViewAllPaymentsModal({ payments, onClose, onAddPayment }) {
  const [receipt, setReceipt] = useState(null);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  const filtered = payments.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.memberId.toString().includes(search) ||
    p.type.toLowerCase().includes(search.toLowerCase()) ||
    p.status.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportToSheets = async () => {
    try {
      setExporting(true);

      const excelLib = await import("exceljs");
      const Workbook = excelLib.Workbook || excelLib.default?.Workbook;

      if (!Workbook) {
        throw new Error("Excel library failed to load");
      }

      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet("Payment Records");

      // Set column headers
      worksheet.columns = [
        { header: "Member ID", key: "id", width: 15 },
        { header: "Name", key: "name", width: 25 },
        { header: "Payment Date", key: "date", width: 15 },
        { header: "Membership Type", key: "type", width: 18 },
        { header: "Total", key: "total", width: 12 },
        { header: "MOD", key: "mod", width: 12 },
        { header: "Promo Code", key: "promoCode", width: 15 },
        { header: "Status", key: "status", width: 12 },
      ];

      // Add all payment records (not just filtered)
      payments.forEach((payment) => {
        worksheet.addRow({
          id: payment.memberId,
          name: payment.name,
          date: payment.date,
          type: payment.type,
          total: payment.total,
          mod: payment.mod || "CASH",
          promoCode: payment.promoCode || "—",
          status: payment.status,
        });
      });

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF7EBA56" },
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `payment_records_${new Date().getTime()}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);

      alert(`Successfully exported ${payments.length} payment record(s)!`);
    } catch (err) {
      console.error("Error exporting to sheets:", err);
      alert("Failed to export payment records. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.viewAllPaymentsModal} onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className={styles.paymentModalHeader}>
            <h2 className={styles.paymentModalTitle}>Payment Records Table</h2>
            <button className={styles.modalCloseX} onClick={onClose}>✕</button>
          </div>

          {/* Search */}
          <div className={styles.paymentModalSearch}>
            <span>☰</span>
            <input
              type="text"
              placeholder="Search...."
              className={styles.modalSearchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span>🔍</span>
          </div>

          {/* Table */}
          <table className={styles.modalTable}>
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Name</th>
                <th>Payment Date</th>
                <th>Membership Type</th>
                <th>Total</th>
                <th>MOD</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, index) => (
                <tr key={`${p.memberId}-${p.date}-${index}`}>
                  <td>{p.memberId}</td>
                  <td>
                    <span className={styles.paymentNameLink} onClick={() => setReceipt(p)}>
                      {p.name}
                    </span>
                  </td>
                  <td>{p.date}</td>
                  <td>{p.type}</td>
                  <td>{p.total.toLocaleString()}</td>
                  <td>{p.mod || "CASH"}</td>
                  <td>
                    <span className={`${styles.badge} ${p.status === "Paid" ? styles.badgePaid : styles.badgePending}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className={styles.noResults}>No records found.</td></tr>
              )}
            </tbody>
          </table>

          {/* Footer */}
          <div className={styles.paymentModalFooter}>
            <div className={styles.paymentModalFooterLeft}>
              <button 
                className={styles.exportSheetsBtn} 
                onClick={handleExportToSheets}
                disabled={exporting}
              >
                {exporting ? "Exporting..." : "Export to Sheets"}
              </button>
            </div>
            <button className={styles.addRecordBtn} onClick={onAddPayment}>
              Add / Record Payment
            </button>
          </div>
        </div>
      </div>

      {/* Receipt modal stacked on top */}
      {receipt && (
        <PaymentReceiptModal
          payment={receipt}
          onClose={() => setReceipt(null)}
          onAddPayment={() => { setReceipt(null); onAddPayment(); }}
        />
      )}
    </>
  );
}
