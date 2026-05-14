import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, Award, Target, TrendingUp, BarChart3 } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from "recharts";
import { useStats } from "../hooks/useStats";

const PIE_COLORS = ["#EC4899", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#F97316", "#84CC16", "#7C3AED", "#F43F5E"];

export default function Stats() {
  const navigate = useNavigate();
  const { themeStyles } = useTheme();
  const { loading, stats } = useStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

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

  const { totalCount, lineData, pieData, radarData, maxCount, dominant } = stats;

  const barData = (pieData || []).map(d => ({ name: d.emotionName, count: d.valueCount, color: d.color }));

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-12 py-6 lg:py-12 relative z-10 space-y-8 pb-24">
        <header className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors dark:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-black dark:text-white">Estadísticas</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Zap, bg: "bg-indigo-50 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400", label: "Registros Totales", value: totalCount },
            { icon: Award, bg: "bg-rose-50 dark:bg-rose-900/30", text: "text-rose-600 dark:text-rose-400", label: "Mejor Racha", value: "15 Días" },
            { icon: Target, bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", label: "Mood Promedio", value: dominant?.name || "Estable" },
          ].map((card, i) => (
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

        <div className="grid lg:grid-cols-2 gap-8">
          <section className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
            <h2 className="text-xl font-black mb-8 dark:text-white">Distribución Dominante</h2>
            <div className="flex-1 flex flex-col md:flex-row items-center gap-8">
              <div className="h-[400px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={pieData} dataKey="valueCount" nameKey="emotionName" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={10} stroke="none">
                      {pieData.map((entry, i) => <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "24px", border: "none", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", fontSize: "12px", fontWeight: "800" }} />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-black dark:text-white">{totalCount}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registros</span>
                </div>
              </div>
              <div className="w-full md:w-1/3 grid grid-cols-2 md:grid-cols-1 gap-3">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-[10px] font-black dark:text-white uppercase tracking-tighter truncate max-w-[80px]">{d.emotionName}</span>
                    </div>
                    <span className="text-xs font-black text-slate-500">{d.valueCount}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-black mb-8 dark:text-white">Frecuencia por Emoción</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: "#64748B" }} />
                  <Tooltip cursor={{ fill: "transparent" }} />
                  <Bar dataKey="count" radius={[0, 10, 10, 0]}>
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
