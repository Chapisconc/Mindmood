import { X } from "lucide-react";
import Icon from "./Icon";
import { useTheme } from "../theme/ThemeContext";

const MOOD_CONFIGS = {
  Excelente: { bg: "#064E3B", border: "#10B981", icon: "#10B981" },
  Feliz: { bg: "#4C1D95", border: "#EC4899", icon: "#EC4899" },
  Agradecido: { bg: "#1A3A1A", border: "#FBBF24", icon: "#FBBF24" },
  Sorpresa: { bg: "#083344", border: "#06B6D4", icon: "#06B6D4" },
  Neutral: { bg: "#2E1065", border: "#A78BFA", icon: "#A78BFA" },
  Enojo: { bg: "#431407", border: "#F97316", icon: "#F97316" },
  Ansiedad: { bg: "#1E1B4B", border: "#8B5CF6", icon: "#8B5CF6" },
  Miedo: { bg: "#2E1065", border: "#7C3AED", icon: "#7C3AED" },
  Triste: { bg: "#4C0519", border: "#F43F5E", icon: "#F43F5E" },
  Asco: { bg: "#1A2E05", border: "#84CC16", icon: "#84CC16" },
  Crisis: { bg: "#180808", border: "#EF4444", icon: "#EF4444" },
  Indeterminado: { bg: "#1E293B", border: "#64748B", icon: "#64748B" },
};

export default function EmotionModal({ visible, onClose, type, summary, distribution, primaryMood }) {
  const { themeStyles } = useTheme();
  const isCrisis = type === "crisis";
  const config = MOOD_CONFIGS[primaryMood] || MOOD_CONFIGS.Neutral;

  const handleClose = () => onClose();

  if (!visible) return null;

  const others = distribution
    ? Object.keys(distribution).filter((k) => k !== (primaryMood || Object.keys(distribution)[0]))
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(15, 10, 30, 0.8)" }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[36px] p-8 flex flex-col items-center border-2"
        style={{
          backgroundColor: config.bg,
          borderColor: config.border,
          boxShadow: `0 20px 40px rgba(0,0,0,0.4)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 bg-transparent border-none cursor-pointer"
        >
          <X size={24} color="rgba(255,255,255,0.6)" />
        </button>

        <div
          className="w-[90px] h-[90px] rounded-full flex items-center justify-center mb-7"
          style={{
            backgroundColor: config.icon,
            boxShadow: `0 12px 24px ${config.icon}80`,
          }}
        >
          <Icon name={isCrisis ? "heart-outline" : "auto-fix"} size={40} color="#FFF" />
        </div>

        <p
          className="text-[28px] font-black text-center mb-2"
          style={{ color: isCrisis ? "#FCA5A5" : "#FFF" }}
        >
          {isCrisis ? "No estás solo" : "Análisis Mental"}
        </p>

        {!isCrisis && distribution && (
          <div className="flex flex-col items-center w-full mb-3">
            <div
              className="px-3 py-2 rounded-xl border text-xs font-extrabold uppercase"
              style={{
                backgroundColor: config.border + "30",
                borderColor: config.border,
                color: "#FFF",
              }}
            >
              ✨ {primaryMood || Object.keys(distribution)[0]}
            </div>
            {others.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {others.map((name) => (
                  <div
                    key={name}
                    className="px-3 py-2 rounded-xl border text-xs font-extrabold uppercase"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.08)",
                      borderColor: "rgba(255,255,255,0.15)",
                      color: "#E2E8F0",
                    }}
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div
          className="w-[60px] h-1 rounded mb-7"
          style={{ backgroundColor: config.border }}
        />

        <p
          className="text-lg text-center leading-[30px] font-semibold mb-8 px-1"
          style={{ color: "#E2E8F0" }}
        >
          {isCrisis
            ? "Hemos notado que estás pasando por un momento difícil. Por favor, considera hablar con alguien de confianza."
            : summary || "Tu reflexión ha sido guardada correctamente."}
        </p>

        {isCrisis && (
          <div className="w-full mb-7 flex flex-col gap-3">
            {[
              { name: "Linea Cero Suicidios", number: "075" },
              { name: "Linea de la Vida", number: "800-911-2000" },
              { name: "SAPTEL", number: "55-5603-0000" },
            ].map((h) => (
              <button
                key={h.number}
                onClick={() => window.open(`tel:${h.number}`, "_self")}
                className="w-full flex items-center p-5 rounded-3xl border bg-transparent cursor-pointer"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mr-4"
                  style={{
                    backgroundColor: "#EF4444",
                    boxShadow: "0 6px 12px rgba(239,68,68,0.4)",
                  }}
                >
                  <Icon name="phone-outline" size={22} color="#FFF" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white text-[17px] font-extrabold">{h.name}</p>
                  <p className="text-[#FCA5A5] text-[15px] font-black mt-0.5">{h.number}</p>
                </div>
                <Icon name="chevron-right" size={22} color="#94A3B8" />
              </button>
            ))}
          </div>
        )}

        <button
          onClick={handleClose}
          className="w-full py-[22px] rounded-3xl text-white text-lg font-black tracking-[0.8px] cursor-pointer border-none"
          style={{ backgroundColor: config.icon }}
        >
          {isCrisis ? "Entendido" : "Cerrar"}
        </button>
      </div>
    </div>
  );
}
