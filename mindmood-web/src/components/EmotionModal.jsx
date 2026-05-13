import { X } from "lucide-react";
import Icon from "./Icon";

const MOOD_COLORS = {
  Excelente: "#10B981", Feliz: "#EC4899", Agradecido: "#FBBF24",
  Sorpresa: "#06B6D4", Neutral: "#A78BFA", Enojo: "#F97316",
  Ansiedad: "#8B5CF6", Miedo: "#7C3AED", Triste: "#F43F5E",
  Asco: "#84CC16", Crisis: "#EF4444", Indeterminado: "#64748B",
};

export default function EmotionModal({ visible, onClose, type, summary, primaryMood, selectedMoods }) {
  const isCrisis = type === "crisis";
  const accent = MOOD_COLORS[primaryMood] || MOOD_COLORS.Neutral;

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 flex flex-col items-center border"
        style={{
          backgroundColor: `${accent}15`,
          borderColor: `${accent}40`,
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 bg-transparent border-none cursor-pointer">
          <X size={24} className="text-white/60" />
        </button>

        <div
          className="w-[90px] h-[90px] rounded-full flex items-center justify-center mb-7"
          style={{ backgroundColor: accent, boxShadow: `0 12px 24px ${accent}80` }}
        >
          <Icon name={isCrisis ? "heart-outline" : "auto-fix"} size={40} color="#FFF" />
        </div>

        <p className="text-[28px] font-black text-center mb-2 text-white">
          {isCrisis ? "No estás solo" : primaryMood || "Análisis Mental"}
        </p>

        {selectedMoods?.length > 0 && (
          <div className="w-full mb-6">
            <p className="text-xs font-black uppercase tracking-wider mb-3 text-white/50 text-center">Emociones detectadas</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {selectedMoods.map((m) => {
                const c = MOOD_COLORS[m] || accent;
                return (
                  <span key={m} className="px-4 py-2 rounded-full text-[13px] font-extrabold text-white"
                    style={{ backgroundColor: c }}>
                    {m}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {summary && (
          <p className="text-sm text-center leading-[24px] font-semibold mb-8 px-1 text-white/60">
            {summary}
          </p>
        )}

        {isCrisis && (
          <>
            <div className="w-full mb-7 flex flex-col gap-3">
              {[
                { name: "Linea Cero Suicidios", number: "075" },
                { name: "Linea de la Vida", number: "800-911-2000" },
                { name: "SAPTEL", number: "55-5603-0000" },
              ].map((h) => (
                <button key={h.number} onClick={() => window.open(`tel:${h.number}`, "_self")}
                  className="w-full flex items-center p-5 rounded-3xl border cursor-pointer bg-red-500/15 border-red-500/30">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 bg-red-500 shadow-lg shadow-red-500/40">
                    <Icon name="phone-outline" size={22} color="#FFF" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white text-[17px] font-extrabold">{h.name}</p>
                    <p className="text-red-300 text-[15px] font-black mt-0.5">{h.number}</p>
                  </div>
                  <Icon name="chevron-right" size={22} color="#94A3B8" />
                </button>
              ))}
            </div>
          </>
        )}

        <button onClick={onClose}
          className="w-full py-[22px] rounded-3xl text-white text-lg font-black tracking-[0.8px] cursor-pointer border-none"
          style={{ backgroundColor: accent }}>
          {isCrisis ? "Entendido" : "Cerrar"}
        </button>
      </div>
    </div>
  );
}
