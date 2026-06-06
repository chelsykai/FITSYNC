import { Component } from "react";

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unhandled app error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            background: "#f8fafc",
            color: "#0f172a",
            fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "680px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "20px 22px",
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
            }}
          >
            <h1 style={{ margin: "0 0 8px", fontSize: "20px" }}>App failed to render</h1>
            <p style={{ margin: "0 0 12px", color: "#334155" }}>
              Check environment variables and browser storage, then refresh.
            </p>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                background: "#0f172a",
                color: "#e2e8f0",
                borderRadius: "10px",
                padding: "12px",
                fontSize: "12px",
              }}
            >
              {this.state.error?.message || "Unknown rendering error."}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
