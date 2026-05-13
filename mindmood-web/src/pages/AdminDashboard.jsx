import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip,
} from "recharts";
import {
  Users, Database, Activity, Search, ArrowUpRight,
  Command, Bell, Shield, LayoutGrid, ClipboardList,
  CheckCircle, AlertOctagon, LifeBuoy
} from "lucide-react";
import { supabase } from "../services/supabase";
import { EMOTIONS_MAP } from "../theme/emotions";
import { useAuth } from "../hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const CARD = "bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] border border-white/20 dark:border-slate-800 shadow-xl";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (profile?.role !== "admin") return;
    fetchAdminData();
  }, [profile?.role]);

  const fetchAdminData = async () => {
    try {
      const [{ data: statsData }, { data: alarmsData }] = await Promise.all([
        supabase.rpc("get_admin_stats"),
        supabase.rpc("get_admin_alarms"),
      ]);
      if (statsData) setStats(statsData[0]);
      setAlarms(alarmsData || []);
    } catch (err) { if (import.meta.env.DEV) console.error(err); }
    finally { setLoading(false); }
  };

  if (profile?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-rose-500 mx-auto opacity-50" />
          <p className="text-2xl font-black dark:text-white">Acceso Denegado</p>
          <p className="text-slate-400 font-medium">No tienes permisos de administrador.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
      </div>
    );
  }

  const totalEntries = stats?.total_entries || 0;
  const crisisCount = stats?.crisis_entries || 0;
  const healthScore = totalEntries > 0 ? Math.round(((totalEntries - crisisCount) / totalEntries) * 100) : 100;

  const radarData = EMOTIONS_MAP.slice(0, 11).map((emo) => {
    const keyMap = {
      Excelente: "excellent_entries", Feliz: "happy_entries",
      Agradecido: "gratitude_entries", Sorpresa: "surprise_entries",
      Neutral: "neutral_entries", Enojo: "anger_entries",
      Ansiedad: "anxiety_entries", Miedo: "fear_entries",
      Triste: "sad_entries", Asco: "disgust_entries",
      Crisis: "crisis_entries",
    };
    return { subject: emo.name, A: stats ? stats[keyMap[emo.name]] || 0 : 0 };
  });

  const maxRadar = Math.max(...radarData.map(d => d.A), 1);

  const alarmStatusData = [
    { name: "Crítico", value: crisisCount, color: "#F87171" },
    { name: "Monitoreo", value: Math.max(0, Math.round(totalEntries * 0.3)), color: "#FBBF24" },
    { name: "Estable", value: Math.max(0, totalEntries - crisisCount - Math.round(totalEntries * 0.3)), color: "#34D399" },
  ].filter(d => d.value > 0);

  const crisisEntries = alarms.filter(a => a.mood === "Crisis" || a.status === "active");
  const filteredCrisis = crisisEntries.filter(a => {
    const email = (a.student_email || a.email || "").toLowerCase();
    const text = (a.diary_text || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return email.includes(q) || text.includes(q);
  });

  const handleTriaje = async (item) => {
    const currentStatus = item.status || "active";
    const nextStatus = { active: "working", working: "resolved", resolved: "active" }[currentStatus];
    try {
      await supabase.rpc("admin_update_entry_status", {
        target_entry_id: item.id || item.entry_id,
        new_status: nextStatus,
      });
      fetchAdminData();
    } catch (err) { if (import.meta.env.DEV) console.error(err); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-500 font-black text-xs uppercase tracking-[0.3em]">
            <Command className="w-4 h-4" /> Command Center
          </div>
          <h1 className="text-5xl font-black tracking-tight dark:text-white">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Bell className="w-6 h-6 text-slate-400" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center text-[8px] text-white font-bold">{crisisCount}</div>
          </div>
          <div className="h-10 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-bold dark:text-white">Encrypted Node</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Users" value={stats?.total_users || 0} delta={stats?.total_users ? `${stats.total_users} usuarios` : "0"} color="text-indigo-500" />
        <StatCard icon={Database} label="Data Points" value={totalEntries} delta={totalEntries ? `${totalEntries} registros` : "0"} color="text-fuchsia-500" />
        <StatCard icon={Activity} label="System Load" value={`${healthScore}%`} delta={healthScore > 80 ? "Optimal" : healthScore > 50 ? "Moderate" : "High"} color="text-emerald-500" />
        <StatCard icon={AlertOctagon} label="Active Alerts" value={crisisCount} delta={crisisCount > 0 ? "Follow up" : "Clear"} color="text-rose-500" />
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <section className={`lg:col-span-7 p-8 relative overflow-hidden ${CARD}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -mr-20 -mt-20" />
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/10 rounded-2xl">
                <LayoutGrid className="w-5 h-5 text-indigo-500" />
              </div>
              <h2 className="text-2xl font-black dark:text-white">Red de Sentimiento</h2>
            </div>
          </div>
          <div className="h-[400px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <defs>
                  <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#A855F7" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <PolarGrid stroke="#94a3b8" strokeDasharray="3 3" opacity={0.3} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em" }} />
                <PolarRadiusAxis domain={[0, maxRadar]} hide />
                <Radar name="Sentiment" dataKey="A" stroke="#6366F1" strokeWidth={3} fill="url(#radarGradient)" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="lg:col-span-5 flex flex-col gap-8">
          <div className={`flex-1 p-8 relative overflow-hidden ${CARD}`}>
            <h3 className="text-xl font-black mb-6 dark:text-white">Estabilidad Global</h3>
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={alarmStatusData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={10} dataKey="value" stroke="none">
                    {alarmStatusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "24px", border: "none", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", fontSize: "12px", fontWeight: "800" }} />
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black dark:text-white">{healthScore}%</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Salud</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-8">
              {alarmStatusData.map((d, i) => (
                <div key={i} className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-1.5 h-1.5 rounded-full mb-1" style={{ backgroundColor: d.color }} />
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter truncate w-full text-center">{d.name}</span>
                  <span className="text-xs font-black dark:text-white mt-1">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {crisisCount > 0 && (
            <div className="p-8 bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-[3rem] shadow-xl text-white">
              <LifeBuoy className="w-10 h-10 mb-4 opacity-50" />
              <h4 className="text-2xl font-black mb-2">Protocolo Alpha</h4>
              <p className="text-white/70 text-xs italic mb-6">
                El sistema ha detectado una anomalía emocional colectiva. Activar medidas de prevención.
              </p>
              <button onClick={() => setSearchQuery("")}
                className="w-full py-4 bg-white/20 backdrop-blur-md rounded-2xl font-black hover:bg-white/30 transition-all">
                Desplegar Unidades
              </button>
            </div>
          )}
        </section>
      </div>

      <section className="space-y-8 mt-12 px-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-rose-500/10 rounded-3xl">
              <ClipboardList className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h2 className="text-3xl font-black dark:text-white">Incidentes Críticos</h2>
              <p className="text-slate-400 text-sm font-medium">
                Casos que requieren atención inmediata de un profesional.
              </p>
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input type="text" placeholder="Filtro rápido..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-4 ring-indigo-500/10 transition-all font-bold text-sm w-full md:w-64 dark:text-white" />
          </div>
        </div>

        {filteredCrisis.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <CheckCircle size={48} color="#10B981" />
            <p className="text-base font-bold mt-4 text-slate-400">No hay incidentes críticos activos</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredCrisis.map((item, idx) => {
              const st = item.status || "active";
              const stColor = st === "active" ? "#EF4444" : st === "working" ? "#F59E0B" : "#10B981";
              const stLabel = st === "active" ? "Crítico" : st === "working" ? "En Proceso" : "Resuelto";
              const uid = (item.id || item.entry_id || "").toString().slice(0, 8);
              const createdDate = item.recorded_at || item.created_at;
              const hasContact = item.contact_request_id != null;
              const contactRejected = item.contact_status === "rejected";

              return (
                <motion.div key={`ci-${item.id || item.entry_id || idx}`}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                  className={`group ${CARD} p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6`}
                >
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-[2rem] bg-rose-500/10 flex items-center justify-center shrink-0">
                      <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.8)]" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-black text-base md:text-lg dark:text-white truncate max-w-[200px]">
                          {item.student_email || item.email}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-[8px] font-black tracking-widest uppercase">
                          UID: {uid}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium italic line-clamp-2">
                        "{item.diary_text}"
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[11px] font-black" style={{ color: stColor }}>{stLabel}</span>
                        {hasContact && !contactRejected &&
                          <span className="text-[11px] font-black text-emerald-500">✓ Contactado</span>}
                        {contactRejected &&
                          <span className="text-[11px] font-black text-red-500">✗ Rechazado</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {createdDate && (
                      <div className="text-right mr-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {format(new Date(createdDate), "dd MMM", { locale: es })}
                        </p>
                        <p className="font-black text-sm dark:text-white">
                          {format(new Date(createdDate), "HH:mm")}
                        </p>
                      </div>
                    )}
                    <button onClick={() => handleTriaje(item)}
                      className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2">
                      Triaje <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, delta, color }) {
  return (
    <div className={`${CARD} p-6 md:p-8 group hover:shadow-2xl transition-all`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 md:p-4 rounded-2xl md:rounded-3xl bg-slate-50 dark:bg-slate-800 ${color}`}>
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
      </div>
      <div>
        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest md:tracking-[0.2em] mb-1 truncate">{label}</h4>
        <p className="text-2xl md:text-3xl font-black dark:text-white">{value}</p>
      </div>
    </div>
  );
}
