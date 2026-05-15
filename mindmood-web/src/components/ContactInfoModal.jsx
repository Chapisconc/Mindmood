/* ==========================================================================
   ContactInfoModal.jsx — MODAL DE CONTACTO DEL ADMINISTRADOR
   Muestra información de contacto de un administrador o profesional
   (teléfono y correo) con botones para llamar o enviar correo.
   ========================================================================== */

// Íconos de lucide-react para cerrar, teléfono y correo
import { X, Phone, Mail } from "lucide-react";

/* MOOD_COLORS — Mapa de colores (no usado directamente pero importado
   para mantener consistencia con otros modales) */
const MOOD_COLORS = {
  Excelente: "#10B981", Feliz: "#EC4899", Agradecido: "#FBBF24",
  Sorpresa: "#06B6D4", Neutral: "#A78BFA", Enojo: "#F97316",
  Ansiedad: "#8B5CF6", Miedo: "#7C3AED", Triste: "#F43F5E",
  Asco: "#84CC16", Crisis: "#EF4444", Indeterminado: "#64748B",
};

/**
 * ContactInfoModal — Modal que muestra los datos de contacto
 * del administrador (nombre, teléfono, correo).
 *
 * @prop {boolean}  visible    — Controla la visibilidad del modal
 * @prop {Function} onClose    — Callback al cerrar
 * @prop {string}   adminName  — Nombre del administrador/profesional
 * @prop {string}   adminEmail — Correo electrónico de contacto
 * @prop {string}   adminPhone — Teléfono de contacto
 */
export default function ContactInfoModal({ visible, onClose, adminName, adminEmail, adminPhone }) {
  /* Color acento principal (verde esmeralda) */
  const ACCENT = "#10B981";

  if (!visible) return null;

  // Fondo oscuro con blur
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-3xl p-8 flex flex-col items-center border"
        style={{ backgroundColor: "#0F0A1A", borderColor: `${ACCENT}40` }}
        onClick={(e) => e.stopPropagation()}>
        {/* Botón de cerrar (X) */}
        <button onClick={onClose} className="absolute top-4 right-4 bg-transparent border-none cursor-pointer p-1">
          <X size={20} color="#64748B" />
        </button>

        {/* Ícono de teléfono en un círculo con sombra */}
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: ACCENT, boxShadow: `0 8px 16px ${ACCENT}60` }}>
          <Phone size={24} color="#FFF" />
        </div>

        {/* Nombre del administrador */}
        <p className="text-lg font-black text-center text-white mb-1">{adminName || "Contacto Profesional"}</p>
        <p className="text-[10px] font-extrabold uppercase tracking-wider mb-6" style={{ color: ACCENT }}>Administrador</p>

        {/* Fila de teléfono */}
        {adminPhone && (
          <div className="w-full flex items-center gap-3 p-4 rounded-2xl mb-2.5" style={{ backgroundColor: `${ACCENT}10`, border: `1px solid ${ACCENT}25` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${ACCENT}18` }}>
              <Phone size={18} color={ACCENT} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-extrabold uppercase tracking-wider" style={{ color: ACCENT }}>Teléfono</p>
              <p className="text-sm font-bold text-white truncate">{adminPhone}</p>
            </div>
          </div>
        )}

        {/* Fila de correo electrónico */}
        {adminEmail && (
          <div className="w-full flex items-center gap-3 p-4 rounded-2xl mb-2.5" style={{ backgroundColor: "#8B5CF610", border: `1px solid #8B5CF625` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#8B5CF618" }}>
              <Mail size={18} color="#8B5CF6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-extrabold uppercase tracking-wider" style={{ color: "#8B5CF6" }}>Correo</p>
              <p className="text-sm font-bold text-white truncate">{adminEmail}</p>
            </div>
          </div>
        )}

        {/* Botón para llamar por teléfono */}
        {adminPhone && (
          <button onClick={() => window.open(`tel:${adminPhone}`, "_self")}
            className="w-full py-3.5 rounded-2xl text-sm font-bold border-none cursor-pointer text-white mt-2"
            style={{ backgroundColor: ACCENT }}>
            <Phone size={16} className="inline mr-2" />Llamar Ahora
          </button>
        )}
        {/* Botón para enviar correo */}
        {adminEmail && (
          <button onClick={() => window.open(`mailto:${adminEmail}`, "_self")}
            className="w-full py-3.5 rounded-2xl text-sm font-bold border border-[#8B5CF6] cursor-pointer mt-2"
            style={{ backgroundColor: "#8B5CF615", color: "#8B5CF6" }}>
            <Mail size={16} className="inline mr-2" />Enviar Correo
          </button>
        )}
        {/* Botón de cerrar simple */}
        <button onClick={onClose} className="w-full py-3 bg-transparent border-none cursor-pointer mt-2">
          <p className="text-xs font-bold text-slate-500">Cerrar</p>
        </button>
      </div>
    </div>
  );
}
