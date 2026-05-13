import { Flame, X } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";

export default function StreakModal({ visible, streak, onClose }) {
  const { themeStyles } = useTheme();

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ backgroundColor: "rgba(15, 10, 30, 0.85)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-[40px] p-8 flex flex-col items-center"
        style={{
          background: `linear-gradient(135deg, ${themeStyles.cardGradient[0] || themeStyles.card}, ${themeStyles.cardGradient[1] || themeStyles.card})`,
          boxShadow: `0 12px 30px ${themeStyles.shadow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-transparent border-none cursor-pointer"
        >
          <X size={24} color={themeStyles.secondaryText} />
        </button>

        <div className="mb-6 flex items-center justify-center">
          <div className="p-6 rounded-full" style={{ backgroundColor: "rgba(245, 158, 11, 0.15)" }}>
            <div className="p-[18px] rounded-full" style={{ backgroundColor: "rgba(245, 158, 11, 0.25)" }}>
              <Flame size={90} color="#F59E0B" />
            </div>
          </div>
        </div>

        <p
          className="text-[26px] font-black text-center mb-2"
          style={{ color: themeStyles.text }}
        >
          ¡Increíble Racha! 🚀
        </p>
        <p className="text-[56px] font-black mb-[18px]" style={{ color: "#F59E0B" }}>
          {streak} Días
        </p>
        <p
          className="text-base text-center leading-6 mb-8 px-2"
          style={{ color: themeStyles.secondaryText }}
        >
          Has mantenido tu bienestar como prioridad por {streak} días consecutivos. ¡Sigue así, tu mente te lo agradece!
        </p>

        <button
          onClick={onClose}
          className="w-full py-[18px] rounded-[22px] text-white text-[17px] font-extrabold cursor-pointer border-none"
          style={{ backgroundColor: "#F59E0B", boxShadow: "0 6px 12px rgba(245,158,11,0.4)" }}
        >
          ¡Entendido!
        </button>
      </div>
    </div>
  );
}
