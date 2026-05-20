import { useState, useRef, useEffect, useCallback } from "react";
import styles from "./NotificationsPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";
import ViewLogModal from "../../components/modals/notifications/ViewLogModal";
import { supabase } from "../../lib/supabaseClient";
import { fetchMembers } from "../../services/memberService";
import { sendMemberNotificationEmail } from "../../services/notificationEmailService";
import { formatMMDDYYYY } from "../../utils/dateFormat";

const FILTER_STATUS = ["Pending", "Sent", "Failed"];

const filterMap = {
  ALL:        () => true,
  EXPIRING:   (n) => n.type === "MEMBERSHIP EXPIRING",
  EXPIRED:    (n) => n.type === "MEMBERSHIP EXPIRED",
  OVERDUE:    (n) => n.type === "MEMBERSHIP OVERDUE",
};

const dotColor = {
  orange: "#f0a500",
  yellow: "#f5d000",
  green:  "#7eba56",
  blue:   "#4a90d9",
  red:    "#e05555",
};

function parseMembershipValidity(yearlyValidity, monthlyValidity) {
  const yearly = String(yearlyValidity || "").trim();
  const monthly = String(monthlyValidity || "").trim();

  if (yearly) {
    const yearlyMatch = yearly.match(/(\d+)/);
    if (!yearlyMatch) return null;
    return {
      amount: Number(yearlyMatch[1]),
      unit: "year",
    };
  }

  if (!monthly) return null;
  const validityMatch = monthly.match(/(\d+)\s*(month|day|week)?s?/i);
  if (!validityMatch) return null;

  return {
    amount: Number(validityMatch[1]),
    unit: (validityMatch[2] || "month").toLowerCase(),
  };
}

function calculateExpiryDate(joinDate, yearlyValidity, monthlyValidity) {
  if (yearlyValidity instanceof Date) return yearlyValidity;
  const parsed = parseMembershipValidity(yearlyValidity, monthlyValidity);
  if (!joinDate || !parsed) return null;

  const expiryDate = new Date(joinDate);
  if (Number.isNaN(expiryDate.getTime())) return null;

  if (parsed.unit === "year") {
    expiryDate.setFullYear(expiryDate.getFullYear() + parsed.amount);
  } else if (parsed.unit === "month") {
    expiryDate.setMonth(expiryDate.getMonth() + parsed.amount);
  } else if (parsed.unit === "week") {
    expiryDate.setDate(expiryDate.getDate() + parsed.amount * 7);
  } else {
    expiryDate.setDate(expiryDate.getDate() + parsed.amount);
  }

  return expiryDate;
}

