/* ======================================================
   FILE: Stats.jsx  —  Estadísticas y gráficos
   Ruta:  /stats
   Auth:  Requiere usuario autenticado
   Propósito: Panel de estadísticas con gráficos de
              recharts: distribución de emociones (pie),
              frecuencia por emoción (bar), tarjetas
              resumen (total, racha, mood promedio).
   ====================================================== */

// React hook para estado local
import { useState } from "react";
// Navegación programática
import { useNavigate } from "react-router-dom";
// Animaciones de entrada
import { motion } from "framer-motion";
// Iconos: rayo, trofeo, objetivo, tendencia, gráfico
import { Zap, Award, Target, TrendingUp, BarChart3 } from "lucide-react";
// Hook personalizado del tema
import { useTheme } from "../theme/ThemeContext";
// Componentes de recharts para gráficos (barras y pastel anidado)
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from "recharts";
// Hook personalizado que obtiene y procesa las estadísticas desde Supabase
import { useStats } from "../hooks/useStats";

/**
 * PIE_COLORS: Paleta de colores para el gráfico de pastel (pie chart).
 * Se asigna cíclicamente a cada emoción en el orden del array pieData.
 */
const PIE_COLORS = ["#EC4899", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#F97316", "#84CC16", "#7C3AED", "#F43F5E"];

export default function Stats() {
  // Hook de navegación (no usado directamente en este componente, pero disponible)
  const navigate = useNavigate();
  // Estilos del tema (no se usa theme directamente, solo themeStyles si aplicara)
  const { themeStyles } = useTheme();
  // Hook personalizado: loading + stats (totalCount, lineData, pieData, radarData, maxCount, dominant)
  const { loading, stats } = useStats();

  /* Spinner de carga mientras se obtienen las estadísticas */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  /* Estado vacío: si no hay stats o totalCount es 0 (usuario sin entradas) */
  if (!stats || stats.totalCount === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center px-10">
          <BarChart3 className="w-20 h-20 mb-6 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-2xl font-black mb-3 dark:text-white">Aún no hay datos</p>
          <p className="text-base font-semibold text-slate-400">Registra tu primera entrada para ver estadísticas.</p>
        </motion.div>
      </div>
    );
  }

  // Desestructuración de stats: datos agregados desde useStats
  const { totalCount, lineData, pieData, radarData, maxCount, dominant } = stats;

  /**
   * barData: Transforma pieData (de gráfico circular) a formato para BarChart horizontal.
   * Cada entrada: { name: "Feliz", count: 5, color: "#F472B6" }
   */
  const barData = (pieData || []).map(d => ({ name: d.emotionName, count: d.valueCount, color: d.color }));

  return (
    /* Fondo principal claro/oscuro */
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 relative overflow-hidden">

      {/* Círculos decorativos de fondo con blur */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Contenedor principal con ancho máximo y padding responsivo */}
      <div className="max-w-7xl mx-auto px-4 lg:px-12 py-6 lg:py-12 relative z-10 space-y-8 pb-24">

        {/* Encabezado de la página */}
        <header className="mb-6">
          <h1 className="text-3xl font-black dark:text-white">Estadísticas</h1>
        </header>

        {/* Tarjetas de resumen: total de registros, mejor racha, mood promedio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Zap, bg: "bg-indigo-50 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400", label: "Registros Totales", value: totalCount },
            { icon: Award, bg: "bg-rose-50 dark:bg-rose-900/30", text: "text-rose-600 dark:text-rose-400", label: "Mejor Racha", value: "15 Días" },
            { icon: Target, bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", label: "Mood Promedio", value: dominant?.name || "Estable" },
          ].map((card, i) => (
            /* Cada tarjeta con animación escalonada, icono, label y valor */
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="p-6 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4"
            >
              <div className={`w-14 h-14 rounded-2xl ${card.bg} flex items-center justify-center ${card.text} shrink-0`}>
                <card.icon className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider truncate">{card.label}</p>
                <p className="text-2xl font-black dark:text-white">{card.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Grid de dos columnas en desktop: gráfico de pastel + gráfico de barras */}
        <div className="grid lg:grid-cols-2 gap-8">

          {/* SECCIÓN: Gráfico de distribución dominante (PieChart con agujero tipo donut) */}
          <section className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
            <h2 className="text-xl font-black mb-8 dark:text-white">Distribución Dominante</h2>
            <div className="flex-1 flex flex-col md:flex-row items-center gap-8">

              {/* Contenedor del gráfico de pastel (responsivo) */}
              <div className="h-[400px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  {/* RePieChart: gráfico donut con radio interno 70 y externo 100 */}
                  <RePieChart>
                    <Pie data={pieData} dataKey="valueCount" nameKey="emotionName" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={10} stroke="none">
                      {pieData.map((entry, i) => <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    {/* Tooltip con estilo personalizado */}
                    <Tooltip contentStyle={{ borderRadius: "24px", border: "none", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", fontSize: "12px", fontWeight: "800" }} />
                  </RePieChart>
                </ResponsiveContainer>

                {/* Texto centrado sobre el gráfico: mood promedio + label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black dark:text-white text-center leading-tight px-4">{dominant?.name || "Estable"}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Mood Promedio</span>
                </div>
              </div>

              {/* Leyenda del pastel: lista de emociones con círculo de color */}
              <div className="w-full md:w-1/3 grid grid-cols-2 md:grid-cols-1 gap-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-[10px] font-bold dark:text-white leading-tight truncate">{d.emotionName}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECCIÓN: Gráfico de frecuencia por emoción (BarChart horizontal) */}
          <section className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-black mb-8 dark:text-white">Frecuencia por Emoción</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {/* BarChart con layout vertical (barras horizontales) */}
                <BarChart data={barData} layout="vertical" margin={{ left: 40 }}>
                  <XAxis type="number" hide />
                  {/* Eje Y: nombres de emociones */}
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: "#64748B" }} />
                  <Tooltip cursor={{ fill: "transparent" }} />
                  {/* Barra con esquinas redondeadas a la derecha */}
                  <Bar dataKey="count" radius={[0, 10, 10, 0]}>
                    {/* Cada barra se pinta con el color de su emoción */}
                    {barData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.color || PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
