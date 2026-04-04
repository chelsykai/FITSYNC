import { useState } from "react";
import styles from "../Modal.module.css";

const exportOptions = ["Select All", "Today's Checkin", "Today's Walkins", "Active Memberships"];

export default function ExportModal({ onClose }) {
  const [exportFormat, setExportFormat] = useState("CSV");
  const [exportTypes, setExportTypes] = useState([]);
  const [exportSearch, setExportSearch] = useState("");

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
          />
          {exportSearch && (
            <button className={styles.exportSearchClear} onClick={() => setExportSearch("")}>✕</button>
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
              />
              {opt}
            </label>
          ))}
        </div>

        <button className={styles.exportSubmitBtn}>Export</button>
        <button className={styles.exportCloseBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
