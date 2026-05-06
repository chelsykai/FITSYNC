import { useState, useEffect } from "react";
import styles from "../Modal.module.css";
import { supabase } from "../../../lib/supabaseClient";

export default function PaymentReceiptModal({ payment, onClose, onAddPayment }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const firstName = payment.name.split(" ")[0];

  // Fetch transactions for this member from database
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch all transactions for this member
        const { data, error: fetchError } = await supabase
          .from("record_payment")
          .select("*")
          .eq("member_id", payment.id)
          .order("date", { ascending: false });

        if (fetchError) {
          console.error("Error fetching transactions:", fetchError);
          setError("Failed to load transaction records");
          setTransactions([]);
        } else {
          // Transform data for display
          const transformedTransactions = (data || []).map((tx) => ({
            date: tx.date ? new Date(tx.date).toLocaleDateString("en-US") : "N/A",
            txId: tx.id || "N/A",
            desc: tx.description || "Monthly Fee",
            promo: tx.promo_code || "N/A",
            amount: tx.amount_paid || 0,
            mod: tx.payment_method || "Cash",
            status: tx.status || "Pending",
          }));
          setTransactions(transformedTransactions);
        }
      } catch (err) {
        console.error("Error in fetchTransactions:", err);
        setError("Unable to load transaction records");
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    if (payment?.id) {
      fetchTransactions();
    }
  }, [payment?.id]);

  const handleExportToSheets = async () => {
    try {
      setExporting(true);

      const excelLib = await import("exceljs");
      const Workbook = excelLib.Workbook || excelLib.default?.Workbook;

      if (!Workbook) {
        throw new Error("Excel library failed to load");
      }

      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet(`${firstName}'s Transactions`);

      // Set column headers
      worksheet.columns = [
        { header: "Date", key: "date", width: 15 },
        { header: "Transaction ID", key: "txId", width: 15 },
        { header: "Description", key: "desc", width: 20 },
        { header: "Promo Code", key: "promo", width: 15 },
        { header: "Amount", key: "amount", width: 12 },
        { header: "MOD", key: "mod", width: 12 },
        { header: "Status", key: "status", width: 12 },
      ];

      // Add all transaction records
      transactions.forEach((tx) => {
        worksheet.addRow({
          date: tx.date,
          txId: tx.txId,
          desc: tx.desc,
          promo: tx.promo,
          amount: tx.amount,
          mod: tx.mod,
          status: tx.status,
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
      anchor.download = `${firstName}_payment_records_${new Date().getTime()}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);

      alert(`Successfully exported ${transactions.length} transaction record(s)!`);
    } catch (err) {
      console.error("Error exporting to sheets:", err);
      alert("Failed to export transaction records. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.receiptModal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.paymentModalHeader}>
          <h2 className={styles.paymentModalTitle}>{firstName}'s Payment Records</h2>
          <button className={styles.modalCloseX} onClick={onClose}>✕</button>
        </div>

        {/* Member Info Card */}
        <div className={styles.receiptMemberCard}>
          <div className={styles.receiptAvatar}>👤</div>
          <div className={styles.receiptMemberInfo}>
            <div className={styles.receiptInfoCol}>
              <p className={styles.receiptInfoLabel}>Name:</p>
              <p className={styles.receiptInfoValue}>{payment.name}</p>
              <p className={styles.receiptInfoLabel}>Membership Type:</p>
              <p className={styles.receiptInfoValue}>{payment.type}</p>
            </div>
            <div className={styles.receiptInfoCol}>
              <p className={styles.receiptInfoLabel}>Client Type:</p>
              <p className={styles.receiptInfoValue}>Member</p>
              <p className={styles.receiptInfoLabel}>Pass Type:</p>
              <p className={styles.receiptInfoValue}>Walk-in</p>
            </div>
            <div className={styles.receiptInfoCol}>
              <p className={styles.receiptInfoLabel}>Due Date:</p>
              <p className={styles.receiptInfoValue}>01/05/2026</p>
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <table className={styles.modalTable}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Transaction ID</th>
              <th>Description</th>
              <th>Promo Code</th>
              <th>Amount</th>
              <th>MOD</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                  Loading transactions...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "20px", color: "#d32f2f" }}>
                  {error}
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "20px", color: "#999" }}>
                  No transaction records found for this member.
                </td>
              </tr>
            ) : (
              transactions.map((tx, i) => (
                <tr key={i}>
                  <td>{tx.date}</td>
                  <td>{tx.txId}</td>
                  <td>{tx.desc}</td>
                  <td>{tx.promo}</td>
                  <td>{tx.amount.toLocaleString()}</td>
                  <td>{tx.mod}</td>
                  <td>
                    <span className={`${styles.badge} ${tx.status === "Paid" ? styles.badgePaid : styles.badgeUnpaid}`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className={styles.paymentModalFooter}>
          <div className={styles.paymentModalFooterLeft}>
            <button 
              className={styles.exportSheetsBtn}
              onClick={handleExportToSheets}
              disabled={exporting || transactions.length === 0}
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
  );
}
