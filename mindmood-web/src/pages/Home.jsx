/* ======================================================
   FILE: Home.jsx  —  Página principal del dashboard
   Ruta:  /home
   Auth:  Requiere usuario autenticado
   Propósito: Panel principal tras login, muestra saludo
              personalizado, racha (streak), notificaciones
              y acceso a nueva entrada.
   ====================================================== */

// React hooks: estado, efectos secundarios, memoización de callbacks
import { useState, useEffect, useCallback } from "react";
// Navegación programática entre rutas
import { useNavigate } from "react-router-dom";
// Animaciones de entrada y transiciones
import { motion } from "framer-motion";
// Iconos: racha, campana, destellos, pluma, corazón, etc.
import { Flame, Bell, Sparkles, PenLine, Heart, MessageCircle, BarChart3, CalendarDays } from "lucide-react";
// Cliente Supabase para consultas a la BD
import { supabase } from "../services/supabase";
// Hook personalizado del tema (claro/oscuro)
import { useTheme } from "../theme/ThemeContext";
// Hook personalizado de autenticación (usuario y perfil)
import { useAuth } from "../hooks/useAuth";
// Modal de celebración de racha (streak)
import StreakModal from "../components/StreakModal";
// Modal de calendario visual de racha
import StreakCalendarModal from "../components/StreakCalendarModal";

