import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, Bell, Sun, Sparkles, CloudRain, Waves, Zap, HeartHandshake, Ghost, Wind, Frown, AlertTriangle, HelpCircle } from "lucide-react";
import { supabase } from "../services/supabase";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import StreakModal from "../components/StreakModal";
import StreakCalendarModal from "../components/StreakCalendarModal";

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

          <div className="flex items-center gap-3">
          <button onClick={() => navigate("/inbox")} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-4 md:p-5 rounded-[2rem] flex items-center justify-center border border-white/20 dark:border-slate-800 shadow-2xl hover:scale-105 transition-transform">
            <Bell className="w-6 h-6 md:w-7 md:h-7 text-slate-600 dark:text-slate-300" />
          </button>
          <div onClick={() => setShowStreakCalendar(true)} className="cursor-pointer bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] flex items-center gap-4 border border-white/20 dark:border-slate-800 shadow-2xl">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-tr from-orange-400 to-rose-400 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Flame className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Streak</p>
              <p className="font-black text-slate-900 dark:text-white text-xl md:text-2xl leading-none">{(userData && userData.streak) || 0} Días</p>
            </div>
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


      </div>

      <StreakModal visible={showStreakModal} streak={streakCount} onClose={() => setShowStreakModal(false)} />
      <StreakCalendarModal visible={showStreakCalendar} userId={userData?.id || null} onClose={() => setShowStreakCalendar(false)} />
    </div>
  );
}
