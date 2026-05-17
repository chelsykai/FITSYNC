import { useEffect } from "react";
import DashboardShell from "../layouts/DashboardShell";

const SCANNER_REDIRECT_KEY = "postLoginRedirect";

export default function ScannerRouteGate() {
  useEffect(() => {
    sessionStorage.setItem(SCANNER_REDIRECT_KEY, "/scannerpage");

    return () => {
      if (sessionStorage.getItem(SCANNER_REDIRECT_KEY) === "/scannerpage") {
        sessionStorage.removeItem(SCANNER_REDIRECT_KEY);
      }
    };
  }, []);

  return <DashboardShell initialRoute="login" syncPathToRoot={false} />;
}

export { SCANNER_REDIRECT_KEY };