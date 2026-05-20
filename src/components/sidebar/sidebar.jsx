import { useState } from "react";
import styles from "./sidebar.module.css";
import logo from "../../assets/logo_2.png";

const ADMIN_NAV_ITEMS = [
  { label: "OVERVIEW",      route: "overview",      icon: "ti-layout-dashboard" },
  { label: "MEMBERS",       route: "members",       icon: "ti-users"            },
  { label: "PAYMENTS",      route: "payments",      icon: "ti-credit-card"      },
  { label: "NOTIFICATIONS", route: "notifications", icon: "ti-bell"             },
  { label: "ACCOUNTS",      route: "accounts",      icon: "ti-user-circle"      },
];

const STAFF_NAV_ITEMS = [
  { label: "DASHBOARD", route: "staffDashboard", icon: "ti-home"        },
  { label: "OVERVIEW",  route: "overview",       icon: "ti-layout-dashboard" },
  { label: "MEMBERS",   route: "members",        icon: "ti-users"            },
];

const getStoredRole = () => {
  try {
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
    return String(currentUser?.role || "staff").toLowerCase() === "admin";
  } catch {
    return false;
  }
};

export default function Sidebar({
  activePage,
  onNavigate,
  newMembersCount = 0,
  newNotifsCount = 0,
  isAdmin = getStoredRole(),
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const navItems = isAdmin ? ADMIN_NAV_ITEMS : STAFF_NAV_ITEMS;

  const handleNav = (route) => {
    onNavigate(route);
    setMenuOpen(false);
  };

  return (
    <>
      {/* Hamburger — mobile only */}
      <button
        className={styles.hamburger}
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        <span /><span /><span />
      </button>

      {/* Mobile backdrop */}
      {menuOpen && (
        <div className={styles.mobileBackdrop} onClick={() => setMenuOpen(false)} />
      )}

      <div className={styles.sidebarWrapper}>
        <div className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>

          {/* Decorative background circles */}
          <div className={styles.decorCircleTop} aria-hidden="true" />
          <div className={styles.decorCircleBottom} aria-hidden="true" />

          {/* Logo — double ring */}
          <div className={styles.logoRing}>
            <div className={styles.logoInner}>
              <img src={logo} alt="FitSync Logo" className={styles.logo} />
            </div>
          </div>

          <div className={styles.divider} />

          {/* Nav Links */}
          <nav className={styles.nav}>
            {navItems.map((item) => {
              const count =
                item.route === "members"       ? newMembersCount :
                item.route === "notifications" ? newNotifsCount  : 0;

              return (
                <button
                  key={item.route}
                  className={`${styles.navItem} ${activePage === item.route ? styles.active : ""}`}
                  onClick={() => handleNav(item.route)}
                >
                  <i className={`ti ${item.icon} ${styles.navIcon}`} aria-hidden="true" />
                  <span className={styles.navLabel}>{item.label}</span>
                  {count > 0 && (
                    <span className={styles.badge}>{count}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className={styles.logoutArea}>
            <div className={styles.logoutDivider} />
            <button className={styles.logout} onClick={() => setShowConfirm(true)}>
              <i className="ti ti-logout" aria-hidden="true" />
              LOGOUT
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showConfirm && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Confirmation</h3>
            <p className={styles.modalText}>Are you sure you want to log out?</p>
            <div className={styles.modalButtons}>
              <button className={styles.yesBtn}
                onClick={() => { setShowConfirm(false); onNavigate("logout"); }}>
                Yes
              </button>
              <button className={styles.cancelBtn} onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
