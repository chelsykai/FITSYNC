import { Route, Routes } from "react-router-dom";
import DashboardShell from "./layouts/DashboardShell";
import ScannerPage from "./pages/dashboard/ScannerPage";
import ScannerRouteGate from "./routes/ScannerRouteGate";

const hasSession = () => Boolean(sessionStorage.getItem("currentUser"));

function App() {
  return (
    <Routes>
      <Route
        path="/scannerpage"
        element={hasSession() ? <ScannerPage /> : <ScannerRouteGate />}
      />
      <Route path="*" element={<DashboardShell />} />
    </Routes>
  );
}

export default App;
