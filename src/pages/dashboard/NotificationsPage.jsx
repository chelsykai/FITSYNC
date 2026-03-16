import { useState, useRef, useEffect } from "react";
import styles from "./NotificationsPage.module.css";
import Sidebar from "../../components/Sidebar/Sidebar";
import ViewLogModal from "../../components/modals/notifications/ViewLogModal";

const notifications = [
  { id: "2024-****-GYM-0", type: "OVERDUE BALANCE",       name: "Firstname Mi. Lastname", detail: "AMOUNT: PHP ----",              color: "orange", action: "NOTIFY"    },
  { id: "2023-****-GYM-0", type: "MEMBERSHIP EXPIRING",   name: "Firstname Mi. Lastname", detail: "EXPIRY: -- DAYS REMAINING",     color: "yellow", action: "NOTIFY"    },
  { id: "2023-****-GYM-0", type: "MEMBERSHIP EXPIRING",   name: "Firstname Mi. Lastname", detail: "EXPIRY: -- DAYS REMAINING",     color: "yellow", action: "NOTIFY"    },
  { id: "2024-****-GYM-0", type: "ATTENDANCE / CHECK-IN", name: "Firstname Mi. Lastname", detail: "TIME IN: ** AM | LOCKER: #--",  color: "green",  action: "VIEW LOG"  },
  { id: "2024-****-GYM-0", type: "ATTENDANCE / CHECK-IN", name: "Firstname Mi. Lastname", detail: "TIME IN: ** AM | LOCKER: #--",  color: "green",  action: "VIEW LOG"  },
  { id: "2024-****-GYM-0", type: "ATTENDANCE / CHECK-IN", name: "Firstname Mi. Lastname", detail: "TIME IN: ** AM | LOCKER: #--",  color: "green",  action: "VIEW LOG"  },
  { id: "2024-****-GYM-0", type: "ATTENDANCE / CHECK-IN", name: "Firstname Mi. Lastname", detail: "TIME IN: ** AM | LOCKER: #--",  color: "green",  action: "VIEW LOG"  },
  { id: "2024-****-GYM-0", type: "ATTENDANCE / CHECK-IN", name: "Firstname Mi. Lastname", detail: "TIME IN: ** AM | LOCKER: #--",  color: "green",  action: "VIEW LOG"  },
  { id: "2024-****-GYM-0", type: "ATTENDANCE / CHECK-IN", name: "Firstname Mi. Lastname", detail: "TIME IN: ** AM | LOCKER: #--",  color: "green",  action: "VIEW LOG"  },
  { id: "2024-****-GYM-0", type: "OVERDUE BALANCE",       name: "Firstname Mi. Lastname", detail: "AMOUNT: PHP ----",              color: "orange", action: "NOTIFY"    },
  { id: "2024-****-GYM-0", type: "UPCOMING CLASS",        name: "Firstname Mi. Lastname", detail: "CLASS:\nTIME:",                 color: "blue",   action: "REMIND"    },
  { id: "2024-****-GYM-0", type: "UPCOMING PT SESSION",   name: "Firstname Mi. Lastname", detail: "COACH:\nTIME:",                 color: "blue",   action: "REMIND"    },
  { id: "2024-****-GYM-0", type: "UPCOMING EVALUATION",   name: "Firstname Mi. Lastname", detail: "ACTIVITY:\nTIME:",              color: "blue",   action: "REMIND"    },
  { id: "2024-****-GYM-0", type: "UPCOMING CLASS",        name: "Firstname Mi. Lastname", detail: "CLASS:\nTIME:",                 color: "blue",   action: "REMIND"    },
  { id: "2024-****-GYM-0", type: "UPCOMING PT SESSION",   name: "Firstname Mi. Lastname", detail: "COACH:\nTIME:",                 color: "blue",   action: "REMIND"    },
  { id: "2024-****-GYM-0", type: "UPCOMING EVALUATION",   name: "Firstname Mi. Lastname", detail: "ACTIVITY:\nTIME:",              color: "blue",   action: "REMIND"    },
  { id: "2024-****-GYM-0", type: "OVERDUE BALANCE",       name: "Firstname Mi. Lastname", detail: "AMOUNT: PHP ----",              color: "orange", action: "NOTIFY"    },
  { id: "2023-****-GYM-0", type: "MEMBERSHIP EXPIRING",   name: "Firstname Mi. Lastname", detail: "EXPIRY: -- DAYS REMAINING",     color: "yellow", action: "NOTIFY"    },
  { id: "2023-****-GYM-0", type: "MEMBERSHIP EXPIRED",    name: "Firstname Mi. Lastname", detail: "EXPIRED",                       color: "red",    action: "NOTIFY"    },
];

