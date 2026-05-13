import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Maximize2, X, TrendingUp, Activity, Smile, ArrowLeft } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import RadarChart from "../components/RadarChart";
import Icon from "../components/Icon";
import { useStats } from "../hooks/useStats";
import { ChartContainer, ChartTooltipContent } from "../components/ui/Chart";

export default function Stats() {
  const navigate = useNavigate();
  const { themeStyles } = useTheme();
  const { loading, stats } = useStats();
  const [popout, setPopout] = useState({ visible: false, type: null });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: themeStyles.background }}>
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
          <div className="absolute inset-1 rounded-full border-2 border-transparent border-b-pink-500 animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
        </div>
      </div>
    );
  }

  if (!stats || stats.totalCount === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: themeStyles.background }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center px-10"
        >
          <div className="text-7xl mb-6">📊</div>
          <p className="text-2xl font-black mb-3" style={{ color: themeStyles.text }}>
            Aún no hay datos
          </p>
          <p className="text-base font-semibold" style={{ color: themeStyles.secondaryText }}>
            Registra tu primera entrada para ver estadísticas.
          </p>
        </motion.div>
      </div>
    );
  }

  const { totalCount, lineData, pieData, radarData, maxCount, dominant } = stats;

  const lineConfig = { value: { label: "Ánimo", color: "#EC4899" } };
  const pieConfig = {};
  pieData?.forEach((d) => { pieConfig[d.emotionName] = { label: d.emotionName, color: d.color }; });

  const pieColors = ["#EC4899", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#F97316", "#84CC16", "#7C3AED", "#F43F5E"];

  const glass = { backgroundColor: themeStyles.glassBg, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderColor: themeStyles.border };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: themeStyles.background }}>
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-[100px] opacity-[0.06]" style={{ backgroundColor: themeStyles.accent }} />
      <div className="max-w-lg mx-auto pb-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="px-6 pt-8 pb-2">
            <button
              onClick={() => navigate("/home")}
              className="bg-transparent border-none cursor-pointer flex items-center gap-2 mb-2"
            >
              <ArrowLeft size={24} color={themeStyles.secondaryText} />
              <span className="text-sm font-bold" style={{ color: themeStyles.secondaryText }}>Volver</span>
            </button>
            <p className="text-3xl font-black tracking-tight" style={{ color: themeStyles.text }}>
              Estadísticas
            </p>
            <p className="text-base font-semibold mt-1" style={{ color: themeStyles.secondaryText }}>
              Resumen Semanal
            </p>
          </div>

          <div className="flex gap-3 px-6 mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 rounded-3xl p-5 border relative overflow-hidden"
              style={{
                ...glass,
                boxShadow: `0 8px 24px ${themeStyles.shadow}`,
              }}
            >
              <div
                className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl"
                style={{ backgroundColor: `${dominant.color}30` }}
              />
              <Smile size={24} color={dominant.color} />
              <p className="text-lg font-black mt-3" style={{ color: themeStyles.text }}>
                {dominant.name}
              </p>
              <p className="text-xs font-bold mt-1 opacity-60" style={{ color: themeStyles.secondaryText }}>
                Ánimo Frecuente
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="flex-1 rounded-3xl p-5 border relative overflow-hidden"
              style={{
                ...glass,
                boxShadow: `0 8px 24px ${themeStyles.shadow}`,
              }}
            >
              <div
                className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl"
                style={{ backgroundColor: "#EC489930" }}
              />
              <Activity size={24} color="#EC4899" />
              <p className="text-lg font-black mt-3" style={{ color: themeStyles.text }}>
                {totalCount}
              </p>
              <p className="text-xs font-bold mt-1 opacity-60" style={{ color: themeStyles.secondaryText }}>
                Total de Registros
              </p>
            </motion.div>
          </div>

          {lineData?.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mx-6 p-5 rounded-3xl border mb-4"
              style={{
                ...glass,
                boxShadow: `0 8px 24px ${themeStyles.shadow}`,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-base font-black" style={{ color: themeStyles.text }}>
                  Evolución Semanal
                </p>
                <TrendingUp size={18} color="#EC4899" />
              </div>
              <ChartContainer config={lineConfig} style={{ height: 220 }}>
                <AreaChart data={lineData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EC4899" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#EC4899" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.border} strokeOpacity={0.3} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fontWeight: 700, fill: themeStyles.secondaryText }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[-1, 1]}
                    tick={{ fontSize: 11, fontWeight: 700, fill: themeStyles.secondaryText }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => ["-1", "-0.5", "0", "0.5", "1"][(v + 1) * 2] || ""}
                  />
                  <RechartsTooltip
                    content={<ChartTooltipContent />}
                    cursor={{ stroke: themeStyles.glow, strokeWidth: 1, strokeDasharray: "4 4" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#EC4899"
                    strokeWidth={3}
                    fill="url(#moodGradient)"
                    dot={{ r: 4, fill: "#EC4899", stroke: themeStyles.card, strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#EC4899", stroke: themeStyles.card, strokeWidth: 3 }}
                  />
                </AreaChart>
              </ChartContainer>
            </motion.div>
          )}

          <div className="mx-6 p-5 rounded-3xl border mb-4"
            style={{ ...glass, boxShadow: `0 8px 24px ${themeStyles.shadow}` }}
          >
            <p className="text-base font-black mb-4" style={{ color: themeStyles.text }}>
              Balance Emocional
            </p>
            <div className="flex justify-center">
              <RadarChart data={radarData} maxValue={maxCount} size={280} />
            </div>
          </div>

          <div className="flex gap-3 px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex-1 p-5 rounded-3xl border"
              style={{ ...glass, boxShadow: `0 8px 24px ${themeStyles.shadow}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-black" style={{ color: themeStyles.text }}>
                  Distribución
                </p>
                <button
                  onClick={() => setPopout({ visible: true, type: "pie" })}
                  className="bg-transparent border-none cursor-pointer p-1 hover:opacity-70 transition-opacity"
                >
                  <Maximize2 size={16} color="#EC4899" />
                </button>
              </div>
              <div className="relative flex items-center justify-center" style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <Pie
                      data={pieData}
                      dataKey="valueCount"
                      nameKey="emotionName"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, i) => (
                        <Cell 
                          key={`cell-${i}`} 
                          fill={pieColors[i % pieColors.length]} 
                          stroke="none"
                          filter="url(#glow)"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {dominant && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <Icon name={dominant.icon} size={28} color={dominant.color} />
                    <p className="text-xs font-bold mt-1" style={{ color: dominant.color }}>
                      {dominant.name}
                    </p>
                    <p className="text-[10px] font-semibold opacity-60" style={{ color: themeStyles.secondaryText }}>
                      Predominante
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex-1 p-5 rounded-3xl border"
              style={{ ...glass, boxShadow: `0 8px 24px ${themeStyles.shadow}` }}
            >
              <p className="text-sm font-black mb-4" style={{ color: themeStyles.text }}>
                Estados
              </p>
              <div className="flex flex-col gap-2.5 max-h-[150px] overflow-y-auto">
                {pieData.map((item, i) => (
                  <div key={item.emotionName} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                    <span className="text-xs font-bold flex-1 truncate" style={{ color: themeStyles.secondaryText }}>
                      {item.emotionName}
                    </span>
                    <span className="text-xs font-black" style={{ color: themeStyles.text }}>
                      {Math.round((item.valueCount / totalCount) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {popout.visible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(15, 10, 30, 0.85)" }}
          onClick={() => setPopout({ visible: false, type: null })}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-4xl p-6 border"
            style={{ backgroundColor: themeStyles.glassBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderColor: themeStyles.border, boxShadow: `0 16px 48px ${themeStyles.shadow}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
              <p className="text-lg font-black" style={{ color: themeStyles.text }}>
                Distribución Detallada
              </p>
              <button
                onClick={() => setPopout({ visible: false, type: null })}
                className="bg-transparent border-none cursor-pointer p-1 hover:opacity-70 transition-opacity"
              >
                <X size={28} color="#EC4899" />
              </button>
            </div>

            <div className="flex flex-col items-center py-4">
              <div style={{ width: 260, height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="valueCount"
                      nameKey="emotionName"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={`pop-${i}`} fill={pieColors[i % pieColors.length]} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full mt-6 flex flex-col gap-2.5">
                {pieData.map((item, i) => (
                  <div
                    key={item.emotionName}
                    className="flex items-center p-3 rounded-2xl transition-colors hover:opacity-80"
                    style={{ backgroundColor: `${pieColors[i % pieColors.length]}15` }}
                  >
                    <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                    <span className="text-sm font-bold flex-1" style={{ color: themeStyles.secondaryText }}>
                      {item.emotionName}
                    </span>
                    <span className="text-sm font-black" style={{ color: themeStyles.text }}>
                      {Math.round((item.valueCount / totalCount) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
