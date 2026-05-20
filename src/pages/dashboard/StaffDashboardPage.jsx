import styles from "./StaffDashboardPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";

const quickActions = [
  {
    title: "Scanner",
    description: "Record attendance using the standalone scanner page.",
    route: "/scannerpage",
    icon: "ti-qr-code",
  },
  {
    title: "View Members",
    description: "Browse member records and basic membership details.",
    route: "members",
    icon: "ti-users",
  },
  {
    title: "Change Password",
    description: "Update your account password anytime.",
    route: "changePassword",
    icon: "ti-lock",
  },
];

export default function StaffDashboardPage({ onNavigate, userRole = "staff" }) {
  const currentRole = String(userRole || "staff").toLowerCase();

  return (
    <div className={styles.layout}>
      <Sidebar activePage="staffDashboard" onNavigate={onNavigate} isAdmin={false} />

      <main className={styles.content}>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Staff dashboard</p>
            <h1 className={styles.title}>Welcome to FitSync</h1>
            <p className={styles.subtitle}>
              You are signed in as <strong>{currentRole}</strong>. Use the tools below to handle daily tasks.
            </p>
          </div>

          <div className={styles.statusCard}>
            <span className={styles.statusLabel}>Access level</span>
            <strong className={styles.statusValue}>Staff</strong>
            <p className={styles.statusNote}>Limited dashboard access for attendance and member support.</p>
          </div>
        </section>

        <section className={styles.quickActions}>
          {quickActions.map((action) => (
            <button
              key={action.title}
              type="button"
              className={styles.actionCard}
              onClick={() => {
                if (action.route.startsWith("/")) {
                  window.open(action.route, "_blank", "noopener,noreferrer");
                  return;
                }
                onNavigate(action.route);
              }}
            >
              <span className={styles.actionIconWrap} aria-hidden="true">
                {action.title === "Scanner" ? (
                  <span className={styles.scannerLogo}>
                    <svg viewBox="0 0 48 48" role="img" aria-hidden="true">
                      <rect x="11" y="11" width="26" height="26" rx="8" fill="none" stroke="currentColor" strokeWidth="3.2" />
                      <path d="M16 18h6M26 18h6M16 24h6M26 24h6M16 30h16" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
                      <path d="M8 14V8h6M40 14V8h-6M8 34v6h6M40 34v6h-6" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
                    </svg>
                  </span>
                ) : (
                  <span className={`${styles.actionIcon} ti ${action.icon}`} />
                )}
              </span>
              <span className={styles.actionText}>
                <strong>{action.title}</strong>
                <span>{action.description}</span>
              </span>
            </button>
          ))}
        </section>

        <section className={styles.noticePanel}>
          <p className={styles.noticeTitle}>Staff accessibilities</p>
          <ul className={styles.noticeList}>
            <li>Open the scanner in a new tab and record attendance.</li>
            <li>View and add member records, then open attendance tracking.</li>
            <li>Access payment records and record transactions.</li>
            <li>Send membership notifications and follow-up alerts.</li>
            <li>Update your own password.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}