/* ======================================================
   FILE: History.jsx  —  Historial de entradas
   Ruta:  /history
   Auth:  Requiere usuario autenticado
   Propósito: Lista todas las entradas del diario,
              permite filtrar por estado de ánimo,
              expandir para ver detalles (score, crisis).
   ====================================================== */

// React hooks: estado, efectos, memoización de callbacks
import { useState, useEffect, useCallback } from "react";
// Animaciones de entrada
import { motion } from "framer-motion";
// Iconos para cada estado de ánimo y acciones
import { Clock, Sparkles, Sun, HeartHandshake, Zap, Waves, Flame, Wind, Ghost, CloudRain, Frown, AlertTriangle, BookOpen } from "lucide-react";
// Cliente Supabase para consultas
import { supabase } from "../services/supabase";
// Hook personalizado del tema (claro/oscuro)
import { useTheme } from "../theme/ThemeContext";
// Hook personalizado de autenticación (usuario)
import { useAuth } from "../hooks/useAuth";
import BackgroundDecor from "../components/BackgroundDecor";

/**
 * MOODS: Catálogo completo de estados de ánimo detectables.
 * Cada mood tiene: id (slug), name (nombre visible), color, icon (componente lucide).
 * Se usa para mostrar el badge de color, filtrar entradas y renderizar íconos.
 */
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

/**
 * MOOD_EMOJI: Mapa de nombre de mood a emoji visual.
 * Se usa en los filtros y en las tarjetas de entrada (mobile).
 */
const MOOD_EMOJI = {
  Crisis: "🚨", Triste: "😢", Enojo: "😠", Ansiedad: "😰",
  Miedo: "😨", Feliz: "😊", Excelente: "🌟", Agradecido: "🙏",
  Sorpresa: "😮", Neutral: "😐", Asco: "🤢",
};

/**
 * formatDate: Convierte un string ISO de fecha a objeto con día, mes (abreviado), año y hora.
 * @param {string} dateStr — String ISO de created_at desde Supabase
 * @returns {{ day, month, year, time }}
 */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return { day: d.getDate(), month: months[d.getMonth()], year: d.getFullYear(), time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) };
}

