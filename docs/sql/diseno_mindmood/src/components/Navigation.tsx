import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Compass, 
  Plus, 
  Archive, 
  Activity, 
  ShieldCheck, 
  User as UserIcon, 
  ChevronRight,
  Power,
  Moon,
  Sun,
  MonitorDot,
  Fingerprint,
  Zap,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { cn } from '../lib/utils.ts';

const navItems = [
  { path: '/home', icon: Compass, label: 'Descubrir' },
  { path: '/new-entry', icon: Plus, label: 'Registrar' },
  { path: '/history', icon: Archive, label: 'Bitácora' },
  { path: '/stats', icon: Activity, label: 'Métricas' },
];

export function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (val: boolean) => void }) {
  const { user, logout, toggleTheme } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isAdminPanel = location.pathname === '/admin-dashboard';

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 100 : 280 }}
      className={cn(
        "hidden lg:flex flex-col h-screen transition-colors duration-500 z-20 overflow-hidden relative",
        isAdminPanel 
          ? "bg-slate-950 border-r border-slate-800" 
          : "bg-white/40 dark:bg-slate-950/40 backdrop-blur-3xl border-r border-white/20 dark:border-slate-900 shadow-2xl"
      )}
    >
      {/* Background Glow */}
      <div className="absolute top-0 -left-20 w-40 h-80 bg-indigo-500/10 blur-[100px] pointer-events-none" />
      
      <div className="p-8 flex items-center justify-between relative">
        <div className="flex items-center gap-4 overflow-hidden">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shrink-0 shadow-lg",
            isAdminPanel ? "bg-emerald-500 shadow-emerald-500/20" : "bg-gradient-to-tr from-indigo-600 to-fuchsia-600 shadow-indigo-500/20"
          )}>
            {isAdminPanel ? <ShieldCheck className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <span className={cn("font-black text-2xl tracking-normal leading-none", isAdminPanel ? "text-white" : "text-slate-900 dark:text-white")}>
                MindMood
              </span>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40 leading-none mt-1 dark:text-white">
                {isAdminPanel ? 'Command Center' : 'Vibe Studio'}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-6 space-y-3 mt-10 relative">
        {(isAdminPanel ? [] : navItems).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 p-4 rounded-3xl transition-all group relative overflow-hidden",
                isActive 
                  ? "bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-black/20 text-indigo-600 dark:text-indigo-400" 
                  : "text-slate-500 dark:text-slate-400 hover:translate-x-1"
              )}
            >
              <item.icon className={cn("w-6 h-6 shrink-0 transition-transform duration-300", isActive && "scale-110")} />
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-black text-sm uppercase tracking-widest">
                  {item.label}
                </motion.span>
              )}
              {isActive && (
                <motion.div 
                  layoutId="activeTabGlow"
                  className="absolute inset-0 bg-indigo-500/5 pointer-events-none"
                />
              )}
            </Link>
          );
        })}

        {user.role === 'admin' && (
          <Link
            to={isAdminPanel ? '/home' : '/admin-dashboard'}
            className={cn(
              "flex items-center gap-4 p-4 rounded-3xl transition-all group relative border-2 mt-10",
              isAdminPanel 
                ? "bg-emerald-500 text-white border-transparent shadow-lg shadow-emerald-500/20" 
                : "border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/5"
            )}
          >
            {isAdminPanel ? <MonitorDot className="w-6 h-6 shrink-0" /> : <ShieldCheck className="w-6 h-6 shrink-0" />}
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-black text-sm uppercase tracking-widest">
                {isAdminPanel ? 'Volver al App' : 'Consola Admin'}
              </motion.span>
            )}
          </Link>
        )}
      </nav>

      <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4 relative">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-4 w-full p-4 rounded-3xl text-slate-400 hover:text-indigo-500 transition-all font-black uppercase text-[10px] tracking-widest"
        >
          {user.theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
          {!collapsed && <span>Ajustar Luz</span>}
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-4 w-full p-4 rounded-3xl text-rose-400 hover:bg-rose-500/5 transition-all font-black uppercase text-[10px] tracking-widest"
        >
          <Power className="w-6 h-6" />
          {!collapsed && <span>Desconectar</span>}
        </button>
      </div>

      <div className="p-8 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1.5rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 shrink-0 border border-white/20">
            {user.displayName[0]}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-black text-xs uppercase tracking-wider dark:text-white truncate">{user.displayName}</span>
              <div className="flex items-center gap-1 opacity-50">
                <Fingerprint className="w-2 h-2 dark:text-white" />
                <span className="text-[8px] text-slate-500 truncate uppercase tracking-tighter">{user.email}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

export function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const items = [
    { path: '/home', icon: Compass },
    { path: '/new-entry', icon: Plus },
    { path: '/history', icon: Archive },
    { path: '/stats', icon: Activity },
    { path: '/profile', icon: UserIcon },
  ];

  return (
    <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/20 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-around px-4 z-50 shadow-2xl">
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link key={item.path} to={item.path} className="relative p-3">
            <item.icon className={cn(
              "w-7 h-7 transition-all duration-300",
              isActive ? "text-indigo-600 dark:text-indigo-400 scale-125" : "text-slate-400 dark:text-slate-500"
            )} />
            {isActive && (
              <motion.div 
                layoutId="navPill"
                className="absolute inset-0 bg-indigo-500/10 rounded-2xl -z-10"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileHeader() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <header className="lg:hidden h-20 bg-[#F8FAFC]/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 px-8 flex items-center justify-between z-40">
      <div className="flex items-center gap-3">
        <div className="bg-slate-950 dark:bg-white w-10 h-10 rounded-2xl flex items-center justify-center text-white dark:text-slate-900 text-sm font-black shadow-lg">
          <Sparkles className="w-5 h-5" />
        </div>
        <span className="font-black text-2xl tracking-normal dark:text-white">MindMood</span>
      </div>
      <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
         <Zap className="w-5 h-5 text-indigo-500" />
      </div>
    </header>
  );
}
