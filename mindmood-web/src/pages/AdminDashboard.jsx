import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, PieChart, BarChart3, CheckCircle, Users, BookOpen, Search, Filter, AlertTriangle } from "lucide-react";
import { supabase } from "../services/supabase";
import { useTheme } from "../theme/ThemeContext";
import { EMOTIONS_MAP, getEmotionByName } from "../theme/emotions";
import { contactService } from "../services/contactService";
import RadarChart from "../components/RadarChart";
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const STATUS_COLORS = {
  active: { label: "Pendiente", color: "#EF4444" },
  working: { label: "En Proceso", color: "#F59E0B" },
  resolved: { label: "Resuelto", color: "#10B981" },
};

const pieColors = ["#EC4899", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#F97316", "#84CC16", "#7C3AED", "#F43F5E", "#14B8A6"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { themeStyles } = useTheme();
  const [stats, setStats] = useState(null);
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [chartMode, setChartMode] = useState("pie");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => { fetchAdminData(); }, []);

  const fetchAdminData = async () => {
    try {
      const { data: statsData } = await supabase.rpc("get_admin_stats");
      const { data: alarmsData } = await supabase.rpc("get_admin_alarms");
      if (statsData) setStats(statsData[0]);
      setAlarms(alarmsData || []);
    } catch (err) {
      if (import.meta.env.DEV) console.error("[Admin] Fetch Error:", err);
    } finally { setLoading(false); }
  };

  const updateStatus = async (alarmId, currentStatus) => {
    const nextStatus = { active: "working", working: "resolved", resolved: "active" }[currentStatus];
    try {
      await supabase.rpc("admin_update_entry_status", { target_entry_id: alarmId, new_status: nextStatus });
      fetchAdminData();
    } catch (err) {
      if (import.meta.env.DEV) console.error("[Admin] Status Update Error:", err);
    }
  };

  const handleContact = async (userId, entryId) => {
    if (confirm("¿Enviar invitación de contacto a este usuario?")) {
      const { error } = await contactService.adminInitiateContact(
        userId, entryId,
        "Un administrador desea hablar contigo sobre tu bienestar."
      );
      if (!error) {
        fetchAdminData();
      } else {
        alert(error.message);
      }
    }
  };

  const handleLogout = async () => {
    try { 
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
    } catch (_) {}
    navigate("/");
  };

  const totalEntries = stats ? stats.total_entries : 0;
  const chartData = EMOTIONS_MAP.map((emo) => {
    const keyMap = {
      Excelente: "excellent_entries", Feliz: "happy_entries", Agradecido: "gratitude_entries",
      Sorpresa: "surprise_entries", Neutral: "neutral_entries", Enojo: "anger_entries",
      Ansiedad: "anxiety_entries", Miedo: "fear_entries", Triste: "sad_entries",
      Asco: "disgust_entries", Crisis: "crisis_entries",
    };
    const value = stats ? stats[keyMap[emo.name]] || 0 : 0;
    return { name: emo.name, value, color: emo.color, percentage: totalEntries > 0 ? Math.round((value / totalEntries) * 100) : 0 };
  }).filter((i) => i.value > 0);

  const radarData = EMOTIONS_MAP.map((emo) => {
    const keyMap = {
      Excelente: "excellent_entries", Feliz: "happy_entries", Agradecido: "gratitude_entries",
      Sorpresa: "surprise_entries", Neutral: "neutral_entries", Enojo: "anger_entries",
      Ansiedad: "anxiety_entries", Miedo: "fear_entries", Triste: "sad_entries",
      Asco: "disgust_entries", Crisis: "crisis_entries",
    };
    return { label: emo.name, value: stats ? stats[keyMap[emo.name]] || 0 : 0 };
  });
  const maxCount = Math.max(...radarData.map((d) => d.value), 1);

  const dominant = stats
    ? EMOTIONS_MAP.reduce((p, c) => {
        const keyMap = {
          Excelente: "excellent_entries", Feliz: "happy_entries", Agradecido: "gratitude_entries",
          Sorpresa: "surprise_entries", Neutral: "neutral_entries", Enojo: "anger_entries",
          Ansiedad: "anxiety_entries", Miedo: "fear_entries", Triste: "sad_entries",
          Asco: "disgust_entries", Crisis: "crisis_entries",
        };
        return (stats[keyMap[c.name]] || 0) > (stats[keyMap[p.name]] || 0) ? c : p;
      }, EMOTIONS_MAP[4])
    : EMOTIONS_MAP[4];

  const filters = [
    { key: "all", label: "Todos" },
    { key: "pending", label: "Pendientes" },
    { key: "working", label: "En Proceso" },
    { key: "contacted", label: "Contactados" },
  ];

  const filteredAlarms = alarms.filter((a) => {
    const email = (a.student_email || a.email || "").toLowerCase();
    if (!email.includes(searchText.toLowerCase())) return false;
    if (filterStatus === "all") return true;
    if (filterStatus === "pending") return !a.contact_status && (a.status || "active") === "active";
    if (filterStatus === "working") return a.status === "working" || a.contact_status === "pending";
    if (filterStatus === "contacted") return a.contact_status === "accepted" || a.contact_status === "pending";
    return true;
  });

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: themeStyles.background }}>
      <div className="max-w-2xl mx-auto pb-20">
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <div>
            <p className="text-2xl font-black tracking-tight" style={{ color: themeStyles.text }}>
              Panel Admin
            </p>
            <p className="text-sm font-semibold opacity-70" style={{ color: themeStyles.secondaryText }}>
              Gestión de Bienestar
            </p>
          </div>
          <button onClick={handleLogout} className="p-3 rounded-2xl bg-transparent border-none cursor-pointer hover:bg-red-500/10 transition-colors">
            <LogOut size={22} color="#EF4444" />
          </button>
        </div>

        <div className="flex gap-3 px-5 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 rounded-3xl p-5 border relative overflow-hidden"
            style={{ backgroundColor: themeStyles.card, borderColor: themeStyles.border }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl" style={{ backgroundColor: "#10B98120" }} />
            <Users size={22} color="#10B981" />
            <p className="text-2xl font-black mt-3" style={{ color: themeStyles.text }}>{stats?.total_users || 0}</p>
            <p className="text-xs font-bold mt-1 opacity-60" style={{ color: themeStyles.secondaryText }}>Usuarios</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 rounded-3xl p-5 border relative overflow-hidden"
            style={{ backgroundColor: themeStyles.card, borderColor: themeStyles.border }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl" style={{ backgroundColor: "#EC489920" }} />
            <BookOpen size={22} color="#EC4899" />
            <p className="text-2xl font-black mt-3" style={{ color: themeStyles.text }}>{stats?.total_entries || 0}</p>
            <p className="text-xs font-bold mt-1 opacity-60" style={{ color: themeStyles.secondaryText }}>Diarios</p>
          </motion.div>
        </div>

        <div className="mx-5 p-5 rounded-3xl border mb-4"
          style={{ backgroundColor: themeStyles.card, borderColor: themeStyles.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-black" style={{ color: themeStyles.text }}>Distribución Emocional</p>
            <div className="flex gap-3">
              <button
                onClick={() => setChartMode("pie")}
                className="bg-transparent border-none cursor-pointer p-1 transition-opacity hover:opacity-70"
              >
                <PieChart size={20} color={chartMode === "pie" ? "#EC4899" : themeStyles.glow} />
              </button>
              <button
                onClick={() => setChartMode("radar")}
                className="bg-transparent border-none cursor-pointer p-1 transition-opacity hover:opacity-70"
              >
                <BarChart3 size={20} color={chartMode === "radar" ? "#EC4899" : themeStyles.glow} />
              </button>
            </div>
          </div>
          <AnimatePresence mode="wait">
            {chartMode === "pie" ? (
              <motion.div
                key="pie"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center"
              >
                <div style={{ width: 220, height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {chartData.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm font-black mt-2" style={{ color: themeStyles.text }}>
                  {dominant.name}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="radar"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex justify-center"
              >
                <RadarChart data={radarData} maxValue={maxCount} size={260} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-2 px-5 mb-4 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className="px-4 py-2 rounded-xl border text-xs font-extrabold cursor-pointer whitespace-nowrap transition-all"
              style={{
                backgroundColor: filterStatus === f.key ? "#8B5CF6" : "transparent",
                borderColor: filterStatus === f.key ? "#8B5CF6" : themeStyles.border,
                color: filterStatus === f.key ? "#FFF" : themeStyles.secondaryText,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="px-5 mb-4">
          <div
            className="flex items-center gap-3 p-4 rounded-2xl border"
            style={{ backgroundColor: themeStyles.card, borderColor: themeStyles.border }}
          >
            <Search size={18} color={themeStyles.glow} />
            <input
              className="flex-1 bg-transparent text-base outline-none"
              style={{ color: themeStyles.text }}
              placeholder="Buscar por email..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="bg-transparent border-none cursor-pointer text-xs font-bold opacity-60 hover:opacity-100"
                style={{ color: themeStyles.text }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {filteredAlarms.map((item, i) => {
            const emotion = getEmotionByName(item.mood);
            const st = STATUS_COLORS[item.status || "active"];
            const createdDate = item.created_at ? new Date(item.created_at) : null;
            const contactStatus = item.contact_status;
            const hasBeenContacted = contactStatus === "pending" || contactStatus === "accepted";
            const dateStr = createdDate?.toLocaleDateString(undefined, { day: "numeric", month: "short" }) || "";
            const timeStr = createdDate?.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) || "";

            return (
              <motion.div
                key={item.id || item.entry_id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.03 }}
                className="mx-5 mb-3 p-4 rounded-2xl border"
                style={{ backgroundColor: themeStyles.card, borderColor: themeStyles.border }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate" style={{ color: themeStyles.text }}>
                      {item.student_email || item.email}
                    </p>
                    {createdDate && (
                      <p className="text-[11px] font-semibold mt-0.5 opacity-60" style={{ color: themeStyles.secondaryText }}>
                        {dateStr} · {timeStr}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => updateStatus(item.id || item.entry_id, item.status || "active")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-black cursor-pointer transition-all hover:opacity-80 flex-shrink-0"
                    style={{
                      backgroundColor: `${st.color}18`,
                      borderColor: `${st.color}30`,
                      color: st.color,
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.color }} />
                    {st.label}
                  </button>
                </div>

                {item.contact_request_id && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span
                      className="text-[11px] font-bold"
                      style={{
                        color: contactStatus === "accepted" ? "#10B981" : contactStatus === "pending" ? "#F59E0B" : "#EF4444",
                      }}
                    >
                      {contactStatus === "accepted" ? "✓ Contacto aceptado" : contactStatus === "pending" ? "⏳ Pendiente" : "✗ Rechazado"}
                    </span>
                  </div>
                )}

                <p className="text-sm leading-[22px] mb-3 line-clamp-2 opacity-80" style={{ color: themeStyles.secondaryText }}>
                  {item.diary_text}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-black" style={{ color: emotion?.color || themeStyles.accent }}>
                    {item.mood}
                  </span>
                  {!hasBeenContacted && item.status !== "resolved" ? (
                    <button
                      onClick={() => handleContact(item.user_id, item.id || item.entry_id)}
                      className="text-sm font-black bg-transparent border-none cursor-pointer transition-opacity hover:opacity-70"
                      style={{ color: themeStyles.accent }}
                    >
                      Contactar →
                    </button>
                  ) : (
                    <span className="text-xs font-semibold opacity-50" style={{ color: themeStyles.secondaryText }}>
                      {contactStatus === "accepted" ? "✓ Contactado" : contactStatus === "pending" ? "⏳ Pendiente" : ""}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredAlarms.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-16"
          >
            <CheckCircle size={48} color="#10B981" />
            <p className="text-base font-bold mt-4 opacity-60" style={{ color: themeStyles.secondaryText }}>
              No hay alarmas con este filtro
            </p>
          </motion.div>
        )}

        <button
          onClick={() => {
            if (!stats) return;
            const report = `MindMood Report - ${new Date().toLocaleDateString()}\nUsuarios: ${stats.total_users}\nRegistros: ${stats.total_entries}`;
            navigator.clipboard?.writeText(report);
          }}
          className="mx-5 mt-4 py-4 rounded-2xl text-white text-sm font-black cursor-pointer border-none transition-all hover:opacity-90"
          style={{
            background: `linear-gradient(135deg, ${themeStyles.accentGradient[0]}, ${themeStyles.accentGradient[1]})`,
            width: "calc(100% - 40px)",
          }}
        >
          📋 Copiar Reporte
        </button>
      </div>
    </div>
  );
}
