import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ChevronRight, Clock, Sparkles, Sun, HeartHandshake, Zap, Waves, Flame, Wind, Ghost, CloudRain, Frown, AlertTriangle, HelpCircle, BookOpen } from "lucide-react";
import { supabase } from "../services/supabase";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { getCachedData, setCachedData, cacheKeys } from "../services/cache";

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

const ICON_MAP = { Sparkles, Sun, HeartHandshake, Zap, Waves, Flame, Wind, Ghost, CloudRain, Frown, AlertTriangle, HelpCircle };

export default function History() {
  const navigate = useNavigate();
  const { themeStyles } = useTheme();
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchHistory = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data, error } = await supabase.from("entries").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error("History fetch error:", error);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const filteredEntries = activeFilter === "all" ? entries : entries.filter(e => {
    const mood = MOODS.find(m => m.name.toLowerCase() === (e.mood || "").toLowerCase());
    return mood?.id === activeFilter;
  });

  if (loading) {
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

      <div className="max-w-7xl mx-auto px-4 lg:px-12 py-6 lg:py-12 relative z-10 space-y-8 pb-24">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight dark:text-white">Cápsula del Tiempo</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Tus momentos, ordenados por emoción.</p>
          </div>
        </header>

        <section className="flex gap-2 overflow-x-auto pb-4 snap-x">
          <button onClick={() => setActiveFilter("all")} className={`px-6 py-3 rounded-full font-bold text-sm transition-all shrink-0 snap-start ${activeFilter === "all" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800"}`}>
            Todos
          </button>
          {MOODS.map(mood => (
            <button
              key={mood.id}
              onClick={() => setActiveFilter(mood.id)}
              className={`px-6 py-3 rounded-full font-bold text-sm transition-all shrink-0 snap-start flex items-center gap-2 ${activeFilter === mood.id ? "shadow-md text-white" : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}
              style={activeFilter === mood.id ? { backgroundColor: mood.color } : {}}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeFilter === mood.id ? "white" : mood.color }} />
              {mood.name}
            </button>
          ))}
        </section>

        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center pt-20">
            <BookOpen className="w-20 h-20 mb-7 opacity-30 text-slate-300 dark:text-slate-600" />
            <p className="text-[26px] font-black text-center dark:text-white">Bóveda vacía</p>
            <p className="text-[17px] text-center mt-3 font-semibold text-slate-400">Tus reflexiones guardadas aparecerán aquí.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredEntries.map((entry, idx) => {
              const moodObj = MOODS.find(m => m.name.toLowerCase() === (entry.mood || "").toLowerCase()) || MOODS[4];
              const Icon = ICON_MAP[moodObj.icon.name] || HelpCircle;
              const dateObj = new Date(entry.created_at);
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-slate-900/40 rounded-full -translate-y-1/2 translate-x-1/2 p-4 flex items-end justify-start opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icon className="w-8 h-8" style={{ color: moodObj.color }} />
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl min-w-[100px]">
                      <span className="text-xs font-black uppercase text-indigo-500">{dateObj.toLocaleDateString(undefined, { month: "short" })}</span>
                      <span className="text-2xl font-black dark:text-white leading-none">{dateObj.getDate()}</span>
                      <span className="text-[10px] font-bold text-slate-400 mt-1">{dateObj.getFullYear()}</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-sm" style={{ backgroundColor: moodObj.color }}>
                          {moodObj.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase">{dateObj.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                      <p className="text-slate-800 dark:text-slate-100 font-medium line-clamp-2 leading-relaxed">"{entry.text}"</p>
                    </div>
                    <div className="hidden md:block">
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
