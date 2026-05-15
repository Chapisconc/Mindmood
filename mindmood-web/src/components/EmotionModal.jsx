import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../theme/ThemeContext";

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

function MoodRingSVG({ color, percent, size = 80 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.4;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${color}18`} strokeWidth="5" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)", filter: `drop-shadow(0 0 5px ${color}50)` }} />
    </svg>
  );
}

export default function EmotionModal({ visible, onClose, type, primaryMood, totalEntries, summary }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isCrisis = type === "crisis";
  const accent = MOOD_COLORS[primaryMood] || MOOD_COLORS.Neutral;
  const emoji = MOOD_EMOJI[primaryMood] || "😌";
  const percent = totalEntries ? Math.min(((totalEntries % 100) || 100), 100) : 75;

  const cardBg = isDark ? `${accent}0A` : `#FFFFFFEE`;
  const cardBorder = isDark ? `${accent}25` : `${accent}20`;
  const textColor = isDark ? "#F8FAFC" : "#0F172A";
  const subColor = isDark ? `${accent}CC` : "#64748B";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0"
            style={{
              background: isDark
                ? `radial-gradient(circle at center, ${accent}20 0%, ${accent}06 40%, #0F0A1A 100%)`
                : `radial-gradient(circle at center, ${accent}12 0%, ${accent}04 40%, #F8FAFC 100%)`,
              backdropFilter: "blur(40px)",
            }} />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="relative w-full max-w-sm rounded-[2.5rem] px-6 pt-10 pb-7 flex flex-col items-center gap-4"
            style={{
              backgroundColor: cardBg,
              border: `1.5px solid ${cardBorder}`,
              backdropFilter: "blur(20px)",
              boxShadow: isDark
                ? `0 0 80px ${accent}18, 0 30px 60px rgba(0,0,0,0.35), inset 0 1px 0 ${accent}12`
                : `0 0 60px ${accent}12, 0 20px 40px rgba(0,0,0,0.08), inset 0 1px 0 ${accent}10`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center border-0 cursor-pointer transition-all hover:scale-110"
              style={{ backgroundColor: `${accent}12`, border: `1px solid ${accent}20` }}>
              <X size={14} color={accent} />
            </button>

            {/* Ring con conteo de entradas a la IZQUIERDA + Emoji al CENTRO */}
            <div className="flex items-center justify-center gap-6 w-full">
              {/* Ring a la izquierda */}
              {!isCrisis && (
                <div className="relative shrink-0">
                  <MoodRingSVG color={accent} percent={percent} size={80} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-base font-black" style={{ color: textColor }}>{totalEntries || "—"}</span>
                    <span className="text-[7px] font-bold uppercase tracking-[0.15em]" style={{ color: subColor }}>entradas</span>
                  </div>
                </div>
              )}

              {/* Emoji al centro */}
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.12, type: "spring", stiffness: 350, damping: 14 }}
                className="flex items-center justify-center"
              >
                {isCrisis ? (
                  <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center"
                    style={{ background: `radial-gradient(circle, ${accent}30 0%, ${accent}08 70%, transparent 100%)`, boxShadow: `0 0 30px ${accent}30` }}>
                    <span className="text-3xl">{emoji}</span>
                  </div>
                ) : (
                  <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center"
                    style={{ background: `radial-gradient(circle, ${accent}20 0%, ${accent}06 70%, transparent 100%)` }}>
                    <span className="text-[38px] leading-none">{emoji}</span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Mood name */}
            <motion.h2
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
              className="text-xl font-black text-center leading-tight"
              style={{ color: accent, textShadow: isDark ? `0 0 20px ${accent}30` : 'none' }}
            >
              {isCrisis ? "No estas solo" : primaryMood || "Analizado"}
            </motion.h2>

            {summary && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="text-sm text-center font-medium leading-relaxed max-w-[280px] m-0"
                style={{ color: isDark ? `${accent}CC` : '#475569' }}>
                {summary}
              </motion.p>
            )}

            {isCrisis && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                className="w-full flex flex-col gap-2">
                {[
                  { name: "Linea Cero Suicidios", number: "075", icon: "📞" },
                  { name: "Linea de la Vida", number: "800-911-2000", icon: "🏥" },
                  { name: "SAPTEL", number: "55-5603-0000", icon: "💬" },
                ].map((h) => (
                  <button key={h.number}
                    onClick={() => window.open(`tel:${h.number}`, "_self")}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01]"
                    style={{ backgroundColor: `${accent}10`, borderColor: `${accent}25` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg" style={{ backgroundColor: `${accent}25` }}>{h.icon}</div>
                    <div className="text-left">
                      <p className="text-sm font-bold" style={{ color: textColor }}>{h.name}</p>
                      <p className="text-xs font-black mt-0.5" style={{ color: accent }}>{h.number}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            <motion.button
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              onClick={onClose}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-2xl text-sm font-bold border-0 cursor-pointer transition-all text-white"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accent}CC)`,
                boxShadow: `0 8px 25px ${accent}35`,
              }}>
              {isCrisis ? "Entendido" : "Cerrar"}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
