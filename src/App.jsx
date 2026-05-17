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
import ChangePasswordPage from "./pages/dashboard/ChangePasswordPage";
import ForcePasswordChangeModal from "./components/modals/accounts/ForcePasswordChangeModal";
import { getWorkingDaysLeft } from "./utils/dateUtils";

const ROUTE_TO_PATH = {
  scanner: "/scannerpage",
};

const PATH_TO_ROUTE = {
  "/scannerpage": "scanner",
};

const AUTH_ROUTES = new Set(["login", "create", "forgot"]);
const NON_SCANNER_ROUTES = new Set([
  "overview",
  "members",
  "payments",
  "notifications",
  "accounts",
  "recordPayment",
  "changePassword",
]);

const normalizePathname = (pathname = "/") => {
  if (!pathname) return "/";
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/";
};

function App() {
  const [route,         setRoute]         = useState("login");
  const [isLoading,     setIsLoading]     = useState(true);
  const [forcePassData, setForcePassData] = useState(null);
  // forcePassData: { user, daysLeft } — shows blocking modal when set

  // Check for existing session on app load
  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    const pathRoute = PATH_TO_ROUTE[normalizePathname(window.location.pathname)];

    if (stored) {
      const user = JSON.parse(stored);
      const lastRoute = localStorage.getItem("lastRoute");
      const fallbackRoute = NON_SCANNER_ROUTES.has(lastRoute) ? lastRoute : "overview";
      // Check if password change is still required
      if (user.password_change_required === true) {
        const daysLeft = getWorkingDaysLeft(user.password_change_deadline);
        setForcePassData({ user, daysLeft });
      }
      // Scanner only opens from explicit /scannerpage path.
      setRoute(pathRoute || fallbackRoute);
    }
    setIsLoading(false);
  }, []);

  // Save current route
  useEffect(() => {
    if (!AUTH_ROUTES.has(route) && route !== "scanner") {
      localStorage.setItem("lastRoute", route);
    }
  }, [route]);

  // Keep scanner page as a dedicated URL path
  useEffect(() => {
    if (isLoading) return;

    const targetPath = AUTH_ROUTES.has(route) ? "/" : (ROUTE_TO_PATH[route] || "/");
    const currentPath = normalizePathname(window.location.pathname);

    if (currentPath !== targetPath) {
      window.history.replaceState({}, "", targetPath);
    }
  }, [route, isLoading]);

  const navigate = (to, meta = {}) => {
    if (to === "logout") {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("lastRoute");
      setForcePassData(null);
      setRoute("login");
      return;
    }
    // Handle password change flag passed from LogInPage
    if (meta?.passwordChangeDaysLeft !== undefined) {
      setForcePassData({ user: meta.user, daysLeft: meta.passwordChangeDaysLeft });
    }
    setRoute(to);
  };

  if (isLoading) {
    return (
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"100vh", fontSize:18, color:"#666" }}>
        Loading...
      </div>
    );
  }

  const renderPage = () => {
    const pageProps = { onNavigate: navigate };
    switch (route) {
      case "login":         return <LogInPage key="login" {...pageProps} />;
      case "create":        return <CreatePage key="create" {...pageProps} />;
      case "forgot":        return <ForgotPasswordPage key="forgot" {...pageProps} />;
      case "overview":      return <OverviewPage key="overview" activePage="overview" {...pageProps} />;
      case "members":       return <MembersPage key="members" activePage="members" {...pageProps} />;
      case "payments":      return <PaymentsPage key="payments" activePage="payments" {...pageProps} />;
      case "notifications": return <NotificationsPage key="notifications" activePage="notifications" {...pageProps} />;
      case "accounts":      return <AccountsPage key="accounts" activePage="accounts" {...pageProps} />;
      case "scanner":       return <ScannerPage key="scanner" activePage="scanner" {...pageProps} />;
      case "recordPayment": return <RecordPaymentPage key="recordPayment" activePage="payments" {...pageProps} />;
      case "changePassword": return <ChangePasswordPage key="changePassword" activePage="accounts" {...pageProps} />;
      default:              return <LogInPage key="login" {...pageProps} />;
    }
  };

  return (
    <>
      {renderPage()}

      {/* Blocking modal — shows on top of any page when password change is required */}
      {forcePassData && (
        <ForcePasswordChangeModal
          user={forcePassData.user}
          daysLeft={forcePassData.daysLeft}
          onSuccess={() => {
            setForcePassData(null);
            // Refresh user from localStorage after password change
            const updated = JSON.parse(localStorage.getItem("currentUser") || "{}");
            if (updated.password_change_required === false) {
              setForcePassData(null);
            }
          }}
        />
      )}
    </>
  );
}

export default App;
