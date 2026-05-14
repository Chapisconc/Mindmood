/* ==========================================================================
   Layout.jsx — ESTRUCTURA PRINCIPAL DE NAVEGACIÓN de MindMood
   Provee el layout global para las rutas protegidas:
   - Sidebar fijo a la izquierda (lg+)
   - BottomNav inferior (móvil)
   - Contenido principal con animaciones de transición entre páginas
   - Redirección de administradores al dashboard
   - Redirección al login si no hay sesión
   ========================================================================== */

// React: lazy loading, Suspense para carga diferida de páginas
import { lazy, Suspense, useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

// Framer Motion: animaciones de entrada/salida entre rutas
import { motion, AnimatePresence } from "framer-motion";

// Íconos de la navegación (lucide-react)
import {
  PlusCircle, BookOpen, TrendingUp, UserCircle, Home,
  LogOut, Sun, Moon,
} from "lucide-react";

// Contextos y hooks personalizados
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../services/supabase";

/* Páginas cargadas bajo demanda para reducir el bundle */
const HomePage = lazy(() => import("../pages/Home"));
const NewEntry = lazy(() => import("../pages/NewEntry"));
const History = lazy(() => import("../pages/History"));
const Stats = lazy(() => import("../pages/Stats"));
const Profile = lazy(() => import("../pages/Profile"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const Inbox = lazy(() => import("../pages/Inbox"));

/**
 * NAV_ITEMS — Definición de las rutas principales de navegación.
 * Cada ítem tiene: ruta (path), componente de ícono y etiqueta.
 */
const NAV_ITEMS = [
  { path: "/home", icon: Home, label: "Inicio" },
  { path: "/new-entry", icon: PlusCircle, label: "Entrada" },
  { path: "/history", icon: BookOpen, label: "Historial" },
  { path: "/stats", icon: TrendingUp, label: "Estadísticas" },
  { path: "/profile", icon: UserCircle, label: "Perfil" },
];

/**
 * Sidebar — Barra lateral izquierda (visible en lg+).
 * Muestra el logo, los ítems de navegación, botón de tema
 * y botón de cerrar sesión.
 * Los administradores ven una versión simplificada.
 *
 * @prop {string}   currentPath — Ruta activa actual
 * @prop {Function} navigate    — Función de navegación de react-router
 */
function Sidebar({ currentPath, navigate }) {
  const { themeStyles, theme, toggleTheme } = useTheme();
  const { profile, user } = useAuth();
  const isAdmin = profile?.role === "admin";

  /**
   * handleLogout — Cierra la sesión en Supabase y redirige al login.
   */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Animación de entrada deslizándose desde la izquierda
  return (
    <motion.aside
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 z-40 border-r bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
    >
      {/* Botón del logo que redirige al inicio */}
      <button onClick={() => navigate("/home")} className="w-full flex items-center gap-3 px-6 h-16 border-b flex-shrink-0 border-slate-200 dark:border-slate-800 bg-transparent cursor-pointer hover:opacity-80 transition-opacity">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: themeStyles.accent }}>
          <span className="text-white text-base font-black">M</span>
        </div>
        <span className="text-lg font-black tracking-tight dark:text-white" style={{ color: themeStyles.text }}>MindMood</span>
      </button>

      {/* Lista de ítems de navegación principal */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all border-none cursor-pointer text-left"
              style={{
                backgroundColor: active ? `${themeStyles.accent}18` : "transparent",
                color: active ? themeStyles.accent : themeStyles.secondaryText,
              }}
            >
              {/* Contenedor del ícono con fondo dinámico */}
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: active ? themeStyles.accent : themeStyles.itemBg }}>
                <Icon size={18} color={active ? "#fff" : themeStyles.secondaryText} />
              </div>
              <span className="text-sm font-black">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Acciones inferiores: cambio de tema y cerrar sesión (solo no-admin) */}
      {!isAdmin && (
        <div className="px-4 space-y-1.5 pb-4">
          {/* Botón de alternar tema claro/oscuro */}
          <button onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border-none cursor-pointer"
            style={{ color: themeStyles.secondaryText }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: themeStyles.itemBg }}>
              {theme === "dark" ? <Sun size={16} color="#FBBF24" /> : <Moon size={16} color="#6366F1" />}
            </div>
            <span className="text-xs font-bold">{theme === "dark" ? "Modo Claro" : "Modo Oscuro"}</span>
          </button>
          {/* Botón de cerrar sesión */}
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border-none cursor-pointer"
            style={{ color: themeStyles.secondaryText }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: themeStyles.itemBg }}>
              <LogOut size={16} color={themeStyles.secondaryText} />
            </div>
            <span className="text-xs font-bold">Cerrar Sesión</span>
          </button>
        </div>
      )}
    </motion.aside>
  );
}

