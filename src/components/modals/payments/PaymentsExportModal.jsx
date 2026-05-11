import { useState } from "react";
import styles from "../Modal.module.css";
import ReAuthModal from "../../ReAuthModal";

const dataTypes = ["Select All", "Monthly", "Yearly", "Quarterly"];

const toCsv = (rows) => {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(","));

  return [headers.join(","), ...lines].join("\n");
};

const triggerDownload = (blob, fileName) => {
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(downloadUrl);
};

const toPdf = async (rows, title) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  
  if (rows.length === 0) {
    doc.text("No data to export", 10, 10);
    return doc;
  }

  const headers = Object.keys(rows[0]);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const tableStartY = 20;
  
  // Add title
  doc.setFontSize(14);
  doc.text(title, margin, 10);
  
  // Calculate column widths
  const tableWidth = pageWidth - 2 * margin;
  const columnWidth = tableWidth / headers.length;
  
  // Add headers
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  let currentY = tableStartY;
  
  headers.forEach((header, idx) => {
    doc.text(header, margin + idx * columnWidth + 2, currentY);
  });
  
  // Add separator line
  currentY += 7;
  doc.setDrawColor(0);
  doc.line(margin, currentY - 2, pageWidth - margin, currentY - 2);
  
  // Add data rows
  doc.setFont(undefined, "normal");
  doc.setFontSize(9);
  
  rows.forEach((row, rowIdx) => {
    if (currentY > pageHeight - 15) {
      doc.addPage();
      currentY = margin;
    }
    
    headers.forEach((header, colIdx) => {
      const value = String(row[header] ?? "");
      const wrappedText = doc.splitTextToSize(value, columnWidth - 4);
      doc.text(wrappedText, margin + colIdx * columnWidth + 2, currentY);
    });
    
    currentY += 7;
  });
  
  return doc;
};

export default function PaymentsExportModal({ payments = [], members = [], onClose }) {
  const [format, setFormat] = useState("CSV");
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReAuth, setShowReAuth] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const todayDate = new Date().toISOString().split('T')[0];
  
  // Calculate active memberships count from members data
  const activeMembershipsCount = members.length;

  const toggle = (opt) => {
    if (opt === "Select All") {
      setSelected(selected.length === dataTypes.length - 1 ? [] : dataTypes.slice(1));
    } else {
      setSelected((prev) =>
        prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
      );
    }
  };

  const filtered = dataTypes.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = async () => {
    try {
      setLoading(true);

      if (selected.length === 0) {
        alert("Please select at least one payment type to export.");
        setLoading(false);
        return;
      }

      // Filter payments based on selection (if needed based on type)
      const exportData = payments.map((p) => ({
        "Member ID": p.id,
        "Name": p.name,
        "Date": p.date,
        "Type": p.type,
        "Total": p.total,
        "Mode": p.mod,
        "Promo Code": p.promoCode || "",
        "Status": p.status,
      }));

      const fileName = `payments_export_${new Date().getTime()}`;

      if (format === "CSV") {
        const csv = toCsv(exportData);
        triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), fileName + ".csv");
      } else if (format === "Excel") {
        const excelLib = await import("exceljs");
        const Workbook = excelLib.Workbook || excelLib.default?.Workbook;
        if (!Workbook) {
          throw new Error("Excel export library failed to load.");
        }

        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet("Payments");

        worksheet.columns = [
          { header: "Member ID", key: "Member ID", width: 12 },
          { header: "Name", key: "Name", width: 20 },
          { header: "Date", key: "Date", width: 15 },
          { header: "Type", key: "Type", width: 15 },
          { header: "Total", key: "Total", width: 12 },
          { header: "Mode", key: "Mode", width: 12 },
          { header: "Promo Code", key: "Promo Code", width: 12 },
          { header: "Status", key: "Status", width: 12 },
        ];

        worksheet.addRows(exportData);
        const buffer = await workbook.xlsx.writeBuffer();
        triggerDownload(
          new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }),
          fileName + ".xlsx"
        );
      } else if (format === "PDF") {
        const doc = await toPdf(exportData, "Payment Records Export");
        doc.save(fileName + ".pdf");
      }

      alert(`Successfully exported ${payments.length} payment record(s)!`);
      onClose();
    } catch (err) {
      console.error("Error exporting payments:", err);
      alert("Failed to export payments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Export Data</h2>

        <p className={styles.sectionLabel}>File Format</p>
        {["CSV"].map((fmt) => (
          <label key={fmt} className={styles.radioRow}>
            <input
              type="radio"
              name="paymentFormat"
              value={fmt}
              checked={format === fmt}
              onChange={() => setFormat(fmt)}
              style={{ accentColor: "#7eba56" }}
              disabled={loading}
            />
            {fmt}
          </label>
        ))}

        {/* Date Range */}
        <p className={styles.sectionLabel}>Date Range</p>
        <div className={styles.dateRow}>
          <div className={styles.dateGroup}>
            <label className={styles.dateLabel}>From</label>
            <input
              type="date"
              className={styles.dateInput}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={todayDate}
            />
          </div>
          <span className={styles.dateSep}>—</span>
          <div className={styles.dateGroup}>
            <label className={styles.dateLabel}>To</label>
            <input
              type="date"
              className={styles.dateInput}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              max={todayDate}
            />
          </div>
        </div>

        <p className={styles.sectionLabel}>Select Type of Data to Export</p>
        <div className={styles.modalSearch}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search"
            className={styles.modalSearchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch("")} disabled={loading}>✕</button>
          )}
        </div>

        <div className={styles.checkList}>
          {filtered.map((opt) => (
            <label key={opt} className={styles.checkRow}>
              <input
                type="checkbox"
                checked={opt === "Select All"
                  ? selected.length === dataTypes.length - 1
                  : selected.includes(opt)}
                onChange={() => toggle(opt)}
                style={{ accentColor: "#7eba56" }}
                disabled={loading}
              />
              {opt}
            </label>
          ))}
        </div>

        <button className={styles.submitBtn} onClick={() => setShowReAuth(true)} disabled={loading}>
          {loading ? "Exporting..." : "Export"}
        </button>
        <button className={styles.closeBtn} onClick={onClose} disabled={loading}>Close</button>
      </div>

      {showReAuth && (
        <ReAuthModal
          actionLabel="export payment records"
          onSuccess={() => { setShowReAuth(false); handleExport(); }}
          onClose={() => setShowReAuth(false)}
        />
      )}
    </div>
  );
}
