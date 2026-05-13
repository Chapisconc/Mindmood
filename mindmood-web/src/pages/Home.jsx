import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sun, Moon, Bell, UserCircle, Flame, Calendar, PlusCircle, ChevronRight } from "lucide-react";
import { supabase } from "../services/supabase";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import { getCachedData, setCachedData, cacheKeys } from "../services/cache";
import StreakModal from "../components/StreakModal";
import StreakCalendarModal from "../components/StreakCalendarModal";

export default function Home() {
  const navigate = useNavigate();
  const { theme, themeStyles, toggleTheme } = useTheme();
  const { user, profile } = useAuth();
  const [lastMood, setLastMood] = useState(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showStreakCalendar, setShowStreakCalendar] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  const actionCards = [
    {
      icon: "✍️",
      title: "Nueva Memoria",
      desc: "Descarga tu mente ahora",
      path: "/new-entry",
    },
    {
      icon: "📖",
      title: "Mi Bóveda",
      desc: "Explora tus reflexiones",
      path: "/history",
    },
    {
      icon: "📈",
      title: "Mis Métricas",
      desc: "Análisis de tu energía vital",
      path: "/stats",
    },
  ];

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const cacheKey = cacheKeys.homeData(user.id);
    const cached = await getCachedData(cacheKey);
    if (cached) {
      setUserData(cached.userData);
      setLastMood(cached.lastMood || null);
      setStreakCount(cached.streak || 0);
      setLoading(false);
    }

    setLoading(false);

    try {
      const newUserData = {
        id: user.id,
        email: user.email,
        displayName: (profile && profile.display_name) || (user.email ? user.email.split("@")[0] : "Usuario"),
        streak: (profile && profile.streak) || 0,
      };

      let newLastMood = lastMood;
      const { data: lastEntry } = await supabase
        .from("entries")
        .select("mood")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (lastEntry && lastEntry.length > 0) {
        newLastMood = lastEntry[0].mood;
      }

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

      const cacheData = { userData: newUserData, lastMood: newLastMood, streak };
      await setCachedData(cacheKey, cacheData);
      setUserData(newUserData);
      setLastMood(newLastMood);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Home fetch fail:", error);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getDynamicQuote = () => {
    switch (lastMood) {
      case "Excelente": return "¡Qué gran energía llevas! Sigue construyendo memorias geniales hoy. 🌟";
      case "Feliz": return "Es un buen día para seguir sonriendo y agradecer. 😊";
      case "Agradecido": return "La gratitud es la memoria del corazón. Qué bueno que valoras lo positivo. 🙏";
      case "Sorpresa": return "¡La vida siempre tiene formas de asombrarnos! Mantén esa curiosidad. 😲";
      case "Neutral": return "La calma es el mejor lienzo para empezar a pintar una nueva historia. 🍃";
      case "Triste": return "Recuerda que después de la tormenta siempre sale el sol. Un paso a la vez. ❤️";
      case "Enojo": return "Respira profundo. Es válido sentir ira, pero no dejes que ella maneje el volante. 🧘‍♂️";
      case "Ansiedad": return "Estás a salvo aquí y ahora. Enfócate en tu respiración, todo pasará. 🌊";
      case "Miedo": return "El valor no es la ausencia de miedo, sino actuar a pesar de él. Tú puedes. 🛡️";
      case "Crisis": return "No tienes que pasar por esto a solas. Hay ayuda disponible para ti justo ahora. 🫂";
      default: return "Bienvenido a MindMood. Escribe tu primer registro para empezar a medir tu energía.";
    }
  };

  if (loading && !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: themeStyles.background }}>
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${themeStyles.accent}40`, borderTopColor: themeStyles.accent }} />
      </div>
    );
  }

  const glass = {
    backgroundColor: themeStyles.glassBg,
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderColor: themeStyles.border,
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: themeStyles.background }}>
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-[100px] opacity-[0.08]" style={{ backgroundColor: themeStyles.accent }} />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-[100px] opacity-[0.06]" style={{ backgroundColor: themeStyles.glow }} />
      <div className="max-w-lg mx-auto pb-8 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between px-6 pt-8 pb-5"
        >
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="bg-transparent border-none cursor-pointer flex items-center gap-2">
              {theme === "dark" ? (
                <Sun size={22} color={themeStyles.secondaryText} />
              ) : (
                <Moon size={22} color={themeStyles.secondaryText} />
              )}
            </button>
            <div
              className="w-12 h-6 rounded-full relative cursor-pointer"
              style={{ backgroundColor: theme === "dark" ? themeStyles.glow : themeStyles.border }}
              onClick={toggleTheme}
            >
              <div
                className="w-5 h-5 rounded-full absolute top-[2px] transition-transform duration-200"
                style={{
                  left: theme === "dark" ? "26px" : "2px",
                  backgroundColor: theme === "dark" ? themeStyles.accent : "#F4F3F4",
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/inbox")}
              className="relative bg-transparent border-none cursor-pointer"
            >
              <Bell size={26} color={themeStyles.secondaryText} />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ backgroundColor: "#EF4444", borderColor: themeStyles.background }} />
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center border cursor-pointer"
              style={{
                backgroundColor: themeStyles.glassBg,
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                borderColor: themeStyles.border,
                boxShadow: `0 6px 16px ${themeStyles.shadow}`,
              }}
            >
              <UserCircle size={24} color={themeStyles.secondaryText} />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <button
            onClick={() => setShowStreakCalendar(true)}
            className="w-full mx-5 rounded-3xl mb-6 overflow-hidden cursor-pointer border-none"
            style={{ width: "calc(100% - 40px)" }}
          >
            <div
              className="flex items-center justify-between p-6"
              style={{
                background: `linear-gradient(90deg, ${themeStyles.accentGradient[0]}, ${themeStyles.accentGradient[1]}, ${themeStyles.accentGradient[2]})`,
              }}
            >
              <div className="flex items-center">
                <Flame size={38} color="#FFF" />
                <div className="ml-4 text-left">
                  <p className="text-[32px] font-black text-white tracking-tight">
                    {(userData && userData.streak) || 0} días
                  </p>
                  <p className="text-[13px] font-bold text-white/85">Racha actual</p>
                </div>
              </div>
              <Calendar size={26} color="rgba(255,255,255,0.8)" />
            </div>
          </button>
        </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mx-5 p-6 rounded-3xl mb-7 border relative overflow-hidden"
            style={{
              ...glass,
              boxShadow: `0 8px 32px ${themeStyles.shadow}`,
            }}
          >
            <div
              className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[60px] opacity-25"
              style={{ backgroundColor: themeStyles.accent }}
            />
            <p
              className="text-[11px] font-black uppercase tracking-[1.5px] mb-3 relative"
              style={{ color: themeStyles.error }}
            >
              ✦ Tu luz hoy
            </p>
            <p
              className="text-[17px] leading-7 font-medium italic relative"
              style={{ color: themeStyles.text }}
            >
              {getDynamicQuote()}
            </p>
          </motion.div>

        <p className="text-xl font-extrabold px-6 mb-4 tracking-tight" style={{ color: themeStyles.text }}>
          Acciones Rápidas
        </p>
        <div className="px-5 pb-10">
          {actionCards.map((card, i) => (
            <motion.div
              key={card.path}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.4 + i * 0.1 }}
            >
              <button
                onClick={() => navigate(card.path)}
                className="w-full flex items-center p-5 rounded-[22px] mb-3.5 border cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  ...glass,
                  backgroundColor: themeStyles.glassBg,
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  boxShadow: `0 8px 24px ${themeStyles.shadow}`,
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mr-4"
                  style={{ backgroundColor: themeStyles.softAccent }}
                >
                  <span className="text-[26px]">{card.icon}</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base font-extrabold mb-1 tracking-tight" style={{ color: themeStyles.text }}>
                    {card.title}
                  </p>
                  <p className="text-sm font-medium" style={{ color: themeStyles.secondaryText }}>
                    {card.desc}
                  </p>
                </div>
                {card.path === "/new-entry" ? (
                  <PlusCircle size={34} color="#EC4899" />
                ) : (
                  <ChevronRight size={26} color={themeStyles.glow} />
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <StreakModal visible={showStreakModal} streak={streakCount} onClose={() => setShowStreakModal(false)} />
      <StreakCalendarModal visible={showStreakCalendar} userId={userData?.id || null} onClose={() => setShowStreakCalendar(false)} />
    </div>
  );
}
