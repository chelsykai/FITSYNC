import { useState, useEffect } from "react";
import LogInPage from "./pages/auth/LogInPage";
import CreatePage from "./pages/auth/CreatePage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import OverviewPage from "./pages/dashboard/OverviewPage";
import MembersPage from "./pages/dashboard/MembersPage";
import PaymentsPage from "./pages/dashboard/PaymentsPage";
import NotificationsPage from "./pages/dashboard/NotificationsPage";
import AccountsPage from "./pages/dashboard/AccountsPage";
import ScannerPage from "./pages/dashboard/ScannerPage";
import RecordPaymentPage from "./pages/dashboard/RecordPaymentPage";

function App() {
  const [route, setRoute] = useState("login");
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      // User is logged in, restore last page or go to overview
      const lastRoute = localStorage.getItem("lastRoute");
      setRoute(lastRoute || "overview");
    }
    setIsLoading(false);
  }, []);

  // Save current route to localStorage whenever it changes
  useEffect(() => {
    if (route !== "login" && route !== "create" && route !== "forgot") {
      localStorage.setItem("lastRoute", route);
    }
  }, [route]);

  const navigate = (to) => {
    if (to === "logout") {
      // Clear user session and go to login
      localStorage.removeItem("currentUser");
      localStorage.removeItem("lastRoute");
      setRoute("login");
    } else {
      setRoute(to);
    }
  };

  if (isLoading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontSize: "18px", color: "#666" }}>Loading...</div>;
  }

  return (
    <>
      {route === "login"         && <LogInPage onNavigate={navigate} />}
      {route === "create"        && <CreatePage onNavigate={navigate} />}
      {route === "forgot"        && <ForgotPasswordPage onNavigate={navigate} />}
      {route === "overview"      && <OverviewPage activePage="overview" onNavigate={navigate} />}
      {route === "members"       && <MembersPage activePage="members" onNavigate={navigate} />}
      {route === "payments"      && <PaymentsPage activePage="payments" onNavigate={navigate} />}
      {route === "notifications" && <NotificationsPage activePage="notifications" onNavigate={navigate} />}
      {route === "accounts"      && <AccountsPage activePage="accounts" onNavigate={navigate} />}
      {route === "scanner"       && <ScannerPage activePage="scanner" onNavigate={navigate} />}
      {route === "recordPayment" && <RecordPaymentPage activePage="payments" onNavigate={navigate} />}
    </>
  );
}

export default App;