const FILTERS = ["ALL", "EXPIRING", "EXPIRED", "OVERDUE", "UPCOMING", "ATTENDANCE"];
const FILTER_STATUS = ["Pending", "Sent", "Failed"];

const filterMap = {
  ALL:        () => true,
  EXPIRING:   (n) => n.type === "MEMBERSHIP EXPIRING",
  EXPIRED:    (n) => n.type === "MEMBERSHIP EXPIRED",
  OVERDUE:    (n) => n.type === "OVERDUE BALANCE",
  UPCOMING:   (n) => ["UPCOMING CLASS", "UPCOMING PT SESSION", "UPCOMING EVALUATION"].includes(n.type),
  ATTENDANCE: (n) => n.type === "ATTENDANCE / CHECK-IN",
};

const dotColor = {
  orange: "#f0a500",
  yellow: "#f5d000",
  green:  "#7eba56",
  blue:   "#4a90d9",
  red:    "#e05555",
};

export default function NotificationsPage({ onNavigate, activePage = "notifications" }) {
  const [search, setSearch]             = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selected, setSelected]         = useState([]);
  const [selectMode, setSelectMode]     = useState(false);
  const [showFiltersDD, setShowFiltersDD] = useState(false);
  const [filterStatus, setFilterStatus] = useState(null);
  const [showAttendanceDD, setShowAttendanceDD] = useState(false);
  const [viewLogTarget, setViewLogTarget] = useState(null);
  const filtersDDRef   = useRef();
  const attendanceDDRef = useRef();

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (filtersDDRef.current && !filtersDDRef.current.contains(e.target))
        setShowFiltersDD(false);
      if (attendanceDDRef.current && !attendanceDDRef.current.contains(e.target))
        setShowAttendanceDD(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  const getActionClass = (action) => {
    if (action === "VIEW LOG") return styles.viewLogBtn;
    if (action === "REMIND")   return styles.remindBtn;
    return styles.notifyBtn;
  };

  return (
    <>
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

            {/* FILTERS dropdown */}
            <div className={styles.dropdownWrapper} ref={filtersDDRef}>
              <button
                className={`${styles.filterDropBtn} ${showFiltersDD ? styles.filterActive : ""}`}
                onClick={() => setShowFiltersDD(!showFiltersDD)}
              >
                FILTERS {filterStatus ? `· ${filterStatus}` : ""} ▾
              </button>
              {showFiltersDD && (
                <div className={styles.dropdownMenu}>
                  {FILTER_STATUS.map((s) => (
                    <button
                      key={s}
                      className={`${styles.dropdownItem} ${filterStatus === s ? styles.dropdownItemActive : ""}`}
                      onClick={() => { setFilterStatus(filterStatus === s ? null : s); setShowFiltersDD(false); }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Static filter buttons */}
            {["ALL", "EXPIRING", "EXPIRED", "OVERDUE"].map((f) => (
              <button
                key={f}
                className={`${styles.filterBtn} ${activeFilter === f ? styles.filterActive : ""}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}

            {/* UPCOMING button */}
            <button
              className={`${styles.filterBtn} ${activeFilter === "UPCOMING" ? styles.filterActive : ""}`}
              onClick={() => setActiveFilter("UPCOMING")}
            >
              UPCOMING
            </button>

            {/* ATTENDANCE dropdown */}
            <div className={styles.dropdownWrapper} ref={attendanceDDRef}>
              <button
                className={`${styles.filterBtn} ${activeFilter === "ATTENDANCE" ? styles.filterActive : ""}`}
                onClick={() => { setActiveFilter("ATTENDANCE"); setShowAttendanceDD(!showAttendanceDD); }}
              >
                ATTENDANCE ▾
              </button>
              {showAttendanceDD && activeFilter === "ATTENDANCE" && (
                <div className={styles.dropdownMenu}>
                  {["Check-In", "Check-Out", "All"].map((opt) => (
                    <button key={opt} className={styles.dropdownItem}
                      onClick={() => setShowAttendanceDD(false)}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
                  <button
                    className={`${styles.actionBtn} ${getActionClass(n.action)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (n.action === "VIEW LOG") setViewLogTarget(n);
                    }}
                  >
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
                    {n.detail.split("\n").map((line, j) => (
                      <p key={j} className={styles.cardValue}>{line}</p>
                    ))}
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

      {/* View Log Modal */}
      {viewLogTarget && (
        <ViewLogModal
          notification={viewLogTarget}
          onClose={() => setViewLogTarget(null)}
        />
      )}
    </>
  );
}
