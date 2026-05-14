/* ==========================================================================
   AppButton.jsx — BOTÓN PRINCIPAL DE LA APLICACIÓN (MindMood)
   Componente reutilizable que envuelve <Button> de shadcn/ui
   con un degradado de acento y un spinner de carga.
   Se usa en formularios de login, registro y acciones principales.
   ========================================================================== */

/* shadcn/ui: botón base con variantes (default, outline, ghost, etc.) */
import { Button } from "@/components/ui/button";

/* Tema: provee los colores de acento para el degradado */
import { useTheme } from "@/theme/ThemeContext";

/**
 * AppButton — Botón de ancho completo con degradado, sombra
 * y estado de carga. Deshabilita el botón mientras loading=true.
 *
 * @prop {string}   title     — Texto del botón
 * @prop {Function} onClick   — Callback al hacer clic
 * @prop {boolean}  loading   — Muestra spinner y deshabilita (default: false)
 * @prop {string}   className — Clases adicionales Tailwind
 */
export default function AppButton({ title, onClick, loading = false, className = "" }) {
  const { themeStyles } = useTheme();
  const gradient = themeStyles.accentGradient;

  return (
    <Button
      onClick={onClick}
      disabled={loading}
      className={`w-full h-14 text-[17px] font-extrabold tracking-[0.8px] uppercase rounded-[28px] disabled:opacity-60 ${className}`}
      style={{
        /* Degradado de tres colores desde el tema */
        background: `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]}, ${gradient[2]})`,
        boxShadow: `0 12px 20px ${gradient[0]}80`,
      }}
    >
      {loading ? (
        /* Spinner animado mientras carga */
        <span className="flex items-center gap-2">
          <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
        </span>
      ) : (
        <span className="text-white">{title}</span>
      )}
    </Button>
  );
}
