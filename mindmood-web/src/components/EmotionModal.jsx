/* ==========================================================================
   EmotionModal.jsx — MODAL DE EMOCIÓN / CRISIS para MindMood
   Muestra un anillo SVG (MoodRing) con el color del estado de ánimo
   predominante y el total de entradas. En caso de crisis, muestra
   líneas de ayuda telefónica (Línea Cero Suicidios, Línea de la Vida, SAPTEL).
   ========================================================================== */

// Ícono de cerrar (lucide-react)
import { X } from "lucide-react";

/**
 * MOOD_COLORS — Mapa de colores asociados a cada estado de ánimo.
 * Usado para el anillo, acentos y fondos del modal.
 */
const MOOD_COLORS = {
  Excelente: "#10B981", Feliz: "#EC4899", Agradecido: "#FBBF24",
  Sorpresa: "#06B6D4", Neutral: "#A78BFA", Enojo: "#F97316",
  Ansiedad: "#8B5CF6", Miedo: "#7C3AED", Triste: "#F43F5E",
  Asco: "#84CC16", Crisis: "#EF4444", Indeterminado: "#64748B",
};

/**
 * MoodRingSVG — Componente SVG que dibuja un anillo circular
 * con progreso (stroke-dashoffset) del color del ánimo.
 * Simula un "anillo de estado de ánimo" animado.
 *
 * @prop {string} color   — Color del anillo (hex)
 * @prop {number} percent — Porcentaje de progreso (0-100)
 * @prop {number} size    — Diámetro del SVG en píxeles
 */
function MoodRingSVG({ color, percent, size = 120 }) {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.4;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Anillo de fondo (gris oscuro) */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1E293B" strokeWidth="6" />
      {/* Anillo de progreso animado con el color del ánimo */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dashoffset 0.8s ease" }} />
    </svg>
  );
}

/**
 * EmotionModal — Modal flotante que muestra:
 *   - En modo normal: anillo con color del ánimo + total de entradas
 *   - En modo crisis: ícono 🆘 + líneas de ayuda con botones para llamar
 *
 * @prop {boolean} visible       — Controla si el modal se muestra
 * @prop {Function} onClose      — Callback al cerrar
 * @prop {string}   type         — Tipo de modal ("crisis" o normal)
 * @prop {string}   primaryMood  — Estado de ánimo predominante (clave de MOOD_COLORS)
 * @prop {number}   totalEntries — Total de entradas del usuario
 */
export default function EmotionModal({ visible, onClose, type, primaryMood, totalEntries }) {
  /* Determina si es un modal de crisis */
  const isCrisis = type === "crisis";

  /* Color del acento basado en el ánimo predominante */
  const accent = MOOD_COLORS[primaryMood] || MOOD_COLORS.Neutral;

  /* Porcentaje para el anillo: módulo 100 del total (default 75%) */
  const percent = totalEntries ? ((totalEntries % 100) || 100) : 75;

  if (!visible) return null;

  // Fondo oscuro semi-transparente con blur
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-3xl px-8 pt-10 pb-6 flex flex-col items-center"
        style={{ backgroundColor: "#0F0A1A", border: `1px solid ${accent}40` }}
        onClick={(e) => e.stopPropagation()}>
        {/* Botón de cerrar (X) */}
        <button onClick={onClose} className="absolute top-4 right-4 bg-transparent border-none cursor-pointer p-1">
          <X size={20} color="#64748B" />
        </button>

        {/* Contenido superior: ícono de alerta o anillo de ánimo */}
        {isCrisis ? (
          /* Modo crisis: ícono 🆘 con sombra */
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: accent, boxShadow: `0 8px 16px ${accent}60` }}>
            <span className="text-2xl">🆘</span>
          </div>
        ) : (
          /* Modo normal: anillo SVG con total de entradas superpuesto */
          <div className="relative mb-4">
            <MoodRingSVG color={accent} percent={percent} size={130} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black text-white">{totalEntries || "—"}</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">entradas</span>
            </div>
          </div>
        )}

        {/* Título del modal */}
        <p className="text-xl font-black text-center text-white mb-6">
          {isCrisis ? "No estás solo" : primaryMood || "Analizado"}
        </p>

        {/* En crisis: muestra líneas de ayuda con botones para llamar */}
        {isCrisis && (
          <div className="w-full mb-5 flex flex-col gap-2.5">
            {[
              { name: "Línea Cero Suicidios", number: "075" },
              { name: "Línea de la Vida", number: "800-911-2000" },
              { name: "SAPTEL", number: "55-5603-0000" },
            ].map((h) => (
              /* Botón que abre el teléfono con el número de la línea */
              <button key={h.number}
                onClick={() => window.open(`tel:${h.number}`, "_self")}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border cursor-pointer"
                style={{ backgroundColor: `${accent}12`, borderColor: `${accent}30` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: accent }}>
                  <span className="text-lg">📞</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">{h.name}</p>
                  <p className="text-xs font-black mt-0.5" style={{ color: `${accent}AA` }}>{h.number}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Botón de acción principal */}
        <button onClick={onClose}
          className="w-full py-3.5 rounded-2xl text-sm font-bold border-none cursor-pointer text-white"
          style={{ backgroundColor: accent }}>
          {isCrisis ? "Entendido" : "Cerrar"}
        </button>
      </div>
    </div>
  );
}
