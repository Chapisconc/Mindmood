import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, PlusCircle, BookOpen, TrendingUp, Bell,
  UserCircle, Shield, LogOut, Sun, Moon, ChevronRight,
  Menu, X,
} from "lucide-react";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../services/supabase";

const HomePage = lazy(() => import("../pages/Home"));
const NewEntry = lazy(() => import("../pages/NewEntry"));
const History = lazy(() => import("../pages/History"));
const Stats = lazy(() => import("../pages/Stats"));
const Profile = lazy(() => import("../pages/Profile"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const Inbox = lazy(() => import("../pages/Inbox"));

const NAV_ITEMS = [
  { path: "/home", icon: Home, label: "Inicio" },
  { path: "/new-entry", icon: PlusCircle, label: "Nueva Entrada" },
  { path: "/history", icon: BookOpen, label: "Historial" },
  { path: "/stats", icon: TrendingUp, label: "Estadísticas" },
  { path: "/inbox", icon: Bell, label: "Bandeja" },
  { path: "/profile", icon: UserCircle, label: "Perfil" },
];

const ADMIN_NAV_ITEMS = [
  { path: "/admin-dashboard", icon: Shield, label: "Dashboard" },
  { path: "/profile", icon: UserCircle, label: "Perfil" },
];

function Sidebar({ collapsed, onToggle, currentPath, navigate, mobileOpen, onMobileClose }) {
  const { themeStyles, theme, toggleTheme } = useTheme();
  const { profile, user } = useAuth();
  const isActive = (path) => (currentPath || "").split("?")[0].split("#")[0] === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const navContent = (isMobile, showCollapse = false) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 h-16 border-b flex-shrink-0 border-slate-200 dark:border-slate-800">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: themeStyles.accent }}>
          <span className="text-white text-base font-black">M</span>
        </div>
        {(!isMobile || !collapsed) && <span className="text-lg font-black tracking-tight dark:text-white" style={{ color: themeStyles.text }}>MindMood</span>}
        {showCollapse && (
          <button onClick={onToggle} className="ml-auto bg-transparent border-none cursor-pointer p-1 rounded-lg hover:opacity-70 transition-opacity">
            <ChevronRight size={18} color={themeStyles.secondaryText}
              style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); if (isMobile) onMobileClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border-none cursor-pointer"
              style={{
                color: active ? themeStyles.accent : themeStyles.secondaryText,
                backgroundColor: active ? `${themeStyles.accent}15` : "transparent",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = themeStyles.softAccent; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: active ? themeStyles.accent : themeStyles.itemBg }}>
                <Icon size={20} color={active ? "#FFF" : themeStyles.secondaryText} />
              </div>
              {(!isMobile || !collapsed) && <span className="text-sm font-bold tracking-tight">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-2 space-y-1 border-t border-slate-200 dark:border-slate-800">
        <button onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border-none cursor-pointer"
          style={{ color: themeStyles.secondaryText }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeStyles.softAccent}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: themeStyles.itemBg }}>
            {theme === "dark" ? <Sun size={20} color="#FBBF24" /> : <Moon size={20} color="#6366F1" />}
          </div>
          {(!isMobile || !collapsed) && <span className="text-sm font-bold tracking-tight">{theme === "dark" ? "Modo Claro" : "Modo Oscuro"}</span>}
        </button>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border-none cursor-pointer"
          style={{ color: "#EF4444" }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#FEE2E2"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FEE2E2" }}>
            <LogOut size={20} color="#EF4444" />
          </div>
          {(!isMobile || !collapsed) && <span className="text-sm font-bold tracking-tight">Cerrar Sesión</span>}
        </button>
      </div>

      <div className="p-3 border-t flex-shrink-0 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black"
            style={{ backgroundColor: themeStyles.itemBg, color: themeStyles.text }}>
            {(profile?.display_name || user?.email || "U")[0].toUpperCase()}
          </div>
          {(!isMobile || !collapsed) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate dark:text-white" style={{ color: themeStyles.text }}>
                {profile?.display_name || user?.email?.split("@")[0] || "Usuario"}
              </p>
              <p className="text-[11px] font-semibold truncate opacity-60 dark:text-slate-400" style={{ color: themeStyles.secondaryText }}>{user?.email}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside animate={{ width: collapsed ? 72 : 260 }}
        className="hidden lg:flex flex-col fixed left-0 top-0 h-screen z-40 border-r bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
      >
        {navContent(false, true)}
      </motion.aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={onMobileClose}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-end px-4 h-16 border-b border-slate-200 dark:border-slate-800">
              <button onClick={onMobileClose} className="bg-transparent border-none cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={20} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            {navContent(true)}
          </div>
        </div>
      )}
    </>
  );
}



function LoadingFallback() {
  const { themeStyles: theme } = useTheme();
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${theme.accent}40`, borderTopColor: theme.accent }} />
    </div>
  );
}

export default function Layout() {
  const { themeStyles: theme } = useTheme();
  const { user, profile, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentPath = location.pathname;
  const adminNavGuard = useRef(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentPath]);

  useEffect(() => {
    if (adminNavGuard.current) return;
    if (profile?.role === "admin" && user && !["/admin-dashboard", "/profile"].includes(currentPath) && !authLoading) {
      adminNavGuard.current = true;
      navigate("/admin-dashboard", { replace: true });
    }
  }, [profile?.role, user, currentPath, navigate, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  const normalizedPath = (currentPath || "").split("?")[0].split("#")[0].replace(/\/+$/, "");
  const isAdminRoute = normalizedPath === "/admin-dashboard" || normalizedPath.startsWith("/admin-dashboard/");
  const wrapperClass = isAdminRoute ? "" : (sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]");

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
      {!isAdminRoute && (
        <>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden fixed top-4 left-4 z-30 p-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl hover:scale-105 transition-transform"
          >
            <Menu size={22} className="text-slate-700 dark:text-white" />
          </button>
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            currentPath={currentPath}
            navigate={navigate}
            mobileOpen={mobileMenuOpen}
            onMobileClose={() => setMobileMenuOpen(false)}
          />
        </>
      )}

      <div className={`transition-all duration-200 ${wrapperClass}`}>
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={currentPath} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/new-entry" element={<NewEntry />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/inbox" element={<Inbox />} />
                  <Route path="/admin-dashboard" element={<AdminDashboard />} />
                  <Route path="*" element={<Navigate to={profile?.role === "admin" ? "/admin-dashboard" : "/home"} replace />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
