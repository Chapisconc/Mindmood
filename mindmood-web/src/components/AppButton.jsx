import { Button } from "@/components/ui/button";
import { useTheme } from "@/theme/ThemeContext";

export default function AppButton({ title, onClick, loading = false, className = "" }) {
  const { themeStyles } = useTheme();
  const gradient = themeStyles.accentGradient;

  return (
    <Button
      onClick={onClick}
      disabled={loading}
      className={`group relative w-full h-14 text-[17px] font-extrabold tracking-[0.8px] uppercase rounded-[28px] disabled:opacity-60 overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${className}`}
      style={{
        background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]}, ${gradient[2]})`,
        backgroundSize: "200% 200%",
        animation: "gradient-x 4s ease infinite",
        boxShadow: `0 0 30px ${gradient[0]}40, 0 8px 20px ${gradient[1]}30`,
      }}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
        </span>
      ) : (
        <span className="text-white drop-shadow-sm">{title}</span>
      )}
    </Button>
  );
}
