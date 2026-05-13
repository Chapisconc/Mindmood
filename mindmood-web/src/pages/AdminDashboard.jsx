import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, PieChart, BarChart3, CheckCircle, Users, BookOpen, Search, AlertTriangle, ArrowLeft } from "lucide-react";
import { supabase } from "../services/supabase";
import { EMOTIONS_MAP, getEmotionByName } from "../theme/emotions";
import { contactService } from "../services/contactService";
import RadarChart from "../components/RadarChart";
import { PieChart as RePieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const STATUS_COLORS = {
  active: { label: "Pendiente", color: "#EF4444" },
  working: { label: "En Proceso", color: "#F59E0B" },
  resolved: { label: "Resuelto", color: "#10B981" },
};

const pieColors = ["#EC4899", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#F97316", "#84CC16", "#7C3AED", "#F43F5E", "#14B8A6"];

const CARD = "p-5 rounded-3xl border bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 shadow-sm";

export default function AdminDashboard() {
  const navigate = useNavigate();
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
    } catch (err) { if (import.meta.env.DEV) console.error("[Admin] Fetch Error:", err); }
    finally { setLoading(false); }
  };

  const updateStatus = async (alarmId, currentStatus) => {
    const nextStatus = { active: "working", working: "resolved", resolved: "active" }[currentStatus];
    try { await supabase.rpc("admin_update_entry_status", { target_entry_id: alarmId, new_status: nextStatus }); fetchAdminData(); }
    catch (err) { if (import.meta.env.DEV) console.error("[Admin] Status Update Error:", err); }
  };

  const handleContact = async (userId, entryId) => {
    if (confirm("¿Enviar invitación de contacto a este usuario?")) {
      const { error } = await contactService.adminInitiateContact(userId, entryId, "Un administrador desea hablar contigo sobre tu bienestar.");
      if (!error) fetchAdminData(); else alert(error.message);
    }
  };

  const handleLogout = async () => { try { await supabase.auth.signOut(); localStorage.clear(); sessionStorage.clear(); } catch (_) {} navigate("/"); };

  const totalEntries = stats ? stats.total_entries : 0;
  const chartData = EMOTIONS_MAP.map((emo) => {
    const keyMap = { Excelente: "excellent_entries", Feliz: "happy_entries", Agradecido: "gratitude_entries", Sorpresa: "surprise_entries", Neutral: "neutral_entries", Enojo: "anger_entries", Ansiedad: "anxiety_entries", Miedo: "fear_entries", Triste: "sad_entries", Asco: "disgust_entries", Crisis: "crisis_entries" };
    const value = stats ? stats[keyMap[emo.name]] || 0 : 0;
    return { name: emo.name, value, color: emo.color, percentage: totalEntries > 0 ? Math.round((value / totalEntries) * 100) : 0 };
  }).filter((i) => i.value > 0);

  const radarData = EMOTIONS_MAP.map((emo) => {
    const keyMap = { Excelente: "excellent_entries", Feliz: "happy_entries", Agradecido: "gratitude_entries", Sorpresa: "surprise_entries", Neutral: "neutral_entries", Enojo: "anger_entries", Ansiedad: "anxiety_entries", Miedo: "fear_entries", Triste: "sad_entries", Asco: "disgust_entries", Crisis: "crisis_entries" };
    return { label: emo.name, value: stats ? stats[keyMap[emo.name]] || 0 : 0 };
  });
  const maxCount = Math.max(...radarData.map((d) => d.value), 1);

  const dominant = stats ? EMOTIONS_MAP.reduce((p, c) => {
    const keyMap = { Excelente: "excellent_entries", Feliz: "happy_entries", Agradecido: "gratitude_entries", Sorpresa: "surprise_entries", Neutral: "neutral_entries", Enojo: "anger_entries", Ansiedad: "anxiety_entries", Miedo: "fear_entries", Triste: "sad_entries", Asco: "disgust_entries", Crisis: "crisis_entries" };
    return (stats[keyMap[c.name]] || 0) > (stats[keyMap[p.name]] || 0) ? c : p;
  }, EMOTIONS_MAP[4]) : EMOTIONS_MAP[4];

  const crisisCount = stats?.crisis_entries || 0;
  const nonCrisisCount = Math.max(0, totalEntries - crisisCount);
  const crisisPie = [{ name: "Crisis", value: crisisCount, color: "#EF4444" }, { name: "Normal", value: nonCrisisCount, color: "#10B981" }].filter((d) => d.value > 0);

  const statusCounts = alarms.reduce((acc, a) => { const s = a.status || "active"; acc[s] = (acc[s] || 0) + 1; return acc; }, { active: 0, working: 0, resolved: 0 });
  const alarmStatusData = Object.entries(statusCounts).map(([key, value]) => ({ name: STATUS_COLORS[key]?.label || key, value, color: STATUS_COLORS[key]?.color || "#888" })).filter((d) => d.value > 0);

  const leaderMap = {};
  alarms.forEach((a) => {
    const email = a.student_email || a.email || "unknown";
    if (!leaderMap[email]) leaderMap[email] = { email, count: 0, lastCrisis: null };
    leaderMap[email].count++;
    const d = a.created_at ? new Date(a.created_at) : null;
    if (!leaderMap[email].lastCrisis || d > leaderMap[email].lastCrisis) leaderMap[email].lastCrisis = d;
  });
  const crisisLeaders = Object.values(leaderMap).sort((a, b) => b.count - a.count).slice(0, 5);

  const filters = [{ key: "all", label: "Todos" }, { key: "pending", label: "Pendientes" }, { key: "working", label: "En Proceso" }, { key: "contacted", label: "Contactados" }];

  const filteredAlarms = alarms.filter((a) => {
    const email = (a.student_email || a.email || "").toLowerCase();
    if (!email.includes(searchText.toLowerCase())) return false;
    if (filterStatus === "all") return true;
    if (filterStatus === "pending") return !a.contact_request_id && (a.status || "active") === "active";
    if (filterStatus === "working") return a.status === "working" && !a.contact_request_id;
    if (filterStatus === "contacted") return a.contact_request_id != null;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
          <div className="absolute inset-1 rounded-full border-2 border-transparent border-b-pink-500 animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[120px] bg-indigo-500/5" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-[100px] bg-fuchsia-500/5" />
      </div>

      <div className="max-w-4xl mx-auto pb-20 relative z-10">
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/home")} className="bg-transparent border-none cursor-pointer p-1 hover:opacity-70 transition-opacity dark:text-white">
              <ArrowLeft size={24} />
            </button>
            <div>
              <p className="text-2xl font-black tracking-tight dark:text-white">Panel Admin</p>
              <p className="text-sm font-semibold text-slate-400">Gestión de Bienestar</p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-3 rounded-2xl bg-transparent border-none cursor-pointer hover:bg-red-500/10 transition-colors">
            <LogOut size={22} color="#EF4444" />
          </button>
        </div>

        <div className="flex gap-3 px-5 mb-6">
          <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
            className="flex-1 p-5 rounded-3xl border bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl bg-emerald-500/10" />
            <Users size={22} color="#10B981" />
            <p className="text-2xl font-black mt-3 dark:text-white">{stats?.total_users || 0}</p>
            <p className="text-xs font-bold mt-1 text-slate-400">Usuarios</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="flex-1 p-5 rounded-3xl border bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl bg-pink-500/10" />
            <BookOpen size={22} color="#EC4899" />
            <p className="text-2xl font-black mt-3 dark:text-white">{stats?.total_entries || 0}</p>
            <p className="text-xs font-bold mt-1 text-slate-400">Diarios</p>
          </motion.div>
        </div>

        <div className={"mx-5 mb-4 " + CARD}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-black dark:text-white">Distribución Emocional</p>
            <div className="flex gap-3">
              <button onClick={() => setChartMode("pie")} className="bg-transparent border-none cursor-pointer p-1 transition-opacity hover:opacity-70">
                <PieChart size={20} color={chartMode === "pie" ? "#EC4899" : "#94A3B8"} />
              </button>
              <button onClick={() => setChartMode("radar")} className="bg-transparent border-none cursor-pointer p-1 transition-opacity hover:opacity-70">
                <BarChart3 size={20} color={chartMode === "radar" ? "#EC4899" : "#94A3B8"} />
              </button>
            </div>
          </div>
          <AnimatePresence mode="wait">
            {chartMode === "pie" ? (
              <motion.div key="pie" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center">
                <div style={{ width: 220, height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2}>
                        {chartData.map((entry, i) => (<Cell key={`cell-${i}`} fill={entry.color} stroke="none" />))}
                      </Pie>
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm font-black mt-2 dark:text-white">{dominant.name}</p>
              </motion.div>
            ) : (
              <motion.div key="radar" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex justify-center">
                <RadarChart data={radarData} maxValue={maxCount} size={260} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-3 px-5 mb-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex-1 p-4 rounded-3xl border bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800"
          >
            <p className="text-xs font-black mb-2 text-slate-400">Crisis vs Normal</p>
            {crisisPie.length > 0 ? (
              <div style={{ width: "100%", height: 120 }}>
                <ResponsiveContainer>
                  <RePieChart>
                    <Pie data={crisisPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3}>
                      {crisisPie.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-sm font-bold dark:text-white">Sin datos</p>}
            <div className="flex justify-center gap-4 mt-1">
              {crisisPie.map((e) => (<div key={e.name} className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} /><span className="text-[10px] font-bold dark:text-slate-300">{e.name}: {e.value}</span></div>))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="flex-1 p-4 rounded-3xl border bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800"
          >
            <p className="text-xs font-black mb-2 text-slate-400">Estado Alarmas</p>
            {alarmStatusData.length > 0 ? (
              <div style={{ width: "100%", height: 120 }}>
                <ResponsiveContainer>
                  <RePieChart>
                    <Pie data={alarmStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3}>
                      {alarmStatusData.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-sm font-bold dark:text-white">Sin alarmas</p>}
            <div className="flex justify-center gap-3 mt-1">
              {alarmStatusData.map((e) => (<div key={e.name} className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} /><span className="text-[10px] font-bold dark:text-slate-300">{e.name}: {e.value}</span></div>))}
            </div>
          </motion.div>
        </div>

        {chartData.filter((d) => d.percentage > 0).length > 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className={"mx-5 mb-4 " + CARD}
          >
            <p className="text-base font-black mb-4 dark:text-white">Barras por Emoción</p>
            <div style={{ width: "100%", height: 200 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} layout="vertical" margin={{ left: 60, right: 10, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} width={55} />
                  <Tooltip contentStyle={{ backgroundColor: "#FFF", border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={16}>
                    {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {crisisLeaders.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className={"mx-5 mb-4 " + CARD}
          >
            <p className="text-base font-black mb-3 dark:text-white">Usuarios con más Crisis</p>
            {crisisLeaders.map((u, i) => (
              <div key={u.email} className="flex items-center justify-between py-2 border-b last:border-b-0 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-black flex-shrink-0" style={{ color: i === 0 ? "#F59E0B" : "#94A3B8" }}>#{i + 1}</span>
                  <p className="text-sm font-bold truncate dark:text-white">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-black text-red-500">{u.count}</span>
                  <span className="text-[10px] font-semibold text-slate-400">crisis</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        <div className="flex gap-2 px-5 mb-4 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button key={f.key} onClick={() => setFilterStatus(f.key)}
              className="px-4 py-2 rounded-xl border text-xs font-extrabold cursor-pointer whitespace-nowrap transition-all"
              style={{
                backgroundColor: filterStatus === f.key ? "#8B5CF6" : "transparent",
                borderColor: filterStatus === f.key ? "#8B5CF6" : "#E2E8F0",
                color: filterStatus === f.key ? "#FFF" : "#64748B",
              }}
            >{f.label}</button>
          ))}
        </div>

        <div className="px-5 mb-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl border bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800">
            <Search size={18} color="#94A3B8" />
            <input className="flex-1 bg-transparent text-base outline-none dark:text-white" placeholder="Buscar por email..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            {searchText && <button onClick={() => setSearchText("")} className="bg-transparent border-none cursor-pointer text-xs font-bold hover:opacity-100 dark:text-white">✕</button>}
          </div>
        </div>

        <AnimatePresence>
          {filteredAlarms.map((item, i) => {
            const emotion = getEmotionByName(item.mood);
            const st = STATUS_COLORS[item.status || "active"];
            const createdDate = item.created_at ? new Date(item.created_at) : null;
            const contactStatus = item.contact_status;
            const hasContactRequest = item.contact_request_id != null;
            const hasBeenContacted = hasContactRequest && contactStatus !== "rejected";
            const isRejected = contactStatus === "rejected";
            const dateStr = createdDate?.toLocaleDateString(undefined, { day: "numeric", month: "short" }) || "";
            const timeStr = createdDate?.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) || "";

            return (
              <motion.div key={item.id || item.entry_id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ delay: i * 0.03 }}
                className="mx-5 mb-3 p-4 rounded-2xl border bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-black truncate dark:text-white">{item.student_email || item.email}</p>
                      {createdDate && <span className="text-[10px] font-bold flex-shrink-0 text-slate-400">{dateStr} · {timeStr}</span>}
                    </div>
                  </div>
                  <button onClick={() => updateStatus(item.id || item.entry_id, item.status || "active")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black cursor-pointer transition-all hover:opacity-80 flex-shrink-0"
                    style={{ backgroundColor: `${st.color}18`, border: `1px solid ${st.color}30`, color: st.color }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.color }} />{st.label}
                  </button>
                </div>

                {hasContactRequest && !isRejected && <div className="flex items-center gap-1.5 mb-2"><span className="text-[11px] font-bold text-emerald-500">✓ Contactado</span></div>}
                {hasContactRequest && isRejected && <div className="flex items-center gap-1.5 mb-2"><span className="text-[11px] font-bold text-red-500">✗ Rechazado</span></div>}

                <p className="text-sm leading-[22px] mb-3 line-clamp-2 dark:text-slate-300">{item.diary_text}</p>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-black" style={{ color: emotion?.color }}>{item.mood}</span>
                  {!hasContactRequest && item.status !== "resolved" ? (
                    <button onClick={() => handleContact(item.user_id, item.id || item.entry_id)}
                      className="text-sm font-black bg-transparent border-none cursor-pointer transition-opacity hover:opacity-70 text-indigo-500">
                      Contactar →
                    </button>
                  ) : (
                    <span className="text-xs font-semibold" style={{ color: hasBeenContacted ? "#10B981" : "#EF4444" }}>
                      {hasBeenContacted ? "✓ Contactado" : isRejected ? "✗ Rechazado" : ""}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredAlarms.length === 0 && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-16">
            <CheckCircle size={48} color="#10B981" />
            <p className="text-base font-bold mt-4 text-slate-400">No hay alarmas con este filtro</p>
          </motion.div>
        )}

        <div className="flex justify-center">
          <button onClick={() => { if (!stats) return; const report = `MindMood Report - ${new Date().toLocaleDateString()}\nUsuarios: ${stats.total_users}\nRegistros: ${stats.total_entries}`; navigator.clipboard?.writeText(report); }}
            className="mx-5 mt-4 py-4 rounded-2xl text-white text-sm font-black cursor-pointer border-none transition-all hover:opacity-90 bg-gradient-to-r from-indigo-500 to-fuchsia-500 w-[calc(100%-40px)]">
            📋 Copiar Reporte
          </button>
        </div>
      </div>
    </div>
  );
}
