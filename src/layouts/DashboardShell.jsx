import { useState, useEffect } from "react";
import LogInPage from "../pages/auth/LogInPage";
import OverviewPage from "../pages/dashboard/OverviewPage";
import StaffDashboardPage from "../pages/dashboard/StaffDashboardPage";
import AdminDashboardPage from "../pages/dashboard/AdminDashboardPage";
import MembersPage from "../pages/dashboard/MembersPage";
import PaymentsPage from "../pages/dashboard/PaymentsPage";
import NotificationsPage from "../pages/dashboard/NotificationsPage";
import AccountsPage from "../pages/dashboard/AccountsPage";
import RecordPaymentPage from "../pages/dashboard/RecordPaymentPage";
import ForcePasswordChangeModal from "../components/modals/accounts/ForcePasswordChangeModal";
import { getWorkingDaysLeft } from "../utils/dateUtils";
import ChangePasswordPage from "../pages/dashboard/ChangePasswordPage";

const AUTH_ROUTES = new Set(["login", "create", "forgot"]);
const NON_SCANNER_ROUTES = new Set([
  "adminDashboard",
  "overview",
  "members",
  "payments",
  "notifications",
  "accounts",
  "recordPayment",
  "changePassword",
]);

const ADMIN_ONLY_ROUTES = new Set(["accounts"]);

const STAFF_ALLOWED_ROUTES = new Set([
  "staffDashboard",
  "overview",
  "members",
  "payments",
  "notifications",
  "recordPayment",
  "changePassword",
]);

const normalizePathname = (pathname = "/") => {
  if (!pathname) return "/";
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/";
};

const parseStoredUser = () => {
  const raw = sessionStorage.getItem("currentUser");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Invalid currentUser payload in sessionStorage.", error);
    sessionStorage.removeItem("currentUser");
    return null;
  }
};

export default function DashboardShell({ initialRoute = "login", syncPathToRoot = true } = {}) {
  const [route, setRoute] = useState(initialRoute);
  const [isLoading, setIsLoading] = useState(true);
  const [forcePassData, setForcePassData] = useState(null);
  const [newMembersCount, setNewMembersCount] = useState(0);
  const [newNotifsCount, setNewNotifsCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  const userRole = String(currentUser?.role || "staff").toLowerCase();
  const isAdmin = userRole === "admin";
  const allowedRoutes = isAdmin ? NON_SCANNER_ROUTES : STAFF_ALLOWED_ROUTES;

  useEffect(() => {
    const user = parseStoredUser();

    if (user) {
      setCurrentUser(user);
      const lastRoute = localStorage.getItem("lastRoute");
      const fallbackRoute = allowedRoutes.has(lastRoute)
        ? lastRoute
        : isAdmin
          ? "adminDashboard"
          : "staffDashboard";

      if (user.password_change_required === true) {
        const daysLeft = getWorkingDaysLeft(user.password_change_deadline);
        setForcePassData({ user, daysLeft });
      }

      setRoute(fallbackRoute);
    }

    setIsLoading(false);
  }, [allowedRoutes]);

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

  useEffect(() => {
    if (isLoading) return;
    if (route === "login") return;
    if (allowedRoutes.has(route)) return;

    setRoute("overview");
  }, [allowedRoutes, isLoading, route]);

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

  const navigate = (to, meta = {}) => {
    if (to === "logout") {
      sessionStorage.removeItem("currentUser");
      localStorage.removeItem("lastRoute");
      setForcePassData(null);
      setCurrentUser(null);
      setRoute("login");
      return;
    }

    if (meta?.user) {
      setCurrentUser(meta.user);
    }

    if (ADMIN_ONLY_ROUTES.has(to) && !isAdmin) {
      setRoute("overview");
      return;
    }

    if (meta?.passwordChangeDaysLeft !== undefined) {
      setForcePassData({ user: meta.user, daysLeft: meta.passwordChangeDaysLeft });
    }

    // Clear badge counts when navigating to the page
    if (to === "members") setNewMembersCount(0);
    if (to === "notifications") setNewNotifsCount(0);

    setRoute(to);
  };

  const renderPage = () => {
    // All shared props — includes badge counts and isAdmin so every
    // page (and the Sidebar inside it) gets the data it needs.
    const pageProps = {
      onNavigate: navigate,
      newMembersCount,
      newNotifsCount,
      onNewMember: () => setNewMembersCount((n) => n + 1),
      onNewNotif: (count) => setNewNotifsCount(count),
      userRole,
      isAdmin,
    };

    switch (route) {
      case "login":
        return <LogInPage key="login" {...pageProps} />;
      case "overview":
        return <OverviewPage key="overview" activePage="overview" {...pageProps} />;
      case "staffDashboard":
        return <StaffDashboardPage key="staffDashboard" {...pageProps} />;
      case "adminDashboard":
        return <AdminDashboardPage key="adminDashboard" {...pageProps} />;
      case "members":
        return <MembersPage key="members" activePage="members" {...pageProps} />;
      case "payments":
        return <PaymentsPage key="payments" activePage="payments" {...pageProps} />;
      case "notifications":
        return <NotificationsPage key="notifications" activePage="notifications" {...pageProps} />;
      case "accounts":
        if (!isAdmin) return <OverviewPage key="overview-staff-3" activePage="overview" {...pageProps} />;
        return <AccountsPage key="accounts" activePage="accounts" {...pageProps} />;
      case "recordPayment":
        return <RecordPaymentPage key="recordPayment" activePage="payments" {...pageProps} />;
      case "changePassword":
        return <ChangePasswordPage key="changePassword" activePage={isAdmin ? "accounts" : "overview"} {...pageProps} />;
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
            const updated = parseStoredUser() || {};
            if (updated.password_change_required === false) {
              setForcePassData(null);
            }
          }}
        />
      )}
    </>
  );
}