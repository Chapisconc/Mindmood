import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV)
      console.error("Error caught by boundary:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            backgroundColor: "#FAF5FF",
          }}
        >
          <AlertTriangle size={48} color="#EC4899" />
          <h1
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: "#2D1B69",
              marginBottom: 16,
              marginTop: 16,
            }}
          >
            Oops! Something went wrong.
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "#7C3AED",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          {this.state.retryCount < 3 && (
            <button
              onClick={this.handleRetry}
              style={{
                backgroundColor: "#EC4899",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: 28,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 800,
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={24} />
              Try Again
            </button>
          )}
          {this.state.retryCount >= 3 && (
            <p style={{ color: "#7C3AED", fontWeight: 800 }}>
              Max retries reached. Please refresh the page.
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
