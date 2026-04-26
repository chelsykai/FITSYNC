import { useState } from "react";
import styles from "../Modal.module.css";

const exportMemberOptions = (members) => ["Select All", ...members.map((m) => m.full_name)];

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

const toCsv = (rows) => {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(","));

  return [headers.join(","), ...lines].join("\n");
};

const toPdf = async (rows, title) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  
  if (rows.length === 0) {
    doc.text("No data to export", 10, 10);
    return doc;
  }

  const headers = Object.keys(rows[0]);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const tableStartY = 20;
  const tableWidth = pageWidth - 2 * margin;
  const cellPaddingX = 1.8;
  const cellPaddingY = 1.6;
  const lineHeight = 3.6;

  const widthWeights = {
    "Member ID": 1.2,
    "Name": 1.5,
    "Email": 2.1,
    "Phone": 1.2,
    "Address": 2.4,
    "Birthday": 1.2,
    "Membership Type": 1.5,
    "Join Date": 1.2,
    "Monthly Validity": 1.4,
    "Membership Validity": 1.6,
    "Last Visit": 1.2,
  };

  const totalWeight = headers.reduce((sum, header) => sum + (widthWeights[header] || 1.3), 0);
  const columnWidths = headers.map((header) =>
    (tableWidth * (widthWeights[header] || 1.3)) / totalWeight
  );
  
  // Add title
  doc.setFontSize(13);
  doc.text(title, margin, 10);

  const drawHeader = (startY) => {
    doc.setFont(undefined, "bold");
    doc.setFontSize(8);

    const headerLines = headers.map((header, colIdx) =>
      doc.splitTextToSize(header, columnWidths[colIdx] - 2 * cellPaddingX)
    );
    const maxHeaderLines = Math.max(...headerLines.map((lines) => lines.length));
    const headerHeight = maxHeaderLines * lineHeight + 2 * cellPaddingY;

    let x = margin;
    headers.forEach((_, colIdx) => {
      doc.setDrawColor(170, 170, 170);
      doc.setFillColor(238, 247, 233);
      doc.rect(x, startY, columnWidths[colIdx], headerHeight, "FD");
      doc.text(headerLines[colIdx], x + cellPaddingX, startY + cellPaddingY + lineHeight - 0.2);
      x += columnWidths[colIdx];
    });

    return startY + headerHeight;
  };

  let currentY = drawHeader(tableStartY);

  doc.setFont(undefined, "normal");
  doc.setFontSize(7.5);

  rows.forEach((row) => {
    const wrappedCells = headers.map((header, colIdx) => {
      const value = String(row[header] ?? "").trim();
      const safeValue = value || "-";
      return doc.splitTextToSize(safeValue, columnWidths[colIdx] - 2 * cellPaddingX);
    });

    const maxLines = Math.max(...wrappedCells.map((lines) => lines.length));
    const rowHeight = maxLines * lineHeight + 2 * cellPaddingY;

    if (currentY + rowHeight > pageHeight - margin) {
      doc.addPage();
      currentY = drawHeader(margin);
      doc.setFont(undefined, "normal");
      doc.setFontSize(7.5);
    }

    let x = margin;
    wrappedCells.forEach((cellLines, colIdx) => {
      doc.setDrawColor(210, 210, 210);
      doc.rect(x, currentY, columnWidths[colIdx], rowHeight);
      doc.text(cellLines, x + cellPaddingX, currentY + cellPaddingY + lineHeight - 0.2);
      x += columnWidths[colIdx];
    });

    currentY += rowHeight;
  });
  
  return doc;
};

