import styles from "./PaymentsPage.module.css";
import Sidebar from "../../components/Sidebar/Sidebar";

export default function PaymentsPage({ onNavigate, activePage = "payments" }) {
  return (
    <div className={styles.layout}>
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className={styles.content}>
        <h1 className={styles.title}>Payments</h1>
        {/* payments content here */}
      </div>
    </div>
  );
}
