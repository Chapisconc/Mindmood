import { lazy, Suspense, useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, PlusCircle, BookOpen, TrendingUp, Bell,
  UserCircle, Shield, LogOut, Sun, Moon, ChevronRight,
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

function Sidebar({ collapsed, onToggle, currentPath, navigate }) {
  const { themeStyles, theme, toggleTheme } = useTheme();
  const { profile, user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <motion.aside animate={{ width: collapsed ? 72 : 260 }}
      className="hidden lg:flex flex-col fixed left-0 top-0 h-screen z-40 border-r bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b flex-shrink-0 border-slate-200 dark:border-slate-800">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: themeStyles.accent }}>
          <span className="text-white text-base font-black">M</span>
        </div>
        {!collapsed && <span className="text-lg font-black tracking-tight dark:text-white" style={{ color: themeStyles.text }}>MindMood</span>}
        <button onClick={onToggle} className="ml-auto bg-transparent border-none cursor-pointer p-1 rounded-lg hover:opacity-70 transition-opacity">
          <ChevronRight size={18} color={themeStyles.secondaryText}
            style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </button>
      </div>

      <div className="flex-1 px-3 py-4 space-y-2 flex flex-col justify-center items-center">
        <button onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border-none cursor-pointer"
          style={{ color: themeStyles.secondaryText }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeStyles.softAccent}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: themeStyles.itemBg }}>
            {theme === "dark" ? <Sun size={20} color="#FBBF24" /> : <Moon size={20} color="#6366F1" />}
          </div>
          {!collapsed && <span className="text-sm font-bold tracking-tight">{theme === "dark" ? "Modo Claro" : "Modo Oscuro"}</span>}
        </button>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border-none cursor-pointer"
          style={{ color: "#EF4444" }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#FEE2E2"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FEE2E2" }}>
            <LogOut size={20} color="#EF4444" />
          </div>
          {!collapsed && <span className="text-sm font-bold tracking-tight">Cerrar Sesión</span>}
        </button>
      </div>

      <div className="p-3 border-t flex-shrink-0 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black"
            style={{ backgroundColor: themeStyles.itemBg, color: themeStyles.text }}>
            {(profile?.display_name || user?.email || "U")[0].toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate dark:text-white" style={{ color: themeStyles.text }}>
                {profile?.display_name || user?.email?.split("@")[0] || "Usuario"}
              </p>
              <p className="text-[11px] font-semibold truncate opacity-60 dark:text-slate-400" style={{ color: themeStyles.secondaryText }}>{user?.email}</p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

function MobileNav({ currentPath, navigate }) {
  const { themeStyles: theme } = useTheme();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const items = isAdmin ? ADMIN_NAV_ITEMS : [...NAV_ITEMS.slice(0, 4), { path: "/profile", icon: UserCircle, label: "Perfil" }];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t flex items-center justify-around px-2 py-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      {items.map((item) => {
        const Icon = item.icon;
        const active = currentPath === item.path;
        return (
          <button key={item.path} onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl bg-transparent border-none cursor-pointer">
            <Icon size={20} color={active ? theme.accent : theme.secondaryText} />
            <span className="text-[10px] font-extrabold" style={{ color: active ? theme.accent : theme.secondaryText }}>{item.label}</span>
          </button>
        );
      })}
    </div>
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
  const [checkedAdmin, setCheckedAdmin] = useState(false);
  const currentPath = location.pathname;

  useEffect(() => {
    if (!user || checkedAdmin) return;
    setCheckedAdmin(true);
    supabase.rpc("is_admin").then(({ data }) => {
      if (data && !["/admin-dashboard", "/profile"].includes(currentPath)) {
        navigate("/admin-dashboard", { replace: true });
      }
    }).catch(() => {});
  }, [user, checkedAdmin, currentPath, navigate]);

  useEffect(() => {
    if (profile?.role === "admin" && user && !["/admin-dashboard", "/profile"].includes(currentPath)) {
      navigate("/admin-dashboard", { replace: true });
    }
  }, [profile?.role, user, currentPath, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  const wrapperClass = sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} currentPath={currentPath} navigate={navigate} />

      <div className={`transition-all duration-200 ${wrapperClass}`} style={{ paddingBottom: "80px" }}>
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

      {profile?.role !== "admin" && <MobileNav currentPath={currentPath} navigate={navigate} />}
    </div>
  );
}
