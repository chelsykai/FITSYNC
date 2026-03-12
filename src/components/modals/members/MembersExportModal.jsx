import { useState } from "react";
import styles from "../Modal.module.css";

const exportMemberOptions = (members) => ["Select All", ...members.map((m) => m.name)];

export default function MembersExportModal({ members, onClose }) {
  const [exportFormat, setExportFormat] = useState("CSV");
  const [exportSearch, setExportSearch] = useState("");
  const [exportSelected, setExportSelected] = useState([]);

  const allOptions = exportMemberOptions(members);

  const filteredExport = allOptions.filter((o) =>
    o.toLowerCase().includes(exportSearch.toLowerCase())
  );

  const toggleExport = (name) => {
    if (name === "Select All") {
      setExportSelected(exportSelected.length === members.length ? [] : members.map((m) => m.name));
    } else {
      setExportSelected((prev) =>
        prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
      );
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
          />
          {exportSearch && (
            <button className={styles.clearBtn} onClick={() => setExportSearch("")}>✕</button>
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
              />
              {name !== "Select All" && <span className={styles.memberIcon}>👤</span>}
              {name}
            </label>
          ))}
        </div>

        <button className={styles.submitBtn}>Export</button>
        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
