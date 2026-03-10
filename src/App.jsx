import { useState } from "react";
import LogInPage from "./pages/auth/LogInPage";
import CreatePage from "./pages/auth/CreatePage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import OverviewPage from "./pages/dashboard/OverviewPage";
import MembersPage from "./pages/dashboard/MembersPage";
import PaymentsPage from "./pages/dashboard/PaymentsPage";
import NotificationsPage from "./pages/dashboard/NotificationsPage";
import AccountsPage from "./pages/dashboard/AccountsPage";


function App() {
  const [route, setRoute] = useState("login");

  const navigate = (to) => setRoute(to);

  return (
    <>
      {route === "login" && <LogInPage onNavigate={navigate} />}
      {route === "create" && <CreatePage onNavigate={navigate} />}
      {route === "forgot" && <ForgotPasswordPage onNavigate={navigate} />}
      {route === "overview" && <OverviewPage activePage="overview" onNavigate={navigate} />}
      {route === "members" && <MembersPage activePage="members" onNavigate={navigate} />}
      {route === "payments" && <PaymentsPage activePage="payments" onNavigate={navigate} />}
      {route === "notifications" && <NotificationsPage activePage="notifications" onNavigate={navigate} />}
      {route === "accounts" && <AccountsPage activePage="accounts" onNavigate={navigate} />}   
    </>
  );
}

export default App;
