import styles from "./AccountsPage.module.css";
import Sidebar from "../../components/Sidebar/Sidebar";

export default function AccountsPage({ onNavigate, activePage = "accounts" }) {
  return (
    <div className={styles.layout}>
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div className={styles.content}>
        <h1 className={styles.title}>Accounts</h1>
        {/* accounts content here */}
      </div>
    </div>
  );
}
