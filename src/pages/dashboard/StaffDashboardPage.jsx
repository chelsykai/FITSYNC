import styles from "./StaffDashboardPage.module.css";
import Sidebar from "../../components/sidebar/sidebar";

const quickActions = [
  {
    title: "Open Scanner",
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
                  window.location.assign(action.route);
                  return;
                }
                onNavigate(action.route);
              }}
            >
              <span className={`${styles.actionIcon} ti ${action.icon}`} aria-hidden="true" />
              <span className={styles.actionText}>
                <strong>{action.title}</strong>
                <span>{action.description}</span>
              </span>
            </button>
          ))}
        </section>

        <section className={styles.noticePanel}>
          <p className={styles.noticeTitle}>What staff can do</p>
          <ul className={styles.noticeList}>
            <li>Scan QR codes and record attendance.</li>
            <li>View member information needed for day-to-day support.</li>
            <li>Update your own password.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}