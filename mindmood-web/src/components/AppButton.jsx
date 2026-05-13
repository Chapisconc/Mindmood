import { Loader } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";

export default function AppButton({ title, onClick, loading = false, className = "" }) {
  const { themeStyles } = useTheme();
  const gradient = themeStyles.accentGradient;

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full rounded-[28px] relative overflow-hidden transition-all duration-200 active:scale-[0.97] disabled:opacity-60 ${className}`}
      style={{
        boxShadow: `0 12px 20px ${gradient[0]}80`,
      }}
    >
      <div
        className="py-[22px] px-6 flex items-center justify-center min-h-[64px]"
        style={{
          background: `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]}, ${gradient[2]})`,
        }}
      >
        {loading ? (
          <Loader className="animate-spin text-white" size={22} />
        ) : (
          <span className="text-white font-extrabold text-[17px] tracking-[0.8px] uppercase">
            {title}
          </span>
        )}
      </div>
    </button>
  );
}
