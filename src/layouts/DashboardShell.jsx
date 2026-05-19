import { useState, useEffect } from "react";
import LogInPage from "../pages/auth/LogInPage";
import OverviewPage from "../pages/dashboard/OverviewPage";
import MembersPage from "../pages/dashboard/MembersPage";
import PaymentsPage from "../pages/dashboard/PaymentsPage";
import NotificationsPage from "../pages/dashboard/NotificationsPage";
import AccountsPage from "../pages/dashboard/AccountsPage";
import RecordPaymentPage from "../pages/dashboard/RecordPaymentPage";
import ChangePasswordPage from "../pages/dashboard/ChangePasswordPage";
import ForcePasswordChangeModal from "../components/modals/accounts/ForcePasswordChangeModal";
import { getWorkingDaysLeft } from "../utils/dateUtils";

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

export default function DashboardShell({ initialRoute = "login", syncPathToRoot = true } = {}) {
  const [route, setRoute] = useState(initialRoute);
  const [isLoading, setIsLoading] = useState(true);
  const [forcePassData, setForcePassData] = useState(null);
  const [newMembersCount, setNewMembersCount] = useState(0);
  const [newNotifsCount, setNewNotifsCount] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem("currentUser");

    if (stored) {
      const user = JSON.parse(stored);
      const lastRoute = localStorage.getItem("lastRoute");
      const fallbackRoute = NON_SCANNER_ROUTES.has(lastRoute) ? lastRoute : "overview";

      if (user.password_change_required === true) {
        const daysLeft = getWorkingDaysLeft(user.password_change_deadline);
        setForcePassData({ user, daysLeft });
      }

      setRoute(fallbackRoute);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!AUTH_ROUTES.has(route)) {
      localStorage.setItem("lastRoute", route);
    }
  }, [route]);

  useEffect(() => {
    if (isLoading) return;
    if (!syncPathToRoot) return;

    const currentPath = normalizePathname(window.location.pathname);
    if (currentPath !== "/") {
      window.history.replaceState({}, "", "/");
    }
  }, [route, isLoading, syncPathToRoot]);

  const navigate = (to, meta = {}) => {
    if (to === "logout") {
      sessionStorage.removeItem("currentUser");
      localStorage.removeItem("lastRoute");
      setForcePassData(null);
      setRoute("login");
      return;
    }

    if (meta?.passwordChangeDaysLeft !== undefined) {
      setForcePassData({ user: meta.user, daysLeft: meta.passwordChangeDaysLeft });
    }

    if (to === "members") setNewMembersCount(0);
    if (to === "notifications") setNewNotifsCount(0);

    setRoute(to);
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: 18,
          color: "#666",
        }}
      >
        Loading...
      </div>
    );
  }

  const renderPage = () => {
    const pageProps = {
      onNavigate: navigate,
      newMembersCount,
      newNotifsCount,
      onNewMember: () => setNewMembersCount((n) => n + 1),
      onNewNotif: (count) => setNewNotifsCount(count),
    };

    switch (route) {
      case "login":
        return <LogInPage key="login" {...pageProps} />;
      case "overview":
        return <OverviewPage key="overview" activePage="overview" {...pageProps} />;
      case "members":
        return <MembersPage key="members" activePage="members" {...pageProps} />;
      case "payments":
        return <PaymentsPage key="payments" activePage="payments" {...pageProps} />;
      case "notifications":
        return <NotificationsPage key="notifications" activePage="notifications" {...pageProps} />;
      case "accounts":
        return <AccountsPage key="accounts" activePage="accounts" {...pageProps} />;
      case "recordPayment":
        return <RecordPaymentPage key="recordPayment" activePage="payments" {...pageProps} />;
      case "changePassword":
        return <ChangePasswordPage key="changePassword" activePage="accounts" {...pageProps} />;
      default:
        return <LogInPage key="login" {...pageProps} />;
    }
  };

  return (
    <>
      {renderPage()}

      {forcePassData && (
        <ForcePasswordChangeModal
          user={forcePassData.user}
          daysLeft={forcePassData.daysLeft}
          onSuccess={() => {
            setForcePassData(null);
            const updated = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
            if (updated.password_change_required === false) {
              setForcePassData(null);
            }
          }}
        />
      )}
    </>
  );
}