export default function Home() {
  // Hook de navegación para redirigir a otras pantallas
  const navigate = useNavigate();
  // Tema actual y estilos del tema
  const { theme, themeStyles } = useTheme();
  // Datos del usuario autenticado y su perfil (display_name, streak, etc.)
  const { user, profile } = useAuth();

  /* ---------- Estados de la UI ---------- */
  const [showStreakModal, setShowStreakModal] = useState(false);           // Controla visibilidad del modal de racha
  const [showStreakCalendar, setShowStreakCalendar] = useState(false);     // Controla visibilidad del calendario de racha
  const [streakCount, setStreakCount] = useState(0);                       // Contador de días consecutivos (racha actual)
  const [loading, setLoading] = useState(true);                            // Estado de carga inicial
  const [userData, setUserData] = useState(null);                          // Datos procesados del usuario para mostrar en UI
  const [pendingNotifs, setPendingNotifs] = useState(0);                   // Notificaciones pendientes (contact_requests)

  /**
   * fetchNotifs: Obtiene el conteo de solicitudes de contacto pendientes (iniciadas por admin).
   * - Tabla: contact_requests, filtro user_id + initiator="admin" + status="pending"
   * - Endpoint: supabase.from("contact_requests").select con count exact y head (sin datos).
   * - Silencia errores (catch vacío) para no romper la UI si falla.
   */
  const fetchNotifs = useCallback(async () => {
    if (!user) return;
    try {
      const { count } = await supabase
        .from("contact_requests")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("initiator", "admin")
        .eq("status", "pending");
      setPendingNotifs(count || 0);
    } catch {}
  }, [user]);

  /**
   * fetchData: Carga los datos del perfil del usuario y decide si mostrar el modal de racha.
   * - Construye userData (id, email, displayName, streak) a partir de user y profile.
   * - Si streak > 0 y no se ha mostrado hoy (localStorage), muestra StreakModal.
   * - Usa localStorage con clave "streak_shown_{user.id}" para mostrar una vez por día.
   */
  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(false);
    try {
      // Ensambla el objeto userData con nombre visible (display_name o primera parte del email)
      const newUserData = {
        id: user.id, email: user.email,
        displayName: (profile && profile.display_name) || (user.email ? user.email.split("@")[0] : "Usuario"),
        streak: (profile && profile.streak) || 0,
      };
      const streak = (profile && profile.streak) || 0;
      // Lógica de una vez por día para el modal de racha
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
    } catch (error) { if (import.meta.env.DEV) console.error("Home fetch fail:", error); }
  }, [user, profile]);

  /**
   * Efecto principal: al montar, ejecuta fetchData y fetchNotifs en paralelo.
   * Se re-ejecuta si cambian las dependencias memoizadas (fetchData, fetchNotifs).
   */
  useEffect(() => { fetchData(); fetchNotifs(); }, [fetchData, fetchNotifs]);

  /* Spinner de carga mientras se obtienen los datos del usuario */
  if (loading && !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    /* Contenedor principal con fondo claro/oscuro */
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 relative overflow-hidden">

      {/* Círculos decorativos de fondo (efecto blur), no interactivos */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-fuchsia-500/5 blur-[100px] rounded-full" />
      </div>

      {/* Contenido principal con padding responsivo y espacio inferior para nav móvil */}
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 lg:py-12 relative z-10 pb-24 lg:pb-0">

        {/* Encabezado: saludo personalizado + botones de notificación y racha */}
        <header className="flex items-start justify-between mb-12">
          {/* Bloque de saludo: nombre del usuario con gradiente en el texto */}
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter dark:text-white leading-none">
              Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-500">
                {(userData && userData.displayName.split(" ")[0]) || "viajero"}
              </span>
            </h1>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-base md:text-lg italic">
              ¿En qué frecuencia vibramos hoy?
            </p>
          </div>

          {/* Botones de acción: bandeja de entrada (inbox) y visualización de racha */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Botón de notificaciones con badge de contador */}
            <button onClick={() => navigate("/inbox")} className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-4 rounded-[2rem] flex items-center justify-center border border-white/20 dark:border-slate-800 shadow-2xl hover:scale-105 transition-transform">
              <Bell className="w-6 h-6 text-slate-600 dark:text-slate-300" />
              {pendingNotifs > 0 && (
                /* Badge rojo con número de notificaciones pendientes */
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-rose-500/40">
                  {pendingNotifs}
                </span>
              )}
            </button>
            {/* Botón de racha (streak) — abre el calendario de racha al hacer clic */}
            <button onClick={() => setShowStreakCalendar(true)} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-4 md:p-5 rounded-[2rem] flex items-center gap-3 border border-white/20 dark:border-slate-800 shadow-2xl hover:scale-105 transition-transform">
              <div className="w-9 h-9 bg-gradient-to-tr from-orange-400 to-rose-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                <Flame className="w-5 h-5" />
              </div>
              <div className="text-left hidden md:block">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.3em]">Streak</p>
                <p className="font-black text-slate-900 dark:text-white text-lg leading-none">{(userData && userData.streak) || 0} días</p>
              </div>
            </button>
          </div>
        </header>

        {/* Card principal "Tu espacio seguro" con animación de aparición */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-xl p-8 md:p-10 mb-8"
        >
          {/* Título e icono del card */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black dark:text-white tracking-tight">Tu espacio seguro</h2>
              <p className="text-xs font-semibold text-slate-400">Bienvenido a MindMood</p>
            </div>
          </div>

          {/* Descripción de la aplicación */}
          <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed mb-6">
            MindMood es un diario emocional inteligente que te ayuda a conocer y gestionar tus emociones
            a través de la escritura. Escribe lo que sientes y deja que la IA analice tu estado de ánimo
            de forma privada y sin juicios.
          </p>

          {/* Grid de características: escribir, IA, estadísticas, racha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {[
              { icon: PenLine, color: "#6366F1", title: "Escribe libremente", desc: "Expresa lo que sientes sin filtros ni estructuras" },
              { icon: Sparkles, color: "#EC4899", title: "Análisis por IA", desc: "Robertuito interpreta tus emociones en segundos" },
              { icon: BarChart3, color: "#10B981", title: "Visualiza tu progreso", desc: "Gráficos y estadísticas de tu bienestar emocional" },
              { icon: CalendarDays, color: "#F59E0B", title: "Racha diaria", desc: "Mantén el hábito de escribir y cuida tu mente" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}18` }}>
                  <item.icon size={18} style={{ color: item.color }} />
                </div>
                <div>
                  <p className="text-sm font-black dark:text-white">{item.title}</p>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Botón CTA principal: ir a escribir nueva entrada */}
          <button onClick={() => navigate("/new-entry")}
            className="group w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-black text-base tracking-wide shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <PenLine size={20} />
            Escribir mi primera entrada
          </button>
        </motion.div>

        {/* Footer: aviso de privacidad */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="text-xs font-bold text-slate-400 dark:text-slate-600">
            Tu información está segura y es privada. MindMood no comparte tus datos.
          </p>
        </motion.div>
      </div>

      {/* Modales: celebración de racha (StreakModal) y calendario de racha (StreakCalendarModal) */}
      <StreakModal visible={showStreakModal} streak={streakCount} onClose={() => setShowStreakModal(false)} />
      <StreakCalendarModal visible={showStreakCalendar} onClose={() => setShowStreakCalendar(false)} />
    </div>
  );
}
