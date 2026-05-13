import React from 'react';
import { motion } from 'motion/react';
import { User, Mail, Shield, Moon, Sun, LogOut, ChevronRight, Bookmark, Settings, Bell, Palette } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { cn } from '../lib/utils.ts';

export default function ProfilePage() {
  const { user, logout, toggleTheme } = useAuth();

  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto space-y-8 pb-24"
    >
      <header className="flex flex-col items-center text-center space-y-4 pt-8">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full ring-4 ring-indigo-500 ring-offset-4 ring-offset-slate-50 dark:ring-offset-slate-900 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-5xl font-black text-slate-400 group-hover:scale-105 transition-transform duration-300">
            {user.displayName[0]}
          </div>
          <button className="absolute bottom-1 right-1 p-2 bg-indigo-600 rounded-full text-white shadow-xl border-2 border-slate-50 dark:border-slate-900 hover:bg-indigo-500 transition-all">
            <Palette className="w-4 h-4" />
          </button>
        </div>
        <div>
          <h1 className="text-3xl font-black dark:text-white tracking-tight">{user.displayName}</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">{user.email}</span>
          </div>
        </div>
        <div className="flex gap-2">
           <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black uppercase tracking-wider border border-indigo-200 dark:border-indigo-900/50">
             Usuario Pro
           </span>
           {user.role === 'admin' && (
             <span className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full text-xs font-black uppercase tracking-wider border border-rose-200 dark:border-rose-900/50">
               Administrador
             </span>
           )}
        </div>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <StatItem label="Registros" value="48" />
        <StatItem label="Racha" value="12🔥" />
        <StatItem label="Mood" value="Feliz" />
      </div>

      <section className="space-y-4">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2">Configuración Personal</h2>
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
          <MenuButton 
            icon={user.theme === 'light' ? Moon : Sun} 
            label="Modo Visual" 
            sub={user.theme === 'light' ? 'Actualmente: Claro' : 'Actualmente: Oscuro'}
            onClick={toggleTheme}
          />
          <MenuButton 
            icon={Bell} 
            label="Notificaciones" 
            sub="Recordatorios diarios habilitados"
          />
          <MenuButton 
            icon={Bookmark} 
            label="Guías Guardadas" 
            sub="3 artículos de interés"
          />
          <MenuButton 
            icon={Settings} 
            label="Seguridad" 
            sub="Contraseña cambiada hace 2 meses"
          />
          <MenuButton 
            icon={LogOut} 
            label="Cerrar Sesión" 
            sub="Seguro volverás pronto"
            danger
            onClick={logout}
          />
        </div>
      </section>

      <div className="text-center pb-10">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MindMood v1.0.4 • 2026</p>
      </div>
    </motion.div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm text-center">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-black dark:text-white">{value}</p>
    </div>
  );
}

function MenuButton({ icon: Icon, label, sub, danger, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border-b last:border-0 border-slate-100 dark:border-slate-700 group text-left",
        danger ? "text-rose-500" : "text-slate-800 dark:text-white"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
          danger ? "bg-rose-50 dark:bg-rose-900/20" : "bg-slate-50 dark:bg-slate-900/30"
        )}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="font-bold">{label}</p>
          <p className="text-xs text-slate-400 font-medium group-hover:text-slate-500 transition-colors">{sub}</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300" />
    </button>
  );
}
