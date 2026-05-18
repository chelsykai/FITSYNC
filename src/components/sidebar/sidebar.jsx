import { useState } from "react";
import styles from "./sidebar.module.css";
import logo from "../../assets/logo_2.png";

const navItems = [
  { label: "OVERVIEW",      route: "overview"      },
  { label: "MEMBERS",       route: "members"        },
  { label: "PAYMENTS",      route: "payments"       },
  { label: "NOTIFICATIONS", route: "notifications"  },
  { label: "ACCOUNTS",      route: "accounts"       },
];

export default function Sidebar({ activePage, onNavigate }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);

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
          {/* Logo */}
          <div className={styles.logoWrapper}>
            <img src={logo} alt="FitSync Logo" className={styles.logo} />
          </div>

          {/* Nav Links */}
          <nav className={styles.nav}>
            {navItems.map((item) => (
              <button
                key={item.route}
                className={`${styles.navItem} ${activePage === item.route ? styles.active : ""}`}
                onClick={() => handleNav(item.route)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <button className={styles.logout} onClick={() => setShowConfirm(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
              viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            LOGOUT
          </button>
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
