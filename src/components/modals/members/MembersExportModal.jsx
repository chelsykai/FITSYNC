import { useState } from "react";
import styles from "../Modal.module.css";
import * as XLSX from "xlsx";

const exportMemberOptions = (members) => ["Select All", ...members.map((m) => m.full_name)];

export default function MembersExportModal({ members, onClose }) {
  const [exportFormat, setExportFormat] = useState("Excel");
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

      // Create workbook
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Members");

      // Set column widths
      worksheet["!cols"] = [
        { wch: 12 }, // Member ID
        { wch: 20 }, // Name
        { wch: 25 }, // Email
        { wch: 12 }, // Phone
        { wch: 30 }, // Address
        { wch: 12 }, // Birthday
        { wch: 15 }, // Membership Type
        { wch: 12 }, // Join Date
        { wch: 15 }, // Monthly Validity
        { wch: 18 }, // Membership Validity
        { wch: 12 }, // Last Visit
      ];

      // Export file
      const fileName = `members_export_${new Date().getTime()}.${exportFormat === "CSV" ? "csv" : "xlsx"}`;
      
      if (exportFormat === "CSV") {
        XLSX.writeFile(workbook, fileName, { bookType: "csv" });
      } else {
        XLSX.writeFile(workbook, fileName, { bookType: "xlsx" });
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
        {["CSV", "Excel"].map((fmt) => (
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