function buildNotificationsFromMembers(members) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return members
    .flatMap((member) => {
      const results = [];
      const storedExpiry = member.expiration_date ? new Date(member.expiration_date) : null;
      const expiryDate = storedExpiry && !Number.isNaN(storedExpiry.getTime())
        ? storedExpiry
        : calculateExpiryDate(member.join_date, member.membership_validity, member.monthly_validity);

      if (expiryDate) {
        const oneDay = 1000 * 60 * 60 * 24;
        const dayDiff = Math.ceil((expiryDate.getTime() - today.getTime()) / oneDay);
        const expiryText = formatMMDDYYYY(expiryDate);
        if (dayDiff < 0) {
          results.push({
            key: `${member.member_id}-overdue`,
            member,
            id: member.member_id,
            type: "MEMBERSHIP OVERDUE",
            name: member.full_name,
            detail: `Overdue by ${Math.abs(dayDiff)} day${Math.abs(dayDiff) === 1 ? "" : "s"}`,
            color: "orange",
            action: "NOTIFY",
            daysRemaining: dayDiff,
            expiryText,
          });
        } else if (dayDiff === 0) {
          results.push({
            key: `${member.member_id}-expired`,
            member,
            id: member.member_id,
            type: "MEMBERSHIP EXPIRED",
            name: member.full_name,
            detail: `Expires today`,
            color: "red",
            action: "NOTIFY",
            daysRemaining: dayDiff,
            expiryText,
          });
        } else if (dayDiff > 0 && dayDiff <= 14) {
          // Match Overview: treat any expiry within the next 14 days as expiring soon
          results.push({
            key: `${member.member_id}-expiring`,
            member,
            id: member.member_id,
            type: "MEMBERSHIP EXPIRING",
            name: member.full_name,
            detail: `Expiry: ${dayDiff} day${dayDiff === 1 ? "" : "s"} remaining`,
            color: "yellow",
            action: "NOTIFY",
            daysRemaining: dayDiff,
            expiryText,
          });
        }
      }

      return results;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function NotificationsPage({ onNavigate, activePage = "notifications", onNewNotif }) {
  const [search, setSearch]             = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selected, setSelected]         = useState([]);
  const [selectMode, setSelectMode]     = useState(false);
  const [showFiltersDD, setShowFiltersDD] = useState(false);
  const [filterStatus, setFilterStatus] = useState(null);
  const [viewLogTarget, setViewLogTarget] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [sendingMap, setSendingMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const filtersDDRef   = useRef();

  const pendingCount = notifications.filter(
  (n) => !statusMap[n.key] || statusMap[n.key] === "Pending").length;

   useEffect(() => { onNewNotif?.(pendingCount);}, [pendingCount]);

  const loadNotifications = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const members = await fetchMembers();
      setNotifications(buildNotificationsFromMembers(members));
      setError(null);
    } catch (err) {
      console.error("Error loading notifications:", err);
      setError("Failed to load notifications.");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications(true);

    const notificationsChannel = supabase
      .channel("notifications-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "member" }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  }, [loadNotifications]);

  // Fallback auto-refresh in case realtime events are delayed or unavailable.
  useEffect(() => {
    const refreshInterval = window.setInterval(() => {
      loadNotifications();
    }, 5000);

    const handleFocus = () => {
      loadNotifications();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadNotifications]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (filtersDDRef.current && !filtersDDRef.current.contains(e.target))
        setShowFiltersDD(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNotify = async (notification) => {
    if (!notification?.member?.email) {
      setStatusMap((prev) => ({ ...prev, [notification.key]: "Failed" }));
      window.alert(`No email found for ${notification.name}.`);
      return;
    }

    try {
      setSendingMap((prev) => ({ ...prev, [notification.key]: true }));
      await sendMemberNotificationEmail(notification.member, notification);
      setNotifications((prev) => prev.filter((item) => item.key !== notification.key));
      setSelected((prev) => prev.filter((key) => key !== notification.key));
      setStatusMap((prev) => {
        const next = { ...prev };
        delete next[notification.key];
        return next;
      });
      setSendingMap((prev) => {
        const next = { ...prev };
        delete next[notification.key];
        return next;
      });
    } catch (err) {
      console.error("Error sending notification:", err);
      setStatusMap((prev) => ({ ...prev, [notification.key]: "Failed" }));
      window.alert(err?.message || "Failed to send notification.");
    } finally {
      setSendingMap((prev) => {
        if (!prev[notification.key]) return prev;
        return { ...prev, [notification.key]: false };
      });
    }
  };

  const filtered = notifications.filter((n) => {
    const matchSearch =
      n.type.toLowerCase().includes(search.toLowerCase()) ||
      n.id.toLowerCase().includes(search.toLowerCase()) ||
      n.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterMap[activeFilter](n);
    const computedStatus = statusMap[n.key] || "Pending";
    const matchStatus = !filterStatus || computedStatus === filterStatus;
    return matchSearch && matchFilter && matchStatus;
  });

  const toggleSelect = (notificationKey) => {
    setSelected((prev) =>
      prev.includes(notificationKey)
        ? prev.filter((x) => x !== notificationKey)
        : [...prev, notificationKey]
    );
  };

  const handleBulkNotify = async () => {
    const targets = filtered.filter((notification) =>
      selected.includes(notification.key)
    );

    for (const notification of targets) {
      // Keep sequence simple to avoid EmailJS rate limits.
      // eslint-disable-next-line no-await-in-loop
      await handleNotify(notification);
    }
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
        <div className={`${styles.content} tab-slide-animation`}>
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

          {error && (
            <div style={{ color: "#d32f2f", marginBottom: 12 }}>{error}</div>
          )}

          {loading && (
            <div style={{ color: "#666", marginBottom: 12 }}>Loading notifications...</div>
          )}

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

            <button
              className={`${styles.selectMultipleBtn} ${selectMode ? styles.selectModeActive : ""}`}
              onClick={() => { setSelectMode(!selectMode); setSelected([]); }}
            >
              SELECT MULTIPLE
            </button>
          </div>

          {/* Notification Grid */}
          <div className={styles.grid}>
            {filtered.map((n) => (
              <div
                key={n.key}
                className={`${styles.card} ${selectMode && selected.includes(n.key) ? styles.cardSelected : ""}`}
                onClick={() => selectMode && toggleSelect(n.key)}
              >
                {selectMode && (
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={selected.includes(n.key)}
                    onChange={() => toggleSelect(n.key)}
                  />
                )}
                <div className={styles.cardTop}>
                  <span className={styles.dot} style={{ backgroundColor: dotColor[n.color] }} />
                  <span className={styles.cardType}>{n.type}</span>
                  <button
                    className={`${styles.actionBtn} ${getActionClass(n.action)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (n.action === "VIEW LOG") {
                        setViewLogTarget(n);
                        return;
                      }
                      handleNotify(n);
                    }}
                    disabled={Boolean(sendingMap[n.key])}
                  >
                    {sendingMap[n.key] ? "SENDING..." : n.action}
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
                <p className={styles.cardValue} style={{ marginTop: 10 }}>
                  Status: {statusMap[n.key] || "Pending"}
                </p>
              </div>
            ))}

            {!loading && filtered.length === 0 && (
              <div className={styles.card}>
                <p className={styles.cardValue}>No notifications found.</p>
              </div>
            )}
          </div>

          {/* Bulk action bar */}
          {selectMode && selected.length > 0 && (
            <div className={styles.bulkBar}>
              <span>{selected.length} selected</span>
              <button className={styles.bulkNotify} onClick={handleBulkNotify}>Notify All</button>
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
