import { X, CheckCircle, AlertCircle, BellOff, Flame } from "lucide-react";
import Icon from "./Icon";

const ICON_MAP = {
  "checkmark-circle": CheckCircle,
  "alert-circle": AlertCircle,
  "notifications-off": BellOff,
  fire: Flame,
};

export default function NoticeModal({ visible, onClose, title = "", message = "", icon = "checkmark-circle", color = "#10B981" }) {
  if (!visible) return null;

  const IconComponent = ICON_MAP[icon] || CheckCircle;

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
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{
            backgroundColor: color,
            boxShadow: `0 10px 16px ${color}60`,
          }}
        >
          <IconComponent size={40} color="#FFF" />
        </div>

        <p className="text-[26px] font-black text-center mb-3" style={{ color: "#111827" }}>
          {title}
        </p>
        <div className="w-[50px] h-1 rounded mb-6" style={{ backgroundColor: color }} />

        <p
          className="text-[17px] text-center leading-[26px] font-semibold mb-8"
          style={{ color: "#6B7280" }}
        >
          {message}
        </p>

        <button
          onClick={onClose}
          className="w-full py-5 rounded-[22px] text-white text-lg font-black cursor-pointer border-none"
          style={{
            backgroundColor: color,
            boxShadow: `0 8px 16px ${color}60`,
          }}
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
