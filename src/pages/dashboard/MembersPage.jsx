import styles from "./OverviewPage.module.css";
import Sidebar from "../../components/Sidebar/Sidebar";

export default function OverviewPage({ onNavigate, activePage = "overview" }) {
  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <Sidebar activePage={activePage} onNavigate={onNavigate} />

      {/* Main Content */}
      <div className={styles.content}>
        <h1 className={styles.welcome}>Welcome, User!</h1>
        {/* your overview content here */}
      </div>
    </div>
  );
}