export default function History() {
  // Usuario autenticado desde useAuth
  const { user } = useAuth();

  /* ---------- Estados del historial ---------- */
  const [entries, setEntries] = useState([]);               // Lista completa de entradas del usuario
  const [loading, setLoading] = useState(true);              // Indicador de carga inicial
  const [activeFilter, setActiveFilter] = useState("all");   // Filtro de mood activo ("all" = todas)
  const [expandedEntry, setExpandedEntry] = useState(null);  // ID de la entrada expandida (null = ninguna)

  /**
   * fetchHistory: Obtiene todas las entradas del usuario desde Supabase.
   * - Tabla: entries, filtro user_id, orden descendente por created_at.
   * - Respuesta: array de objetos { id, text, mood, score, requires_help, created_at }.
   * - Error: solo se loguea en desarrollo (import.meta.env.DEV).
   */
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

  /**
   * Efecto: al montar o cambiar fetchHistory, dispara la carga de entradas.
   */
  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  /**
   * filteredEntries: Entradas filtradas según activeFilter.
   * - Si el filtro es "all", devuelve todas.
   * - Si no, filtra por el id del mood (case-insensitive).
   */
  const filteredEntries = activeFilter === "all" ? entries : entries.filter(e => {
    const mood = MOODS.find(m => m.name.toLowerCase() === (e.mood || "").toLowerCase());
    return mood?.id === activeFilter;
  });

  /* Spinner de carga mientras se obtienen las entradas */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    /* Fondo principal claro/oscuro */
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 relative overflow-hidden">

      <BackgroundDecor />

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 lg:py-12 relative z-10 pb-28 lg:pb-12">

        {/* Encabezado de la página */}
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight dark:text-white">Historial</h1>
          <p className="text-slate-400 dark:text-slate-500 font-medium mt-1">Tus entradas, ordenadas por fecha.</p>
        </div>

        {/* Barra de filtros: scroll horizontal con snap, cada botón es un mood o "Todas" */}
        <div className="flex gap-1.5 overflow-x-auto pb-4 snap-x scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0">

          {/* Botón "Todas" — resetea el filtro a "all" */}
          <button onClick={() => setActiveFilter("all")}
            className={`px-3.5 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all shrink-0 snap-start whitespace-nowrap border ${
              activeFilter === "all"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
                : "bg-white dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700"
            }`}>
            Todas
          </button>

          {/* Botones de mood: cada uno filtra por su id y se pinta del color del mood cuando está activo */}
          {MOODS.map(mood => {
            const active = activeFilter === mood.id;
            return (
              <button key={mood.id} onClick={() => setActiveFilter(mood.id)}
                className={`px-3 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all shrink-0 snap-start border ${
                  active
                    ? "text-white shadow-sm"
                    : "bg-white dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700"
                }`}
                style={active ? { backgroundColor: mood.color, borderColor: mood.color } : {}}>
                {MOOD_EMOJI[mood.name] || ""} {mood.name}
              </button>
            );
          })}
        </div>

        {/* Contenido condicional: lista de entradas o estado vacío */}
        {filteredEntries.length === 0 ? (
          /* Estado vacío: cuando no hay entradas (o ninguna coincide con el filtro) */
          <div className="flex flex-col items-center pt-16">
            <BookOpen className="w-16 h-16 mb-5 opacity-30 text-slate-300 dark:text-slate-600" />
            <p className="text-xl font-black text-center dark:text-white">Aún no hay entradas</p>
            <p className="text-sm font-medium text-slate-400 mt-1">Tus reflexiones guardadas aparecerán aquí.</p>
          </div>
        ) : (
          /* Lista de entradas con animación escalonada */
          <div className="space-y-3">
            {filteredEntries.map((entry, idx) => {
              // Encuentra el objeto mood correspondiente o fallback a "neutral" (índice 4)
              const moodObj = MOODS.find(m => m.name.toLowerCase() === (entry.mood || "").toLowerCase()) || MOODS[4];
              const { day, month, year, time } = formatDate(entry.created_at);

              return (
                /* Card de entrada: al hacer clic expande/colapsa detalles */
                <motion.div key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                  className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all overflow-hidden cursor-pointer"
                >
                  <div className="flex items-start gap-3 p-4 md:p-5">

                    {/* Fecha desktop (oculto en mobile): mes arriba, día grande abajo */}
                    <div className="hidden md:flex flex-col items-center justify-center w-14 shrink-0 gap-0.5 pt-1">
                      <span className="text-[9px] font-black uppercase" style={{ color: moodObj.color }}>{month}</span>
                      <span className="text-xl font-black dark:text-white leading-none">{day}</span>
                    </div>

                    {/* Indicador de mood en mobile (oculto en desktop): emoji sobre fondo de color */}
                    <div className="flex md:hidden w-9 h-9 rounded-xl items-center justify-center shrink-0" style={{ backgroundColor: `${moodObj.color}18` }}>
                      <span className="text-sm">{MOOD_EMOJI[moodObj.name] || ""}</span>
                    </div>

                    {/* Contenido principal de la tarjeta */}
                    <div className="flex-1 min-w-0">

                      {/* Metadatos: badge de mood, hora, fecha mobile, año */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {/* Badge de color con el nombre del mood */}
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider text-white" style={{ backgroundColor: moodObj.color }}>
                          {moodObj.name}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">{time}</span>
                        <span className="md:hidden text-[9px] font-bold text-slate-400">{month} {day}</span>
                        <span className="text-[9px] font-bold text-slate-400">{year}</span>
                      </div>

                      {/* Texto de la entrada: truncado a 2 líneas si no está expandido */}
                      <p className={`text-slate-600 dark:text-slate-300 text-sm leading-relaxed ${expandedEntry === entry.id ? "" : "line-clamp-2"}`}>
                        "{entry.text}"
                      </p>

                      {/* Detalles expandidos: score numérico y alerta de crisis si requiere ayuda */}
                      {expandedEntry === entry.id && entry.mood && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400">Score: {entry.score}</span>
                          {entry.requires_help && <span className="text-[10px] font-bold text-rose-500">🚨 Requiere atención</span>}
                        </div>
                      )}
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
