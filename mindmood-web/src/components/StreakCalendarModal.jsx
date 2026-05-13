import { useEffect, useState } from "react";
import { X, Flame } from "lucide-react";
import { supabase } from "../services/supabase";
import { useTheme } from "../theme/ThemeContext";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const WEEK_LABELS = ["D", "L", "M", "M", "J", "V", "S"];

export default function StreakCalendarModal({ visible, onClose, userId }) {
  const { themeStyles } = useTheme();
  const [activeDates, setActiveDates] = useState([]);
  const [currentMonth] = useState(new Date());

  useEffect(() => {
    async function fetchActiveDates() {
      if (!visible || !userId) return;
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from("entries")
        .select("created_at")
        .eq("user_id", userId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (!error && data) {
        const dates = data.map((item) => new Date(item.created_at).getDate());
        setActiveDates([...new Set(dates)]);
      }
    }

    fetchActiveDates();
  }, [visible, userId, currentMonth]);

  const renderDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const today = new Date();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="flex items-center justify-center mb-[6px]"
          style={{ width: 40, height: 48 }}
        />
      );
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const isActive = activeDates.includes(i);
      const isToday =
        i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      days.push(
        <div
          key={i}
          className="flex items-center justify-center mb-[6px] relative"
          style={{ width: 40, height: 48 }}
        >
          <div
            className="flex items-center justify-center relative"
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: isActive ? "#F59E0B" : "transparent",
              border: isToday ? `2px solid ${themeStyles.accent}` : "none",
            }}
          >
            <span
              className="text-[15px] font-bold"
              style={{ color: isActive ? "#FFF" : themeStyles.text }}
            >
              {i}
            </span>
            {isActive && (
              <Flame
                size={10}
                color="#FFF"
                className="absolute -bottom-[2px]"
              />
            )}
          </div>
        </div>
      );
    }
    return days;
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ backgroundColor: "rgba(15, 10, 30, 0.8)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[36px] p-7"
        style={{
          backgroundColor: themeStyles.card,
          boxShadow: `0 20px 30px ${themeStyles.shadow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <p className="text-[22px] font-black" style={{ color: themeStyles.text }}>
            {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </p>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer">
            <X size={30} color={themeStyles.secondaryText} />
          </button>
        </div>

        <div className="flex justify-between mb-3">
          {WEEK_LABELS.map((d, i) => (
            <span
              key={`${d}-${i}`}
              className="text-xs font-extrabold text-center"
              style={{ width: 40, color: themeStyles.secondaryText }}
            >
              {d}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap justify-start">{renderDays()}</div>

        <div
          className="mt-6 pt-[18px] flex items-center gap-2"
          style={{ borderTop: "1px solid rgba(124, 58, 237, 0.15)" }}
        >
          <div className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: "#F59E0B" }} />
          <span className="text-[13px] font-semibold" style={{ color: themeStyles.secondaryText }}>
            Días con actividad
          </span>
        </div>
      </div>
    </div>
  );
}
