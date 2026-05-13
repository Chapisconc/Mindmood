import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./theme/ThemeContext";
import { I18nProvider } from "./i18n/I18nContext";
import ErrorBoundary from "./components/ErrorBoundary";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Home = lazy(() => import("./pages/Home"));
const NewEntry = lazy(() => import("./pages/NewEntry"));
const History = lazy(() => import("./pages/History"));
const Stats = lazy(() => import("./pages/Stats"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Inbox = lazy(() => import("./pages/Inbox"));

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
                <Route path="/home" element={<Home />} />
                <Route path="/new-entry" element={<NewEntry />} />
                <Route path="/history" element={<History />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </ErrorBoundary>
      </I18nProvider>
    </ThemeProvider>
  );
}