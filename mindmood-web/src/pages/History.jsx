import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { supabase } from "../services/supabase";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { getCachedData, setCachedData, cacheKeys } from "../services/cache";

const EMOTION_COLORS = {
  Excelente: "#10B981", Feliz: "#EC4899", Agradecido: "#FBBF24",
  Sorpresa: "#06B6D4", Neutral: "#A78BFA", Enojo: "#F97316",
  Ansiedad: "#8B5CF6", Miedo: "#7C3AED", Triste: "#F43F5E", Crisis: "#EF4444",
  Asco: "#84CC16", Indeterminado: "#64748B",
};

const EMOJI_MAP = {
  Excelente: "🤩", Feliz: "😊", Agradecido: "🙏", Sorpresa: "😲",
  Neutral: "😐", Enojo: "😠", Ansiedad: "😰", Miedo: "😨",
  Triste: "😢", Crisis: "🆘", Asco: "🤢",
};

export default function History() {
  const navigate = useNavigate();
  const { themeStyles } = useTheme();
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchHistory = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    const cacheKey = cacheKeys.historyEntries(user.id);
    if (!forceRefresh) {
      const cached = await getCachedData(cacheKey);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setEntries(cached);
        setLoading(false);
        return;
      }
    }

    try {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const entriesData = data || [];
      setEntries(entriesData);
      await setCachedData(cacheKey, entriesData);
    } catch (error) {
      if (import.meta.env.DEV) console.error("History fetch error:", error);
      const cached = await getCachedData(cacheKey);
      if (cached && Array.isArray(cached)) {
        setEntries(cached);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory(true);
  }, [fetchHistory]);

  const getEmoji = (mood) => EMOJI_MAP[mood] || "😐";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: themeStyles.background }}>
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${themeStyles.accent}40`, borderTopColor: themeStyles.accent }} />
      </div>
    );
  }

  const glass = { backgroundColor: themeStyles.glassBg, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderColor: themeStyles.border };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: themeStyles.background }}>
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-[100px] opacity-[0.06]" style={{ backgroundColor: themeStyles.accent }} />
      <div className="max-w-lg mx-auto pb-10 relative z-10">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <button
            onClick={() => navigate("/home")}
            className="bg-transparent border-none cursor-pointer px-6 pt-8 pb-2 flex items-center gap-2"
          >
            <ArrowLeft size={24} color={themeStyles.secondaryText} />
            <span className="text-sm font-bold" style={{ color: themeStyles.secondaryText }}>Volver</span>
          </button>
        </motion.div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-10 pt-20">
            <span className="text-[80px] mb-7">📖</span>
            <p className="text-[26px] font-black text-center" style={{ color: themeStyles.text }}>Bóveda vacía</p>
            <p className="text-[17px] text-center mt-3 font-semibold" style={{ color: themeStyles.secondaryText }}>
              Tus reflexiones guardadas aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="px-5 pt-4 pb-20">
            {entries.map((item, i) => {
              const dateObj = new Date(item.created_at);
              const dateStr = dateObj.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
              const timeStr = dateObj.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: true });
              const primaryEmotion = item.emotion ?? item.mood;
              let sortedMoods = [];
              if (item.distribution && Object.keys(item.distribution).length > 0) {
                sortedMoods = Object.entries(item.distribution).sort((a, b) => b[1] - a[1]);
              } else {
                sortedMoods = [[primaryEmotion, 100]];
              }
              const emotionColor = EMOTION_COLORS[primaryEmotion] || themeStyles.accent;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="p-6 rounded-3xl mb-5 border-[1.5px]"
                  style={{
                    borderLeftColor: emotionColor,
                    borderLeftWidth: 4,
                    ...glass,
                    boxShadow: `0 8px 24px ${themeStyles.shadow}`,
                  }}
                >
                  <div className="flex justify-between items-start mb-4 pb-3"
                    style={{ borderBottom: "1px solid rgba(124, 58, 237, 0.1)" }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar size={14} color={themeStyles.secondaryText} />
                        <span className="text-[13px] font-extrabold uppercase" style={{ color: themeStyles.secondaryText }}>
                          {dateStr}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={14} color="#EC4899" />
                        <span className="text-xs font-black" style={{ color: themeStyles.glow }}>
                          {timeStr}
                        </span>
                      </div>
                      <div
                        className="inline-block px-2.5 py-1.5 rounded-xl border text-[11px] font-extrabold uppercase tracking-[0.5px]"
                        style={{
                          backgroundColor: isOnline ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          borderColor: isOnline ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)",
                          color: isOnline ? "#10B981" : "#EF4444",
                        }}
                      >
                        {isOnline ? "En línea" : "Offline"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[28px] mb-0.5">{getEmoji(primaryEmotion)}</span>
                      <span className="text-[11px] font-black uppercase tracking-[0.5px]" style={{ color: themeStyles.text }}>
                        {primaryEmotion}
                      </span>
                    </div>
                  </div>

                  <p className="text-[17px] leading-7 font-medium mb-4" style={{ color: themeStyles.text }}>
                    {item.text}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {sortedMoods.map(([name]) => (
                      <span
                        key={name}
                        className="px-3 py-1.5 rounded-xl border text-[11px] font-extrabold uppercase"
                        style={{
                          backgroundColor: name === primaryEmotion ? "rgba(236, 72, 153, 0.15)" : "rgba(124, 58, 237, 0.08)",
                          borderColor: name === primaryEmotion ? "rgba(236, 72, 153, 0.3)" : "rgba(124, 58, 237, 0.15)",
                          color: name === primaryEmotion ? themeStyles.glow : themeStyles.secondaryText,
                        }}
                      >
                        {name === primaryEmotion ? `✨ ${name}` : name}
                      </span>
                    ))}
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
