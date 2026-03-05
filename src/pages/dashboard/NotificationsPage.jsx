import { useState } from "react";
import styles from "./NotificationsPage.module.css";
import Sidebar from "../../components/Sidebar/Sidebar";

const notifications = [
  { id: "2024-****-GYM-0", type: "OVERDUE BALANCE",     name: "Firstname Mi. Lastname", detail: "AMOUNT: PHP ----",                color: "orange", action: "NOTIFY"   },
  { id: "2023-****-GYM-0", type: "MEMBERSHIP EXPIRING", name: "Firstname Mi. Lastname", detail: "EXPIRY: -- DAYS REMAINING",        color: "yellow", action: "NOTIFY"   },
  { id: "2023-****-GYM-0", type: "MEMBERSHIP EXPIRING", name: "Firstname Mi. Lastname", detail: "EXPIRY: -- DAYS REMAINING",        color: "yellow", action: "NOTIFY"   },
  { id: "2024-****-GYM-0", type: "ATTENDANCE / CHECK-IN", name: "Firstname Mi. Lastname", detail: "TIME IN: ** AM | LOCKER: #--",   color: "green",  action: "LOG INFO" },
  { id: "2024-****-GYM-0", type: "ATTENDANCE / CHECK-IN", name: "Firstname Mi. Lastname", detail: "TIME IN: ** AM | LOCKER: #--",   color: "green",  action: "LOG INFO" },
  { id: "2024-****-GYM-0", type: "OVERDUE BALANCE",     name: "Firstname Mi. Lastname", detail: "AMOUNT: PHP ----",                color: "orange", action: "NOTIFY"   },
  { id: "2024-****-GYM-0", type: "UPCOMING CLASS",      name: "Firstname Mi. Lastname", detail: "CLASS:",                         color: "blue",   action: "REMIND"   },
  { id: "2024-****-GYM-0", type: "ATTENDANCE / CHECK-IN", name: "Firstname Mi. Lastname", detail: "TIME IN: ** AM | LOCKER: #--", color: "green",  action: "LOG INFO" },
  { id: "2024-****-GYM-0", type: "OVERDUE BALANCE",     name: "Firstname Mi. Lastname", detail: "AMOUNT: PHP ----",               color: "orange", action: "NOTIFY"   },
  { id: "2024-****-GYM-0", type: "UPCOMING CLASS",      name: "Firstname Mi. Lastname", detail: "CLASS:",                        color: "blue",   action: "REMIND"   },
  { id: "2023-****-GYM-0", type: "MEMBERSHIP EXPIRING", name: "Firstname Mi. Lastname", detail: "EXPIRY: -- DAYS REMAINING",      color: "yellow", action: "NOTIFY"   },
  { id: "2023-****-GYM-0", type: "MEMBERSHIP EXPIRED",  name: "Firstname Mi. Lastname", detail: "EXPIRED",                       color: "red",    action: "NOTIFY"   },
];

const FILTERS = ["ALL", "EXPIRING", "EXPIRED", "OVERDUE", "UPCOMING", "ATTENDANCE"];

const filterMap = {
  ALL:        () => true,
  EXPIRING:   (n) => n.type === "MEMBERSHIP EXPIRING",
  EXPIRED:    (n) => n.type === "MEMBERSHIP EXPIRED",
  OVERDUE:    (n) => n.type === "OVERDUE BALANCE",
  UPCOMING:   (n) => n.type === "UPCOMING CLASS",
  ATTENDANCE: (n) => n.type === "ATTENDANCE / CHECK-IN",
};

const dotColor = {
  orange: "#f0a500",
  yellow: "#f5d000",
  green:  "#7eba56",
  blue:   "#4a90d9",
  red:    "#e05555",
};

const actionColor = {
  NOTIFY:   styles.notifyBtn,
  "LOG INFO": styles.logBtn,
  REMIND:   styles.remindBtn,
};

export default function NotificationsPage({ onNavigate, activePage = "notifications" }) {
  const [search, setSearch]           = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selected, setSelected]       = useState([]);
  const [selectMode, setSelectMode]   = useState(false);

  const filtered = notifications.filter((n) => {
    const matchSearch =
      n.type.toLowerCase().includes(search.toLowerCase()) ||
      n.id.toLowerCase().includes(search.toLowerCase()) ||
      n.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterMap[activeFilter](n);
    return matchSearch && matchFilter;
  });

  const toggleSelect = (i) => {
    setSelected((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  };

  return (
    <div className={styles.layout}>
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className={styles.content}>
        <h1 className={styles.title}>Gym Notifications</h1>

        {/* Search */}
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search"
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        {/* Filter Bar */}
        <div className={styles.filterBar}>
          <button className={styles.filterDropBtn}>FILTERS ▾</button>
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`${styles.filterBtn} ${activeFilter === f ? styles.filterActive : ""}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}{f === "ATTENDANCE" ? " ▾" : ""}
            </button>
          ))}
          <button
            className={`${styles.selectMultipleBtn} ${selectMode ? styles.selectModeActive : ""}`}
            onClick={() => { setSelectMode(!selectMode); setSelected([]); }}
          >
            SELECT MULTIPLE
          </button>
        </div>

        {/* Notification Grid */}
        <div className={styles.grid}>
          {filtered.map((n, i) => (
            <div
              key={i}
              className={`${styles.card} ${selectMode && selected.includes(i) ? styles.cardSelected : ""}`}
              onClick={() => selectMode && toggleSelect(i)}
            >
              {selectMode && (
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={selected.includes(i)}
                  onChange={() => toggleSelect(i)}
                />
              )}
              <div className={styles.cardTop}>
                <span className={styles.dot} style={{ backgroundColor: dotColor[n.color] }} />
                <span className={styles.cardType}>{n.type}</span>
                <button className={`${styles.actionBtn} ${styles[n.action.replace(" ", "").toLowerCase() + "Btn"]}`}>
                  {n.action}
                </button>
              </div>
              <p className={styles.cardId}>{n.id}</p>
              <div className={styles.cardBottom}>
                <div>
                  <p className={styles.cardLabel}>NAME</p>
                  <p className={styles.cardValue}>{n.name}</p>
                </div>
                <div>
                  <p className={styles.cardLabel}>DETAIL</p>
                  <p className={styles.cardValue}>{n.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bulk action bar */}
        {selectMode && selected.length > 0 && (
          <div className={styles.bulkBar}>
            <span>{selected.length} selected</span>
            <button className={styles.bulkNotify}>Notify All</button>
            <button className={styles.bulkCancel} onClick={() => { setSelected([]); setSelectMode(false); }}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}