import { useState } from "react";
import styles from "../Modal.module.css";
import { normalizeDateKey, normalizeDateRange } from "../../../utils/exportDateRange";
import { fetchAllAttendanceRecords, fetchAttendanceRecordsBetweenDates, fetchTodayAttendanceRecords } from "../../../services/attendanceService";

const exportOptions = ["Select All", "Today's Checkin", "Active Memberships"];

const toCsv = (rows) => {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(","));

  return [headers.join(","), ...lines].join("\n");
};

const formatCsvDate = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
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

export default function ExportModal({ members = [], attendanceRecords = [], onClose, isAdmin = false }) {
  const [exportFormat, setExportFormat] = useState("CSV");
  const [exportTypes, setExportTypes] = useState([]);
  const [exportSearch, setExportSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const todayDate = new Date().toISOString().split('T')[0];

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

  const filteredMemberships = activeMemberships;

  const buildExportRows = async (type) => {
    const { start, end } = normalizeDateRange(dateFrom, dateTo);
    const hasSelectedRange = Boolean(start || end);

    const buildDateSeries = (startDate, endDate) => {
      const days = [];
      const cursor = new Date(`${startDate}T00:00:00`);
      const last = new Date(`${endDate}T00:00:00`);

      while (!Number.isNaN(cursor.getTime()) && cursor <= last) {
        days.push(normalizeDateKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }

      return days.filter(Boolean);
    };

    const selectedDates = hasSelectedRange
      ? buildDateSeries(start || end, end || start)
      : [];

    if (type === "Today's Checkin") {
      const attendanceSource = !hasSelectedRange
        ? await fetchAllAttendanceRecords()
        : selectedDates.length === 1 && selectedDates[0] === todayDate && attendanceRecords.length > 0
          ? attendanceRecords
          : selectedDates.length === 1 && selectedDates[0] === todayDate
            ? await fetchTodayAttendanceRecords()
            : await fetchAttendanceRecordsBetweenDates(start || end, end || start);

      const attendanceLookup = new Map();
      attendanceSource.forEach((record) => {
        const key = `${String(record.member_id || "")}:${String(record.attendance_date || "")}`;
        attendanceLookup.set(key, 1);
      });

      const dateColumns = hasSelectedRange
        ? selectedDates
        : Array.from(
            new Set(
              attendanceSource
                .map((record) => normalizeDateKey(record.attendance_date))
                .filter(Boolean)
            )
          ).sort();

      const rows = members.map((member) => {
        const memberId = String(member.member_id || "");
        const row = {
          "Member ID": member.member_id || "",
          "Name": member.full_name || "",
        };

        dateColumns.forEach((date) => {
          row[formatCsvDate(date)] = attendanceLookup.has(`${memberId}:${date}`) ? 1 : 0;
        });

        return row;
      });

      return { title: "Today's Checkin", rows };
    }

    if (type === "Active Memberships") {
      const rows = filteredMemberships.map((member) => ({
        "Member ID": member.member_id || "",
        "Name": member.full_name || "",
        "Email": member.email || "",
        "Address": member.address || "",
        "Membership Type": member.membership_type || "",
        "Join Date": formatCsvDate(member.join_date),
        "Monthly Validity": member.monthly_validity || "",
        "Membership Validity": member.membership_validity || "",
      }));

      return { title: "Active Memberships", rows };
    }

    return { title: type, rows: [] };
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      if (exportTypes.length === 0) {
        alert("Please select at least one data type to export.");
        setLoading(false);
        return;
      }

      const selectedTypes = exportTypes.filter((type) => type !== "Select All");
      const exportSets = [];

      for (const type of selectedTypes) {
        const exportSet = await buildExportRows(type);
        if (exportSet.rows.length > 0) {
          exportSets.push(exportSet);
        }
      }

      if (exportSets.length === 0) {
        alert("No data available for the selected export types.");
        setLoading(false);
        return;
      }

      if (exportFormat === "CSV") {
        if (exportSets.length === 1) {
          const fileName = `overview_export_${exportSets[0].title.replace(/\s+/g, "_")}_${new Date().getTime()}`;
          const csv = toCsv(exportSets[0].rows);
          triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), fileName + ".csv");
        } else {
          exportSets.forEach((exportSet) => {
            const fileName = `overview_export_${exportSet.title.replace(/\s+/g, "_")}_${new Date().getTime()}`;
            const csv = toCsv(exportSet.rows);
            triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), fileName + ".csv");
          });
        }
      } else if (exportFormat === "Excel") {
        const excelLib = await import("exceljs");
        const Workbook = excelLib.Workbook || excelLib.default?.Workbook;
        if (!Workbook) {
          throw new Error("Excel export library failed to load.");
        }

        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet("Overview");

        const exportData = exportSets.flatMap((exportSet) => exportSet.rows);
        const fileName = `overview_export_${exportSets.map((item) => item.title).join("_")}_${new Date().getTime()}`;

        worksheet.columns = [
          { header: "Member ID", key: "Member ID", width: 15 },
          { header: "Name", key: "Name", width: 25 },
          { header: "Email", key: "Email", width: 25 },
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
        const exportData = exportSets.flatMap((exportSet) => exportSet.rows);
        const doc = await toPdf(exportData, `Overview Export - ${exportSets.map((item) => item.title).join(", ")}`);
        const fileName = `overview_export_${exportSets.map((item) => item.title).join("_")}_${new Date().getTime()}`;
        doc.save(fileName + ".pdf");
      }

      alert(
        exportFormat === "CSV" && exportSets.length > 1
          ? `Successfully exported ${exportSets.length} CSV file(s)!`
          : `Successfully exported ${exportSets.reduce((sum, item) => sum + item.rows.length, 0)} record(s)!`
      );
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
      <div className={`${styles.exportModal} ${styles.paymentExportModal}`} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Export Data</h2>

        <p className={styles.exportSectionLabel}>File Format</p>
        {["CSV"].map((fmt) => (
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
