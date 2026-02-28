import styles from "./NotificationsPage.module.css";
import Sidebar from "../../components/Sidebar/Sidebar";

export default function NotificationsPage({ onNavigate, activePage = "notifications" }) {
  return (
    <div className={styles.layout}>
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className={styles.content}>
        <h1 className={styles.title}>Gym Notifications</h1>
        {/* notifications content here */}
      </div>
    </div>
  );
}
