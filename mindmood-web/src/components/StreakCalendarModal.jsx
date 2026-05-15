/* ==========================================================================
   StreakCalendarModal.jsx — CALENDARIO DE RACHA (MindMood)
   Modal que muestra un calendario mensual con los días en los que
   el usuario ha registrado entradas (marcados en ámbar con una mini llama).
   Permite navegar entre meses y consultar la racha actual.
   ========================================================================== */

// Hooks de React: estado local y efectos secundarios
import { useEffect, useState } from "react";

// Íconos de lucide-react
import { X, Flame, ChevronLeft, ChevronRight } from "lucide-react";

// Servicio de Supabase para consultar entradas del usuario
import { supabase } from "../services/supabase";

// Contextos personalizados
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../hooks/useAuth";

/* Nombres de los meses en español */
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/* Etiquetas de los días de la semana (abreviadas) */
const WEEK_LABELS = ["D", "L", "M", "M", "J", "V", "S"];

/**
 * StreakCalendarModal — Modal de calendario de racha.
 * Consulta las entradas del usuario en Supabase y las pinta
 * en un calendario mensual navegable.
 *
 * @prop {boolean}  visible — Controla visibilidad
 * @prop {Function} onClose — Callback al cerrar
 */
export default function StreakCalendarModal({ visible, onClose }) {
  const { themeStyles } = useTheme();
  const { user, profile } = useAuth();

  /* Estado: fechas activas agrupadas por mes (clave "YYYY-M") */
  const [activeDates, setActiveDates] = useState({});

  /* Estado: mes actualmente visible en el calendario */
  const [currentMonth, setCurrentMonth] = useState(new Date());

  /* Estado: racha de días consecutivos desde el perfil */
  const [streakDays, setStreakDays] = useState(0);

  /**
   * useEffect — Cuando el modal se abre y hay usuario,
   * dispara la carga de las fechas activas desde Supabase.
   * Dependencias: visible, user.
   */
  useEffect(() => {
    if (!visible || !user) return;
    fetchAllMonths();
  }, [visible, user]);

  /**
   * fetchAllMonths — Consulta las entradas del usuario en Supabase
   * desde varios meses atrás (calculados según la racha) y las
   * agrupa por mes en un objeto { "YYYY-M": [día, día, ...] }.
   */
  const fetchAllMonths = async () => {
    const streak = profile?.streak || 0;
    setStreakDays(streak);
    const monthsToFetch = Math.max(3, Math.ceil(streak / 28) + 1);
    const start = new Date();
    start.setMonth(start.getMonth() - monthsToFetch);
    start.setDate(1);

    const { data, error } = await supabase
      .from("entries")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", start.toISOString());

    if (!error && data) {
      /* Agrupa fechas por mes usando un Set para evitar duplicados */
      const byMonth = {};
      data.forEach((item) => {
        const d = new Date(item.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!byMonth[key]) byMonth[key] = new Set();
        byMonth[key].add(d.getDate());
      });
      /* Convierte los Sets a arreglos */
      const asObj = {};
      Object.entries(byMonth).forEach(([k, days]) => {
        asObj[k] = [...days];
      });
      setActiveDates(asObj);
    }
  };

  /* Clave del mes actual para consultar activeDates */
  const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
  const activeDatesForMonth = activeDates[monthKey] || [];

  /**
   * prevMonth — Retrocede un mes en el calendario.
   */
  const prevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  /**
   * nextMonth — Avanza un mes en el calendario.
   */
  const nextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  /**
   * renderDays — Genera los componentes <div> para cada día
   * del mes, incluyendo:
   *   - Días vacíos (padding) para alinear con el primer día
   *   - Días activos (con entrada) en ámbar con mini llama
   *   - Día actual con borde de acento
   */
  const renderDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const today = new Date();
    const days = [];

    /* Días vacíos para alinear el primer día del mes */
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`e-${i}`} className="w-[36px] h-[36px]" />);
    }

    /* Días del mes */
    for (let i = 1; i <= daysInMonth; i++) {
      const isActive = activeDatesForMonth.includes(i);
      const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      days.push(
        <div key={i} className="w-[36px] h-[36px] flex items-center justify-center relative">
          <div
            className="flex items-center justify-center w-[34px] h-[34px]"
            style={{
              borderRadius: 999,
              backgroundColor: isActive ? "#F59E0B" : "transparent",
              border: isToday ? `2px solid ${themeStyles.accent}` : "none",
            }}
          >
            <span className="text-sm font-bold" style={{ color: isActive || isToday ? "#FFF" : themeStyles.text }}>
              {i}
            </span>
          </div>
          {/* Mini llama debajo de los días activos */}
          {isActive && (
            <Flame size={9} color="#FFF" className="absolute -bottom-[1px]" fill="#F59E0B" />
          )}
        </div>
      );
    }
    return days;
  };

  if (!visible) return null;

  return (
    /* Fondo oscuro semi-transparente */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ backgroundColor: "rgba(15, 10, 30, 0.8)" }}
      onClick={onClose}
    >
      {/* Contenedor del calendario */}
      <div
        className="w-full max-w-sm rounded-[36px] p-7"
        style={{
          backgroundColor: themeStyles.card,
          boxShadow: `0 20px 30px ${themeStyles.shadow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado: racha + botón cerrar */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-4xl font-black" style={{ color: "#F59E0B" }}>
            {streakDays}
          </p>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1">
            <X size={24} style={{ color: themeStyles.secondaryText }} />
          </button>
        </div>
        <p className="text-xs font-black uppercase tracking-[0.3em] mb-6" style={{ color: themeStyles.secondaryText }}>
          Días en racha
        </p>

        {/* Navegación de meses: < mes > */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevMonth} className="bg-transparent border-none cursor-pointer p-1 hover:opacity-70">
            <ChevronLeft size={20} style={{ color: themeStyles.secondaryText }} />
          </button>
          <p className="text-base font-black" style={{ color: themeStyles.text }}>
            {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </p>
          <button onClick={nextMonth} className="bg-transparent border-none cursor-pointer p-1 hover:opacity-70">
            <ChevronRight size={20} style={{ color: themeStyles.secondaryText }} />
          </button>
        </div>

        {/* Encabezados de días de la semana */}
        <div className="flex justify-between mb-2 px-[2px]">
          {WEEK_LABELS.map((d, i) => (
            <span key={`${d}-${i}`} className="text-[11px] font-black text-center w-[36px]" style={{ color: themeStyles.secondaryText }}>
              {d}
            </span>
          ))}
        </div>

        {/* Cuadrícula de días */}
        <div className="flex flex-wrap">{renderDays()}</div>

        {/* Leyenda: círculo ámbar = día con entrada */}
        <div className="mt-6 pt-4 flex items-center gap-2" style={{ borderTop: "1px solid rgba(124, 58, 237, 0.15)" }}>
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#F59E0B" }} />
          <span className="text-xs font-bold" style={{ color: themeStyles.secondaryText }}>
            Días con entrada
          </span>
        </div>
      </div>
    </div>
  );
}
