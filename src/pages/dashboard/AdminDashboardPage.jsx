import styles from "./AdminDashboardPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";

const quickActions = [
  {
    title: "Scanner",
    description: "Record attendance using the standalone scanner page.",
    route: "/scannerpage",
    icon: "ti-qr-code",
  },
  {
    title: "Overview",
    description: "Review attendance, member activity, and gym performance at a glance.",
    route: "overview",
    icon: "ti-layout-dashboard",
  },
  {
    title: "Members",
    description: "Manage member records, registrations, and attendance workflows.",
    route: "members",
    icon: "ti-users",
  },
  {
    title: "Payments",
    description: "Record transactions, review payment history, and maintain audit trails.",
    route: "payments",
    icon: "ti-credit-card",
  },
  {
    title: "Notifications",
    description: "Send membership reminders and follow-up alerts to members.",
    route: "notifications",
    icon: "ti-bell",
  },
  {
    title: "Accounts",
    description: "Create, edit, and manage staff access and system users.",
    route: "accounts",
    icon: "ti-user-circle",
  },
  {
    title: "Change Password",
    description: "Update your account password anytime.",
    route: "changePassword",
    icon: "ti-lock",
  },
];

export default function AdminDashboardPage({ onNavigate, userRole = "admin" }) {
  const currentRole = String(userRole || "admin").toLowerCase();

  return (
    <div className={styles.layout}>
      <Sidebar activePage="adminDashboard" onNavigate={onNavigate} isAdmin={true} />

      <main className={styles.content}>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Admin dashboard</p>
            <h1 className={styles.title}>Welcome to FitSync</h1>
            <p className={styles.subtitle}>
              You are signed in as <strong>{currentRole}</strong>. Use the tools below to manage the system.
            </p>
          </div>

          <div className={styles.statusCard}>
            <span className={styles.statusLabel}>Access level</span>
            <strong className={styles.statusValue}>Admin</strong>
            <p className={styles.statusNote}>Full dashboard access for operations, users, and reporting.</p>
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
          <p className={styles.noticeTitle}>Admin accessibilities</p>
          <ul className={styles.noticeList}>
            <li>Access the overview dashboard and monitor attendance trends.</li>
            <li>Manage member records, attendance, and membership updates.</li>
            <li>Record payments and maintain the transaction audit trail.</li>
            <li>Send notifications for expirations, reminders, and follow-ups.</li>
            <li>Create and manage staff accounts and related permissions.</li>
            <li>Update your own password.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
