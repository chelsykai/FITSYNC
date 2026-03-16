import { useState } from "react";
import styles from "../Modal.module.css";

const dataTypes = ["Select All", "Monthly", "Yearly", "Quarterly"];

export default function PaymentsExportModal({ onClose }) {
  const [format, setFormat] = useState("CSV");
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");

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

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Export Data</h2>

        <p className={styles.sectionLabel}>File Format</p>
        {["CSV", "Excel", "PDF"].map((fmt) => (
          <label key={fmt} className={styles.radioRow}>
            <input
              type="radio"
              name="paymentFormat"
              value={fmt}
              checked={format === fmt}
              onChange={() => setFormat(fmt)}
              style={{ accentColor: "#7eba56" }}
            />
            {fmt}
          </label>
        ))}

        <p className={styles.sectionLabel}>Select Type of Data to Export</p>
        <div className={styles.modalSearch}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search"
            className={styles.modalSearchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch("")}>✕</button>
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
              />
              {opt}
            </label>
          ))}
        </div>

        <button className={styles.submitBtn}>Export</button>
        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
