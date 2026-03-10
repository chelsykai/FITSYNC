import styles from "./sidebar.module.css";
import logo from "../../assets/logo_2.png";

const navItems = [
  { label: "OVERVIEW", route: "overview" },
  { label: "MEMBERS", route: "members" },
  { label: "PAYMENTS", route: "payments" },
  { label: "NOTIFICATIONS", route: "notifications" },
  { label: "ACCOUNTS", route: "accounts" },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <div className={styles.sidebarWrapper}>
      <div className={styles.sidebar}>
        {/* Logo */}
        <div className={styles.logoWrapper}>
          <img src={logo} alt="FitSync Logo" className={styles.logo} />
        </div>

        {/* Nav Links */}
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <button
              key={item.route}
              className={`${styles.navItem} ${
                activePage === item.route ? styles.active : ""
              }`}
              onClick={() => onNavigate(item.route)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <button
          className={styles.logout}
          onClick={() => onNavigate("login")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          LOGOUT
        </button>
      </div>
    </div>
  );
}
