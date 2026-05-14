/* ======================================================
   FILE: NewEntry.jsx  —  Creación de nueva entrada
   Ruta:  /new-entry
   Auth:  Requiere usuario autenticado
   Propósito: Editor de diario emocional. El usuario
              escribe texto, la IA analiza el estado de
              ánimo (mood, score, crisis), y se guarda
              en Supabase.
   ====================================================== */

// React hooks: estado, efectos secundarios
import { useState, useEffect } from "react";
// Navegación programática entre rutas
import { useNavigate } from "react-router-dom";
// Animaciones de entrada/salida
import { motion } from "framer-motion";
// Iconos: enviar, spinner, destellos, pluma, corazón
import { Send, Loader2, Sparkles, Feather, Heart } from "lucide-react";
// Cliente Supabase para consultas a la BD
import { supabase } from "../services/supabase";
// Hook personalizado del tema (claro/oscuro)
import { useTheme } from "../theme/ThemeContext";
// Hook personalizado para operaciones con entradas (streak, etc.)
import { useJournalEntry } from "../hooks/useJournalEntry";
// Modal que muestra el resultado del análisis (mood, crisis)
import EmotionModal from "../components/EmotionModal";
import BackgroundDecor from "../components/BackgroundDecor";

/**
 * API_URL: determina dinámicamente la URL del endpoint de análisis.
 * Prioridad: 1) ngrok (producción), 2) local (desarrollo), 3) fallback 127.0.0.1:8000.
 * Endpoint: POST /analyze — recibe { text }, devuelve { mood, score, requires_help, summary }.
 */
const API_URL = import.meta.env.VITE_API_NGROK_URL
  ? `${import.meta.env.VITE_API_NGROK_URL}/analyze`
  : import.meta.env.VITE_API_LOCAL_URL
    ? `${import.meta.env.VITE_API_LOCAL_URL}/analyze`
    : "http://127.0.0.1:8000/analyze";

// Límite máximo de caracteres para el texto de la entrada
const MAX_CHARS = 2000;

// Prompts o preguntas inspiradoras mostradas al azar sobre el editor
const prompts = [
  "¿Qué momento de tu día te gustaría atesorar?",
  "¿Hay algo que tu yo del futuro necesite recordar?",
  "¿Qué emoción está visitando tu corazón hoy?",
  "Escribe libremente, sin filtros ni prisas...",
  "¿Qué sueño o pensamiento te acompaña hoy?",
];

