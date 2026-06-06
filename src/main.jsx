import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { supabaseConfigError } from "./lib/supabaseClient";
import "@tabler/icons-webfont/dist/tabler-icons.css";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      {supabaseConfigError ? (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            background: "#fff7ed",
            color: "#7c2d12",
            fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "720px",
              background: "#ffffff",
              border: "1px solid #fdba74",
              borderRadius: "14px",
              padding: "20px 22px",
            }}
          >
            <h1 style={{ margin: "0 0 8px", fontSize: "20px" }}>Configuration error</h1>
            <p style={{ margin: "0 0 10px" }}>{supabaseConfigError}</p>
            <p style={{ margin: 0, fontSize: "13px" }}>
              Restart the Vite server after changing .env, then hard refresh this page.
            </p>
          </div>
        </div>
      ) : (
        <BrowserRouter>
          <App />
        </BrowserRouter>
      )}
    </AppErrorBoundary>
  </StrictMode>,
)
