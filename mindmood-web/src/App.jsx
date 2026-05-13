import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./theme/ThemeContext";
import { I18nProvider } from "./i18n/I18nContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import NewEntry from "./pages/NewEntry";
import History from "./pages/History";
import Stats from "./pages/Stats";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import Inbox from "./pages/Inbox";

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ErrorBoundary>
          <div
            style={{ minHeight: "100vh", backgroundColor: "var(--bg)" }}
            className="transition-colors duration-300"
          >
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/home" element={<Home />} />
              <Route path="/new-entry" element={<NewEntry />} />
              <Route path="/history" element={<History />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </ErrorBoundary>
      </I18nProvider>
    </ThemeProvider>
  );
}
