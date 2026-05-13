import { X, Phone, Mail } from "lucide-react";

export default function ContactInfoModal({ visible, onClose, adminName, adminEmail, adminPhone }) {
  const ACCENT = "#10B981";

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(15, 10, 30, 0.85)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-[36px] p-8 flex flex-col items-center border-[1.5px]"
        style={{
          backgroundColor: "#fff",
          borderColor: "#e5e7eb",
          boxShadow: `0 20px 40px rgba(0,0,0,0.4)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-transparent border-none cursor-pointer"
        >
          <X size={24} color="#9CA3AF" />
        </button>

        <div
          className="w-[88px] h-[88px] rounded-full flex items-center justify-center mb-5"
          style={{
            backgroundColor: ACCENT,
            boxShadow: `0 10px 16px ${ACCENT}60`,
          }}
        >
          <Phone size={38} color="#FFF" />
        </div>

        <p className="text-[22px] font-black text-center mb-1" style={{ color: "#111827" }}>
          {adminName || "Contacto Profesional"}
        </p>
        <p className="text-[13px] font-extrabold uppercase tracking-[1.5px] mb-7" style={{ color: ACCENT }}>
          Administrador
        </p>
        <div className="w-[50px] h-1 rounded mb-7" style={{ backgroundColor: ACCENT }} />

        {adminPhone && (
          <div
            className="w-full flex items-center p-4 rounded-xl mb-3 border"
            style={{ backgroundColor: "rgba(16, 185, 129, 0.10)", borderColor: "rgba(16, 185, 129, 0.25)" }}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center mr-3"
              style={{ backgroundColor: "rgba(16, 185, 129, 0.15)" }}
            >
              <Phone size={22} color={ACCENT} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-extrabold uppercase tracking-[1px]" style={{ color: ACCENT }}>Teléfono</p>
              <p className="text-base font-bold" style={{ color: "#111827" }}>{adminPhone}</p>
            </div>
          </div>
        )}

        {adminEmail && (
          <div
            className="w-full flex items-center p-4 rounded-xl mb-3 border"
            style={{ backgroundColor: "rgba(124, 58, 237, 0.08)", borderColor: "rgba(124, 58, 237, 0.2)" }}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center mr-3"
              style={{ backgroundColor: "rgba(124, 58, 237, 0.15)" }}
            >
              <Mail size={22} color="#8B5CF6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[1px]" style={{ color: "#8B5CF6" }}>Correo</p>
              <p className="text-base font-bold truncate" style={{ color: "#111827" }}>{adminEmail}</p>
            </div>
          </div>
        )}

        <div className="w-full mt-2 flex flex-col gap-3">
          {adminPhone && (
            <button
              onClick={() => window.open(`tel:${adminPhone}`, "_self")}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white text-[17px] font-black cursor-pointer border-none"
              style={{ backgroundColor: ACCENT }}
            >
              <Phone size={20} color="#FFF" />
              Llamar Ahora
            </button>
          )}
          {adminEmail && (
            <button
              onClick={() => window.open(`mailto:${adminEmail}?subject=${encodeURIComponent("MindMood - Solicitud de Contacto")}`, "_self")}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-[#8B5CF6] text-[17px] font-black cursor-pointer border-[1.5px]"
              style={{ backgroundColor: "rgba(124, 58, 237, 0.15)", borderColor: "#8B5CF6" }}
            >
              <Mail size={20} color="#8B5CF6" />
              Enviar Correo
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-4 bg-transparent border-none cursor-pointer"
          >
            <p className="text-base font-extrabold text-center" style={{ color: "#6B7280" }}>Cerrar</p>
          </button>
        </div>
      </div>
    </div>
  );
}
