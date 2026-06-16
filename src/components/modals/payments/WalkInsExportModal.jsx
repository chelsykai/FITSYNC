import { useState } from "react";
import styles from "../Modal.module.css";
import ReAuthModal from "../../ReAuthModal";

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

export default function WalkInsExportModal({ walkIns = [], onClose, isAdmin = false }) {
  const [format, setFormat] = useState("CSV");
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReAuth, setShowReAuth] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const todayDate = new Date().toISOString().split('T')[0];

  const walkInOptions = ["Select All", ...walkIns.map((w, idx) => `${w.name} - ${w.date}`)];

  const toggle = (opt) => {
    if (opt === "Select All") {
      setSelected(selected.length === walkInOptions.length - 1 ? [] : walkInOptions.slice(1));
    } else {
      setSelected((prev) =>
        prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
      );
    }
  };

  const filtered = walkInOptions.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  // Reset to page 1 when search changes
  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      if (selected.length === 0) {
        alert("Please select at least one walk-in record to export.");
        setLoading(false);
        return;
      }

      let filteredWalkIns = walkIns.filter((w, idx) => 
        selected.includes(`${w.name} - ${w.date}`)
      );

      // Apply date range filter
      if (dateFrom || dateTo) {
        const from = dateFrom ? new Date(dateFrom + "T00:00:00") : null;
        const to   = dateTo   ? new Date(dateTo   + "T23:59:59") : null;
        filteredWalkIns = filteredWalkIns.filter((w) => {
          if (!w.rawDate) return false;
          const d = new Date(w.rawDate);
          if (from && d < from) return false;
          if (to   && d > to)   return false;
          return true;
        });
      }

      if (filteredWalkIns.length === 0) {
        alert("No walk-in records found for the selected filters.");
        setLoading(false);
        return;
      }

      const exportData = filteredWalkIns.map((w) => ({
        "Name": w.name,
        "Plan Type": w.planType,
        "Date": w.date,
        "Total": w.total,
      }));

      const fileName = `walkins_export_${new Date().getTime()}`;

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
        const worksheet = workbook.addWorksheet("Walk-ins");

        worksheet.columns = [
          { header: "Name", key: "Name", width: 20 },
          { header: "Plan Type", key: "Plan Type", width: 15 },
          { header: "Date", key: "Date", width: 15 },
          { header: "Total", key: "Total", width: 12 },
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
        const doc = await toPdf(exportData, "Walk-in Records Export");
        doc.save(fileName + ".pdf");
      }

      alert(`Successfully exported ${filteredWalkIns.length} walk-in record(s)!`);
      onClose();
    } catch (err) {
      console.error("Error exporting walk-ins:", err);
      alert("Failed to export walk-in records. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.paymentExportModal} ${styles.walkInExportModal}`} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Export Walk-in Records</h2>

        <p className={styles.sectionLabel}>File Format</p>
        {["CSV", "Excel", "PDF"].map((fmt) => (
          <label key={fmt} className={styles.radioRow}>
            <input
              type="radio"
              name="walkInFormat"
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>
        </div>

        {/* Walk-in Selection */}
        <p className={styles.sectionLabel}>Select Walk-in Records to Export</p>
        <div className={styles.modalSearch}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search"
            className={styles.modalSearchInput}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            disabled={loading}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => handleSearch("")} disabled={loading}>✕</button>
          )}
        </div>

        <div className={styles.checkList}>
          {paginatedItems.map((opt) => (
            <label key={opt} className={styles.checkRow}>
              <input
                type="checkbox"
                checked={opt === "Select All"
                  ? selected.length === walkInOptions.length - 1
                  : selected.includes(opt)}
                onChange={() => toggle(opt)}
                style={{ accentColor: "#7eba56" }}
                disabled={loading}
              />
              {opt}
            </label>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.paginationControls}>
            <button
              className={styles.pagBtn}
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || loading}
            >
              ← Prev
            </button>
            <span className={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className={styles.pagBtn}
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || loading}
            >
              Next →
            </button>
          </div>
        )}

        <button className={styles.submitBtn} onClick={() => {
          if (selected.length === 0) {
            alert("Please select at least one walk-in record to export.");
            return;
          }
          setShowReAuth(true);
        }} disabled={loading}>
          {loading ? "Exporting..." : "Export"}
        </button>
        <button className={styles.closeBtn} onClick={onClose} disabled={loading}>Close</button>
      </div>
      {showReAuth && (
        <ReAuthModal
          actionLabel="export walk-in records"
          onSuccess={() => { setShowReAuth(false); handleExport(); }}
          onClose={() => setShowReAuth(false)}
        />
      )}
    </div>
  );
}
