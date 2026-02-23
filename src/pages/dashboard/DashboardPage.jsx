import styles from "./DashboardPage.module.css";
import Sidebar from "../../components/Sidebar/Sidebar";

export default function DashboardPage({ onNavigate, activePage = "overview" }) {
  return (
    <div className={styles.layout}>
      {/* Reusable Sidebar */}
      <Sidebar activePage={activePage} onNavigate={onNavigate} />

      {/* Main Content */}
      <div className={styles.content}>
        <h1 className={styles.welcome}>Welcome, Chelsy Kai!</h1>
        {/* your dashboard content here */}
      </div>
    </div>
  );
}