export default function MembersExportModal({ members, onClose }) {
  const [exportFormat, setExportFormat] = useState("CSV");
  const [exportSearch, setExportSearch] = useState("");
  const [exportSelected, setExportSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const allOptions = exportMemberOptions(members);

  const filteredExport = allOptions.filter((o) =>
    o.toLowerCase().includes(exportSearch.toLowerCase())
  );

  const toggleExport = (name) => {
    if (name === "Select All") {
      setExportSelected(exportSelected.length === members.length ? [] : members.map((m) => m.full_name));
    } else {
      setExportSelected((prev) =>
        prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
      );
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      // Filter members based on selection
      const selectedMembers = members.filter((m) => exportSelected.includes(m.full_name));

      if (selectedMembers.length === 0) {
        alert("Please select at least one member to export.");
        setLoading(false);
        return;
      }

      // Transform member data for export
      const exportData = selectedMembers.map((m) => ({
        "Member ID": m.member_id,
        "Name": m.full_name,
        "Email": m.email || "",
        "Phone": m.phone || "",
        "Address": m.address || "",
        "Birthday": m.birthday ? new Date(m.birthday).toLocaleDateString() : "",
        "Membership Type": m.membership_type || "",
        "Join Date": m.join_date ? new Date(m.join_date).toLocaleDateString() : "",
        "Monthly Validity": m.monthly_validity || "",
        "Membership Validity": m.membership_validity || "",
        "Last Visit": m.last_visit || "",
      }));

      // Export file
      const fileName = `members_export_${new Date().getTime()}`;

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
        const worksheet = workbook.addWorksheet("Members");

        worksheet.columns = [
          { header: "Member ID", key: "Member ID", width: 12 },
          { header: "Name", key: "Name", width: 20 },
          { header: "Email", key: "Email", width: 25 },
          { header: "Phone", key: "Phone", width: 12 },
          { header: "Address", key: "Address", width: 30 },
          { header: "Birthday", key: "Birthday", width: 12 },
          { header: "Membership Type", key: "Membership Type", width: 15 },
          { header: "Join Date", key: "Join Date", width: 12 },
          { header: "Monthly Validity", key: "Monthly Validity", width: 15 },
          { header: "Membership Validity", key: "Membership Validity", width: 18 },
          { header: "Last Visit", key: "Last Visit", width: 12 },
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
        const doc = await toPdf(exportData, "Members Export");
        doc.save(fileName + ".pdf");
      }

      alert(`Successfully exported ${selectedMembers.length} member(s)!`);
      onClose();
    } catch (err) {
      console.error("Error exporting members:", err);
      alert("Failed to export members. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Export Members Data</h2>

        <p className={styles.sectionLabel}>File Format</p>
        {["CSV", "Excel", "PDF"].map((fmt) => (
          <label key={fmt} className={styles.radioRow}>
            <input
              type="radio"
              name="fmt"
              value={fmt}
              checked={exportFormat === fmt}
              onChange={() => setExportFormat(fmt)}
              style={{ accentColor: "#7eba56" }}
              disabled={loading}
            />
            {fmt}
          </label>
        ))}

        <p className={styles.sectionLabel}>Select Members to Export</p>
        <div className={styles.modalSearch}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search"
            className={styles.modalSearchInput}
            value={exportSearch}
            onChange={(e) => setExportSearch(e.target.value)}
            disabled={loading}
          />
          {exportSearch && (
            <button className={styles.clearBtn} onClick={() => setExportSearch("")} disabled={loading}>✕</button>
          )}
        </div>
        <div className={styles.checkList}>
          {filteredExport.map((name) => (
            <label key={name} className={styles.checkRow}>
              <input
                type="checkbox"
                checked={name === "Select All"
                  ? exportSelected.length === members.length
                  : exportSelected.includes(name)}
                onChange={() => toggleExport(name)}
                style={{ accentColor: "#7eba56" }}
                disabled={loading}
              />
              {name !== "Select All" && <span className={styles.memberIcon}>👤</span>}
              {name}
            </label>
          ))}
        </div>

        <button className={styles.submitBtn} onClick={handleExport} disabled={loading}>
          {loading ? "Exporting..." : "Export"}
        </button>
        <button className={styles.closeBtn} onClick={onClose} disabled={loading}>Close</button>
      </div>
    </div>
  );
}
