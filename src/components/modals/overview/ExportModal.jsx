import { useState } from "react";
import styles from "../Modal.module.css";

const exportOptions = ["Select All", "Today's Checkin", "Today's Walkins", "Active Memberships"];

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

export default function ExportModal({ members = [], onClose }) {
  const [exportFormat, setExportFormat] = useState("CSV");
  const [exportTypes, setExportTypes] = useState([]);
  const [exportSearch, setExportSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Helper function to check if a date is today
  const isToday = (date) => {
    if (!date) return false;
    const checkDate = new Date(date);
    const today = new Date();
    return (
      checkDate.getDate() === today.getDate() &&
      checkDate.getMonth() === today.getMonth() &&
      checkDate.getFullYear() === today.getFullYear()
    );
  };

  // Filter members for today's checkins
  const todaysCheckins = members.filter((m) => isToday(m.last_visit));

  // Filter members for today's walkins
  const todaysWalkins = members.filter((m) => isToday(m.last_visit));

  // Get all active memberships
  const activeMemberships = members;

  const toggleExportType = (opt) => {
    if (opt === "Select All") {
      setExportTypes(exportTypes.length === exportOptions.length ? [] : [...exportOptions]);
    } else {
      setExportTypes((prev) =>
        prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
      );
    }
  };

  const filteredExportOptions = exportOptions.filter((o) =>
    o.toLowerCase().includes(exportSearch.toLowerCase())
  );

  const handleExport = async () => {
    try {
      setLoading(true);

      if (exportTypes.length === 0) {
        alert("Please select at least one data type to export.");
        setLoading(false);
        return;
      }

      // Prepare export data based on selection
      const exportData = [];
      const exportTitle = [];

      if (exportTypes.includes("Today's Checkin")) {
        const checkinData = todaysCheckins.map((m) => ({
          "Member ID": m.member_id || "",
          "Name": m.full_name || "",
          "Email": m.email || "",
          "Phone": m.phone || "",
          "Address": m.address || "",
          "Membership Type": m.membership_type || "",
          "Join Date": m.join_date || "",
          "Monthly Validity": m.monthly_validity || "",
          "Membership Validity": m.membership_validity || "",
        }));
        exportData.push(...checkinData);
        exportTitle.push("Today's Checkin");
      }

      if (exportTypes.includes("Today's Walkins")) {
        const walkinData = todaysWalkins.map((m) => ({
          "Member ID": m.member_id || "",
          "Name": m.full_name || "",
          "Email": m.email || "",
          "Phone": m.phone || "",
          "Address": m.address || "",
          "Membership Type": m.membership_type || "",
          "Join Date": m.join_date || "",
          "Monthly Validity": m.monthly_validity || "",
          "Membership Validity": m.membership_validity || "",
        }));
        exportData.push(...walkinData);
        exportTitle.push("Today's Walkins");
      }

      if (exportTypes.includes("Active Memberships")) {
        const membershipData = activeMemberships.map((m) => ({
          "Member ID": m.member_id || "",
          "Name": m.full_name || "",
          "Email": m.email || "",
          "Phone": m.phone || "",
          "Address": m.address || "",
          "Membership Type": m.membership_type || "",
          "Join Date": m.join_date || "",
          "Monthly Validity": m.monthly_validity || "",
          "Membership Validity": m.membership_validity || "",
        }));
        exportData.push(...membershipData);
        exportTitle.push("Active Memberships");
      }

      if (exportData.length === 0) {
        alert("No data available for the selected export types.");
        setLoading(false);
        return;
      }

      const fileName = `overview_export_${exportTitle.join("_")}_${new Date().getTime()}`;

      if (exportFormat === "CSV") {
        const csv = toCsv(exportData);
        triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), fileName + ".csv");
      } else if (exportFormat === "Excel") {
        const excelLib = await import("exceljs");
        const Workbook = excelLib.Workbook || excelLib.default?.Workbook;
        if (!Workbook) {
          throw new Error("Excel export library failed to load.");
        }

        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet("Overview");

        worksheet.columns = [
          { header: "Member ID", key: "Member ID", width: 15 },
          { header: "Name", key: "Name", width: 25 },
          { header: "Email", key: "Email", width: 25 },
          { header: "Phone", key: "Phone", width: 15 },
          { header: "Address", key: "Address", width: 30 },
          { header: "Membership Type", key: "Membership Type", width: 18 },
          { header: "Join Date", key: "Join Date", width: 15 },
          { header: "Monthly Validity", key: "Monthly Validity", width: 18 },
          { header: "Membership Validity", key: "Membership Validity", width: 20 },
        ];

        worksheet.addRows(exportData);
        const buffer = await workbook.xlsx.writeBuffer();
        triggerDownload(
          new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }),
          fileName + ".xlsx"
        );
      } else if (exportFormat === "PDF") {
        const doc = await toPdf(exportData, `Overview Export - ${exportTitle.join(", ")}`);
        doc.save(fileName + ".pdf");
      }

      alert(`Successfully exported ${exportData.length} record(s)!`);
      onClose();
    } catch (err) {
      console.error("Error exporting overview:", err);
      alert("Failed to export overview data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.exportModal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Export Data</h2>

        <p className={styles.exportSectionLabel}>File Format</p>
        {["CSV", "Excel", "PDF"].map((fmt) => (
          <label key={fmt} className={styles.exportRadioRow}>
            <input
              type="radio"
              name="format"
              value={fmt}
              checked={exportFormat === fmt}
              onChange={() => setExportFormat(fmt)}
              style={{ accentColor: "#7eba56" }}
              disabled={loading}
            />
            {fmt}
          </label>
        ))}

        <p className={styles.exportSectionLabel}>Select Type of Data to Export</p>
        <div className={styles.exportSearch}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search"
            value={exportSearch}
            onChange={(e) => setExportSearch(e.target.value)}
            className={styles.exportSearchInput}
            disabled={loading}
          />
          {exportSearch && (
            <button className={styles.exportSearchClear} onClick={() => setExportSearch("")} disabled={loading}>✕</button>
          )}
        </div>

        <div className={styles.exportCheckList}>
          {filteredExportOptions.map((opt) => (
            <label key={opt} className={styles.exportCheckRow}>
              <input
                type="checkbox"
                checked={opt === "Select All"
                  ? exportTypes.length === exportOptions.length
                  : exportTypes.includes(opt)}
                onChange={() => toggleExportType(opt)}
                style={{ accentColor: "#7eba56" }}
                disabled={loading}
              />
              {opt}
            </label>
          ))}
        </div>

        <button className={styles.exportSubmitBtn} onClick={handleExport} disabled={loading}>
          {loading ? "Exporting..." : "Export"}
        </button>
        <button className={styles.exportCloseBtn} onClick={onClose} disabled={loading}>Close</button>
      </div>
    </div>
  );
}
