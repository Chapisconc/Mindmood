import { lazy, Suspense, useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, PlusCircle, BookOpen, TrendingUp, Bell,
  UserCircle, Shield, LogOut, Menu, X, ChevronRight,
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

function NavLink({ item, isActive, collapsed, onClick }) {
  const { themeStyles: theme } = useTheme();
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 border-none cursor-pointer text-left"
      style={{
        backgroundColor: isActive ? `${theme.accent}18` : "transparent",
        color: isActive ? theme.accent : theme.secondaryText,
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = theme.softAccent; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: isActive ? `${theme.accent}20` : theme.itemBg }}>
        <Icon size={20} color={isActive ? theme.accent : theme.secondaryText} />
      </div>
      {!collapsed && <span className="text-sm font-bold tracking-tight" style={{ color: isActive ? theme.accent : theme.secondaryText }}>{item.label}</span>}
      {isActive && !collapsed && <div className="ml-auto w-1.5 h-8 rounded-full" style={{ backgroundColor: theme.accent }} />}
    </button>
  );
}

function Sidebar({ collapsed, onToggle, currentPath, navigate }) {
  const { themeStyles: theme } = useTheme();
  const { profile, user } = useAuth();
  const isAdmin = profile?.role === "admin";

  return (
    <motion.aside animate={{ width: collapsed ? 72 : 260 }}
      className="hidden lg:flex flex-col fixed left-0 top-0 h-screen z-40 border-r bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b flex-shrink-0 border-slate-200 dark:border-slate-800">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.accent }}>
          <span className="text-white text-base font-black">M</span>
        </div>
        {!collapsed && <span className="text-lg font-black tracking-tight dark:text-white" style={{ color: theme.text }}>MindMood</span>}
        <button onClick={onToggle} className="ml-auto bg-transparent border-none cursor-pointer p-1 rounded-lg hover:opacity-70 transition-opacity">
          <ChevronRight size={18} color={theme.secondaryText}
            style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {(isAdmin ? ADMIN_NAV_ITEMS : NAV_ITEMS).map((item) => (
          <NavLink key={item.path} item={item} isActive={currentPath === item.path} collapsed={collapsed} onClick={() => navigate(item.path)} />
        ))}
      </div>

      <div className="p-3 border-t flex-shrink-0 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black"
            style={{ backgroundColor: theme.itemBg, color: theme.text }}>
            {(profile?.display_name || user?.email || "U")[0].toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate dark:text-white" style={{ color: theme.text }}>
                {profile?.display_name || user?.email?.split("@")[0] || "Usuario"}
              </p>
              <p className="text-[11px] font-semibold truncate opacity-60 dark:text-slate-400" style={{ color: theme.secondaryText }}>{user?.email}</p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

function MobileHeader({ onMenuToggle }) {
  const { themeStyles: theme } = useTheme();
  return (
    <div className="lg:hidden flex items-center justify-between px-4 h-14 border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <button onClick={onMenuToggle} className="bg-transparent border-none cursor-pointer p-2 dark:text-white">
        <Menu size={24} />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.accent }}>
          <span className="text-white text-xs font-black">M</span>
        </div>
        <span className="text-base font-black dark:text-white" style={{ color: theme.text }}>MindMood</span>
      </div>
      <div className="w-10" />
    </div>
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

function MobileMenu({ visible, onClose, currentPath, navigate }) {
  const { themeStyles: theme } = useTheme();
  const { profile, user } = useAuth();
  const isAdmin = profile?.role === "admin";
  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/"); };

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-black/60" onClick={onClose} />
          <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="lg:hidden fixed top-0 left-0 bottom-0 w-72 z-50 border-r bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: theme.accent }}>
                  <span className="text-white text-sm font-black">M</span>
                </div>
                <span className="text-lg font-black dark:text-white" style={{ color: theme.text }}>MindMood</span>
              </div>
              <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1">
                <X size={22} color={theme.secondaryText} />
              </button>
            </div>

            <div className="px-3 py-4 space-y-1">
              {(isAdmin ? ADMIN_NAV_ITEMS : NAV_ITEMS).map((item) => {
                const Icon = item.icon;
                const active = currentPath === item.path;
                return (
                  <button key={item.path} onClick={() => { navigate(item.path); onClose(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 border-none cursor-pointer text-left"
                    style={{ backgroundColor: active ? `${theme.accent}18` : "transparent", color: active ? theme.accent : theme.secondaryText }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: active ? `${theme.accent}20` : theme.itemBg }}>
                      <Icon size={20} color={active ? theme.accent : theme.secondaryText} />
                    </div>
                    <span className="text-sm font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-3 px-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black"
                  style={{ backgroundColor: theme.itemBg, color: theme.text }}>
                  {(profile?.display_name || user?.email || "U")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate dark:text-white" style={{ color: theme.text }}>
                    {profile?.display_name || user?.email?.split("@")[0] || "Usuario"}
                  </p>
                  <p className="text-[11px] truncate opacity-60 dark:text-slate-400" style={{ color: theme.secondaryText }}>{user?.email}</p>
                </div>
              </div>
              <button onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-none cursor-pointer font-bold text-sm"
                style={{ backgroundColor: `${theme.error}15`, color: theme.error }}>
                <LogOut size={16} /> Cerrar Sesión
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
      <MobileHeader onMenuToggle={() => setMobileMenuOpen(true)} />
      <MobileMenu visible={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} currentPath={currentPath} navigate={navigate} />

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

      <MobileNav currentPath={currentPath} navigate={navigate} />
    </div>
  );
}