export default function NewEntry() {
  // Hook de navegación — redirige tras guardar entrada
  const navigate = useNavigate();
  // Tema actual y estilos del tema
  const { theme, themeStyles } = useTheme();
  // Función para actualizar la racha (streak) del usuario tras guardar entrada
  const { updateStreak } = useJournalEntry();

  /* ---------- Estados del editor ---------- */
  const [text, setText] = useState("");                        // Texto de la entrada escrito por el usuario
  const [loading, setLoading] = useState(false);                // Indicador de carga durante guardado + análisis
  const [isOffline, setIsOffline] = useState(!navigator.onLine); // Estado de conectividad (online/offline)
  const [modalVisible, setModalVisible] = useState(false);      // Controla visibilidad del EmotionModal post-guardado
  const [modalData, setModalData] = useState({ type: "normal", summary: "" }); // Datos a mostrar en el modal (tipo, resumen, mood, total)
  // Prompt aleatorio seleccionado al montar (solo se evalúa una vez)
  const [prompt] = useState(() => prompts[Math.floor(Math.random() * prompts.length)]);

  /**
   * Efecto de montaje:
   * 1) Escucha eventos online/offline para actualizar isOffline.
   * 2) Recupera un borrador (draft) guardado en localStorage para persistencia ante cierre accidental.
   * 3) Limpieza: remueve los event listeners al desmontar.
   */
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Recupera borrador previo si existe
    const draft = localStorage.getItem("entry_draft");
    if (draft) setText(draft);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  /**
   * saveDraft: Guarda el texto en localStorage para persistencia.
   * - Solo guarda si no excede MAX_CHARS (2000).
   * - Esto permite recuperar el texto si el usuario cierra la página sin guardar.
   * @param {string} val — El texto actual del textarea
   */
  const saveDraft = (val) => {
    if (val.length <= MAX_CHARS) { setText(val); localStorage.setItem("entry_draft", val); }
  };

  /**
   * handleSave: Proceso completo de guardado de entrada.
   * Flujo:
   * 1) Valida que el texto no esté vacío.
   * 2) Llama a la API de análisis (POST /analyze) si hay conectividad.
   *    - Timeout: 10s para ngrok, 5s para local.
   *    - Envía { text } y recibe { mood, score, requires_help, summary }.
   *    - Si offline, usa valores por defecto (Neutral, 0, false, "").
   * 3) Inserta la entrada en Supabase (tabla entries): user_id, text, mood, score.
   * 4) Actualiza la racha (streak) del usuario.
   * 5) Limpia el borrador de localStorage.
   * 6) Cuenta el total de entradas del usuario para mostrarlo en el modal.
   * 7) Muestra EmotionModal con el resultado (tipo crisis/normal, resumen, mood, total).
   * 8) Manejo de errores: alerta con el mensaje.
   */
  const handleSave = async () => {
    if (!text.trim()) return;                       // Validación: texto no vacío
    setLoading(true);                                 // Activa spinner

    try {
      // Valores por defecto del análisis (usados si offline o falla la API)
      let aiData = { mood: "Neutral", score: 0, requires_help: false, summary: "" };

      // Llamada a la API de análisis solo si hay conexión
      if (!isOffline) {
        try {
          const isNgrok = API_URL.includes("ngrok");                              // Detecta si usa ngrok
          const controller = new AbortController();                               // Para abortar la petición
          const timeoutId = setTimeout(() => controller.abort(), isNgrok ? 10000 : 5000); // Timeout diferenciado
          const response = await fetch(API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(isNgrok ? { "ngrok-skip-browser-warning": "true" } : {})       // Header necesario para ngrok
            },
            body: JSON.stringify({ text }),                                      // Envía el texto al backend
            signal: controller.signal,
          });
          clearTimeout(timeoutId);                                                // Cancela el timeout si respondió
          if (response.ok) aiData = await response.json();                        // Parsear respuesta exitosa
        } catch (_err) {}  // Silencia errores de red/timeout — usa valores por defecto
      }

      // Obtiene el usuario actual desde Supabase Auth
      const { data: { user } } = await supabase.auth.getUser();
      const { mood, score, requires_help, summary } = aiData;

      // Inserta la entrada en la tabla "entries"
      let { error: entryError } = await supabase.from("entries").insert([
        { user_id: user.id, text, mood, score },
      ]);
      if (entryError) throw entryError;                    // Error de BD

      // Actualiza la racha del usuario (incrementa streak si escribe hoy)
      await updateStreak(user.id);

      // Limpia el borrador guardado en localStorage
      localStorage.removeItem("entry_draft");

      // Cuenta el total de entradas del usuario para mostrarlo en el modal
      const { count } = await supabase.from("entries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Prepara los datos para el modal de resultado
      setModalData({
        type: requires_help ? "crisis" : "normal",       // Tipo "crisis" si IA detectó requiere ayuda
        summary: isOffline ? "Guardado localmente (Modo Offline)" : summary,  // Resumen de IA o msg offline
        primaryMood: mood,
        totalEntries: count || 0,
      });
      setModalVisible(true);                               // Muestra el modal
    } catch (e) { alert(e.message); }                       // Error inesperado
    finally { setLoading(false); }                           // Desactiva spinner
  };

  /* Caracteres restantes calculados para el contador (texto restante) */
  const charsLeft = MAX_CHARS - text.length;

  return (
    /* Fondo principal claro/oscuro */
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 relative overflow-hidden">

      <BackgroundDecor />

      {/* Contenedor del editor con animación de entrada */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto relative z-10 px-4 lg:px-0 py-10 lg:py-14 pb-32">

        {/* Encabezado: icono de pluma, título y prompt aleatorio */}
        <div className="text-center mb-12">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-indigo-500/20"
          >
            <Feather className="w-7 h-7 text-white" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight dark:text-white leading-none mb-3">Tu espacio para escribir</h1>
          {/* Prompt inspirador seleccionado al azar */}
          <p className="text-slate-400 dark:text-slate-500 font-semibold text-base italic max-w-md mx-auto leading-relaxed">
            {prompt}
          </p>
        </div>

        {/* Área del formulario: textarea, contadores y botón */}
        <div className="space-y-6">

          {/* Contenedor del textarea con glow al hacer focus */}
          <div className="relative group">
            {/* Gradiente decorativo detrás del textarea (efecto glow) */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-fuchsia-500/20 to-amber-500/20 rounded-[2rem] blur-xl opacity-60 group-focus-within:opacity-100 transition-opacity" />

            {/* Textarea principal: captura el texto emocional del usuario */}
            <textarea
              value={text}
              onChange={(e) => saveDraft(e.target.value)}
              placeholder="Escribe aquí lo que sientes..."
              maxLength={MAX_CHARS}
              className="relative w-full h-[28rem] p-8 md:p-10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-2xl rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 outline-none text-lg md:text-xl font-medium tracking-tight text-slate-800 dark:text-white resize-none shadow-lg transition-all duration-300 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:shadow-2xl"
            />

            {/* Indicadores flotantes en esquina inferior derecha: contador de caracteres + badge IA */}
            <div className="absolute bottom-5 right-5 flex items-center gap-4">
              {/* Contador de caracteres (cambia a rojo cuando quedan < 100) */}
              <span className={`text-[11px] font-bold ${charsLeft < 100 ? "text-rose-500" : "text-slate-400"}`}>
                {charsLeft}
              </span>
              {/* Badge que indica análisis por IA */}
              <div className="flex items-center gap-2 py-2 px-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-full border border-slate-200/50 dark:border-slate-700/50">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">IA</span>
              </div>
            </div>
          </div>

          {/* Aviso de privacidad y seguridad */}
          <div className="flex items-center gap-3 px-1">
            <Heart className="w-4 h-4 text-rose-400 shrink-0" />
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 leading-relaxed">
              Todo lo que escribes es privado y seguro. La IA analiza tu texto solo para detectar tu estado de ánimo.
            </p>
          </div>

          {/* Botón de guardar: muestra spinner si está cargando */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={loading || !text.trim()}
            className="group relative w-full h-16 bg-gradient-to-r from-indigo-500 to-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all flex items-center justify-center"
          >
            {loading ? (
              /* Estado de carga: spinner + texto "Analizando..." */
              <div className="flex items-center justify-center gap-3 relative z-10">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
                <span className="text-white font-black text-base tracking-tight">Analizando tu entrada...</span>
              </div>
            ) : (
              /* Estado normal: icono de enviar + texto "Guardar entrada" */
              <div className="flex items-center justify-center gap-3 relative z-10">
                <span className="text-white font-black text-lg tracking-tight">Guardar entrada</span>
                <Send className="w-5 h-5 text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Modal de resultado del análisis: muestra mood, resumen, crisis detection */}
      <EmotionModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); navigate("/home"); }}
        type={modalData.type}
        primaryMood={modalData.primaryMood}
        totalEntries={modalData.totalEntries}
      />
    </div>
  );
}
