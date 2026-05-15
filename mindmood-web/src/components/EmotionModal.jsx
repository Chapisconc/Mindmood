import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MOOD_COLORS = {
  Excelente: "#10B981", Feliz: "#EC4899", Agradecido: "#FBBF24",
  Sorpresa: "#06B6D4", Neutral: "#A78BFA", Enojo: "#F97316",
  Ansiedad: "#8B5CF6", Miedo: "#7C3AED", Triste: "#F43F5E",
  Asco: "#84CC16", Crisis: "#EF4444", Indeterminado: "#64748B",
};

const MOOD_EMOJI = {
  Excelente: "🌟", Feliz: "😊", Agradecido: "🙏",
  Sorpresa: "😲", Neutral: "😌", Enojo: "😤",
  Ansiedad: "😰", Miedo: "😨", Triste: "😢",
  Asco: "🤢", Crisis: "💔", Indeterminado: "🤔",
};

function MoodRingSVG({ color, percent, size = 130 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${color}20`} strokeWidth="7" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)", filter: `drop-shadow(0 0 8px ${color}60)` }} />
    </svg>
  );
}

export default function EmotionModal({ visible, onClose, type, primaryMood, totalEntries, summary }) {
  const isCrisis = type === "crisis";
  const accent = MOOD_COLORS[primaryMood] || MOOD_COLORS.Neutral;
  const emoji = MOOD_EMOJI[primaryMood] || "😌";
  const percent = totalEntries ? Math.min(((totalEntries % 100) || 100), 100) : 75;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          onClick={onClose}
        >
          {/* Backdrop con blur del color de la emoción */}
          <div className="absolute inset-0"
            style={{ background: `radial-gradient(circle at center, ${accent}25 0%, ${accent}08 40%, #0F0A1A 100%)`, backdropFilter: "blur(40px)" }} />

          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-sm rounded-[2.5rem] px-8 pt-10 pb-7 flex flex-col items-center"
            style={{
              backgroundColor: `${accent}08`,
              border: `1.5px solid ${accent}30`,
              backdropFilter: "blur(20px)",
              boxShadow: `0 0 80px ${accent}20, 0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 ${accent}15`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center border-0 cursor-pointer transition-all hover:scale-110"
              style={{ backgroundColor: `${accent}15`, border: `1px solid ${accent}25` }}>
              <X size={14} color={accent} />
            </button>

            {/* Emoji animado */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 15 }}
              className="relative mb-5"
            >
              {isCrisis ? (
                <div className="w-[120px] h-[120px] rounded-full flex items-center justify-center"
                  style={{ background: `radial-gradient(circle, ${accent}40 0%, ${accent}10 70%, transparent 100%)`, boxShadow: `0 0 40px ${accent}40, 0 0 80px ${accent}20` }}>
                  <span className="text-5xl" style={{ filter: `drop-shadow(0 0 10px ${accent})` }}>{emoji}</span>
                </div>
              ) : (
                <div className="relative">
                  <MoodRingSVG color={accent} percent={percent} size={130} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl" style={{ filter: `drop-shadow(0 0 8px ${accent}60)` }}>{emoji}</span>
                    <span className="text-2xl font-black text-white mt-0.5">{totalEntries || "—"}</span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5" style={{ color: `${accent}99` }}>entradas</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Mood name */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-2xl font-black text-white text-center mb-2"
              style={{ textShadow: `0 0 20px ${accent}40` }}
            >
              {isCrisis ? "No estás solo" : primaryMood || "Analizado"}
            </motion.h2>

            {/* Summary text */}
            {summary && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="text-sm text-center font-medium leading-relaxed mb-6 max-w-[280px]"
                style={{ color: `${accent}AA` }}
              >
                {summary}
              </motion.p>
            )}

            {/* Crisis helplines */}
            {isCrisis && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="w-full mb-5 flex flex-col gap-2">
                {[
                  { name: "Línea Cero Suicidios", number: "075", emoji: "📞" },
                  { name: "Línea de la Vida", number: "800-911-2000", emoji: "🏥" },
                  { name: "SAPTEL", number: "55-5603-0000", emoji: "💬" },
                ].map((h) => (
                  <button key={h.number}
                    onClick={() => window.open(`tel:${h.number}`, "_self")}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: `${accent}10`, borderColor: `${accent}25` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg" style={{ backgroundColor: `${accent}25` }}>
                      {h.emoji}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">{h.name}</p>
                      <p className="text-xs font-black mt-0.5" style={{ color: accent }}>{h.number}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            {/* CTA button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-2xl text-sm font-bold border-0 cursor-pointer text-white transition-all"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}CC)`,
                boxShadow: `0 8px 30px ${accent}40`,
              }}>
              {isCrisis ? "Entendido" : "Cerrar"}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
