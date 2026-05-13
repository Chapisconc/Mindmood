import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./theme/ThemeContext";
import { I18nProvider } from "./i18n/I18nContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#0F0A1E" }}>
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#8B5CF640", borderTopColor: "#8B5CF6" }} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ErrorBoundary>
          <div
            style={{ minHeight: "100vh", backgroundColor: "var(--bg)" }}
            className="transition-colors duration-300"
          >
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/*" element={<Layout />} />
              </Routes>
            </Suspense>
          </div>
        </ErrorBoundary>
      </I18nProvider>
    </ThemeProvider>
  );
}
