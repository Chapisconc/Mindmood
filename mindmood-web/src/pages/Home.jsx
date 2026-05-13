import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, ChevronRight, TrendingUp, BarChart3, PieChart as PieChartIcon, Fingerprint, Sun, Sparkles, CloudRain, Waves, Zap, HeartHandshake, Ghost, Wind, Frown, AlertTriangle, HelpCircle } from "lucide-react";
import { supabase } from "../services/supabase";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { getCachedData, setCachedData, cacheKeys } from "../services/cache";
import StreakModal from "../components/StreakModal";
import StreakCalendarModal from "../components/StreakCalendarModal";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const MOODS = [
  { id: "excelente", name: "Excelente", color: "#10B981", icon: Sparkles },
  { id: "feliz", name: "Feliz", color: "#F472B6", icon: Sun },
  { id: "agradecido", name: "Agradecido", color: "#FBBF24", icon: HeartHandshake },
  { id: "sorpresa", name: "Sorpresa", color: "#22D3EE", icon: Zap },
  { id: "neutral", name: "Neutral", color: "#818CF8", icon: Waves },
  { id: "enojo", name: "Enojo", color: "#FB923C", icon: Flame },
  { id: "ansiedad", name: "Ansiedad", color: "#A78BFA", icon: Wind },
  { id: "miedo", name: "Miedo", color: "#C084FC", icon: Ghost },
  { id: "triste", name: "Triste", color: "#FB7185", icon: CloudRain },
  { id: "asco", name: "Asco", color: "#A3E635", icon: Frown },
  { id: "crisis", name: "Crisis", color: "#F87171", icon: AlertTriangle },
];

export default function Home() {
  const navigate = useNavigate();
  const { theme, themeStyles } = useTheme();
  const { user, profile } = useAuth();
  const [lastMood, setLastMood] = useState(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showStreakCalendar, setShowStreakCalendar] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(false);
    try {
      const newUserData = {
        id: user.id, email: user.email,
        displayName: (profile && profile.display_name) || (user.email ? user.email.split("@")[0] : "Usuario"),
        streak: (profile && profile.streak) || 0,
      };
      let newLastMood = lastMood;
      const { data: lastEntry } = await supabase.from("entries").select("mood").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1);
      if (lastEntry && lastEntry.length > 0) newLastMood = lastEntry[0].mood;
      const streak = (profile && profile.streak) || 0;
      if (streak > 0) {
        setStreakCount(streak);
        const lastShown = localStorage.getItem(`streak_shown_${user.id}`);
        const today = new Date().toLocaleDateString();
        if (lastShown !== today) {
          setShowStreakModal(true);
          localStorage.setItem(`streak_shown_${user.id}`, today);
        }
      }
      setUserData(newUserData);
      setLastMood(newLastMood);
    } catch (error) { if (import.meta.env.DEV) console.error("Home fetch fail:", error); }
  }, [user, profile]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-12 py-6 lg:py-12 relative z-10 space-y-12 pb-24 lg:pb-0">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-4">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter dark:text-white leading-none">
              Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-500">{(userData && userData.displayName.split(" ")[0]) || "viajero"}</span>
            </h1>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-base md:text-lg italic">¿En qué frecuencia vibramos hoy?</p>
          </div>

          <div onClick={() => setShowStreakCalendar(true)} className="cursor-pointer bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] flex items-center gap-4 border border-white/20 dark:border-slate-800 shadow-2xl">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-tr from-orange-400 to-rose-400 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Flame className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Streak</p>
              <p className="font-black text-slate-900 dark:text-white text-xl md:text-2xl leading-none">{(userData && userData.streak) || 0} Días</p>
            </div>
          </div>
        </header>

        <section className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] md:text-xs font-black dark:text-white uppercase tracking-[0.3em] flex items-center gap-3">
              Registrar Estado <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            </h2>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Análisis por IA</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {MOODS.map((mood) => {
              const Icon = mood.icon;
              return (
                <motion.button
                  key={mood.id}
                  whileHover={{ y: -8, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/new-entry?mood=${mood.id}`)}
                  className="group relative flex flex-col items-center justify-center p-6 md:p-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] md:rounded-[3rem] border border-white/20 dark:border-slate-800 shadow-xl transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute -top-10 -right-10 w-20 h-20 blur-[40px] opacity-20 transition-opacity group-hover:opacity-40" style={{ backgroundColor: mood.color }} />
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[2rem] flex items-center justify-center mb-4 transition-transform duration-500 group-hover:rotate-12 shadow-2xl" style={{ backgroundColor: mood.color }}>
                    <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <span className="font-black text-[10px] md:text-xs uppercase tracking-wider text-slate-800 dark:text-white mb-1 text-center">{mood.name}</span>
                </motion.button>
              );
            })}
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div className="p-8 lg:p-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] lg:rounded-[3.5rem] shadow-2xl border border-white/20 dark:border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <TrendingUp className="w-32 h-32" />
            </div>
            <div className="relative space-y-6">
              <div>
                <h3 className="text-2xl font-black dark:text-white tracking-tighter">Bitácora Semanal</h3>
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-1">Índice de Bienestar Energético</p>
              </div>
              <div className="flex items-end justify-between gap-4 h-32">
                {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => {
                  const height = [40, 60, 45, 80, 55, 90, 75][i];
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                      <div className="w-full relative h-32 bg-slate-100 dark:bg-slate-800/50 rounded-2xl overflow-hidden">
                        <motion.div initial={{ height: 0 }} animate={{ height: `${height}%` }} transition={{ duration: 1, type: "spring" }} className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-500 to-fuchsia-500 rounded-2xl" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{d}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div className="p-8 lg:p-10 bg-slate-950 rounded-[3rem] lg:rounded-[3.5rem] shadow-2xl text-white relative overflow-hidden group" onClick={() => navigate("/history")}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-amber-600 opacity-60 group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-3xl" />
            <div className="relative flex flex-col h-full space-y-6 min-h-[200px] cursor-pointer">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-2xl border border-white/20">
                <Fingerprint className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-4xl font-black tracking-tighter mb-4 leading-tight">Tu Ecosistema Emocional</h3>
                <p className="text-white/60 text-sm font-medium leading-relaxed max-w-xs">Hemos procesado tus datos. Estás vibrando en frecuencias de alta productividad este mes.</p>
              </div>
              <div className="mt-auto">
                <button onClick={(e) => { e.stopPropagation(); navigate("/history"); }} className="w-full bg-white text-slate-950 py-5 rounded-3xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:translate-x-1 transition-all shadow-2xl active:scale-95">
                  Abrir Archivo <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <StreakModal visible={showStreakModal} streak={streakCount} onClose={() => setShowStreakModal(false)} />
      <StreakCalendarModal visible={showStreakCalendar} userId={userData?.id || null} onClose={() => setShowStreakCalendar(false)} />
    </div>
  );
}