/**
 * BottomNav — Barra de navegación inferior (visible en móvil, lg:hidden).
 * Mismos ítems que el Sidebar pero en formato compacto horizontal.
 *
 * @prop {string}   currentPath — Ruta activa actual
 * @prop {Function} navigate    — Función de navegación de react-router
 */
function BottomNav({ currentPath, navigate }) {
  const { themeStyles: theme } = useTheme();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F8FAFC] dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom,4px)]">
      <div className="flex items-center justify-around px-1 py-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl border-none bg-transparent cursor-pointer transition-all min-w-0"
            >
              {/* Ícono con fondo si está activo */}
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: active ? `${theme.accent}18` : "transparent" }}>
                <Icon size={16} color={active ? theme.accent : theme.secondaryText} />
              </div>
              {/* Etiqueta en minúsculas compactas */}
              <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: active ? theme.accent : theme.secondaryText }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * LoadingFallback — Spinner mostrado mientras se cargan páginas lazy.
 */
function LoadingFallback() {
  const { themeStyles: theme } = useTheme();
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${theme.accent}40`, borderTopColor: theme.accent }} />
    </div>
  );
}

/**
 * Layout — Componente principal exportado.
 * Verifica autenticación, redirige admins, y renderiza
 * Sidebar + contenido animado + BottomNav.
 */
export default function Layout() {
  const { theme, themeStyles } = useTheme();
  const { user, profile, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  /**
   * useEffect — Redirige a los administradores al dashboard
   * automáticamente si no están ya en rutas de admin o perfil.
   * Dependencias: profile?.role, user, currentPath, navigate.
   */
  useEffect(() => {
    if (profile?.role === "admin" && user && !["/admin-dashboard", "/profile"].includes(currentPath)) {
      navigate("/admin-dashboard", { replace: true });
    }
  }, [profile?.role, user, currentPath, navigate]);

  /* Mientras se verifica la autenticación, muestra un spinner */
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
      </div>
    );
  }

  /* Si no hay usuario autenticado, redirige al login */
  if (!user) return <Navigate to="/" replace />;

  /* Detecta si la ruta actual pertenece al panel de administración */
  const isAdminRoute = currentPath === "/admin-dashboard" || currentPath.startsWith("/admin-dashboard/");

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
      {/* Sidebar visible solo en rutas no-admin */}
      {!isAdminRoute && <Sidebar currentPath={currentPath} navigate={navigate} />}

      {/* Contenido principal con margen izquierdo para el sidebar */}
      <div className={`transition-all duration-200 lg:ml-64`} style={{ paddingBottom: isAdminRoute ? "0px" : "64px" }}>
        <div className="max-w-6xl mx-auto">
          {/* AnimatePresence: anima la transición entre rutas */}
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
                  {/* Ruta comodín: redirige según el rol */}
                  <Route path="*" element={<Navigate to={profile?.role === "admin" ? "/admin-dashboard" : "/home"} replace />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* BottomNav visible solo en rutas no-admin */}
      {!isAdminRoute && <BottomNav currentPath={currentPath} navigate={navigate} />}
    </div>
  );
}
