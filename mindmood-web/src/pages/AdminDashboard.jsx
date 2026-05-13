import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Tooltip,
} from "recharts";
import {
  Users, FileText, AlertTriangle, Search, Send,
  Command, Shield, LayoutGrid, ClipboardList,
  CheckCircle, AlertOctagon, RefreshCw, Sun, Moon,
  LogOut, MessageSquare, XCircle, Clock, Activity,
} from "lucide-react";
import { supabase } from "../services/supabase";
import { contactService } from "../services/contactService";
import { EMOTIONS_MAP } from "../theme/emotions";
import { useTheme } from "../theme/ThemeContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const CARD = "bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] border border-white/20 dark:border-slate-800 shadow-xl";

const STATUS_LABELS = {
  active: { label: "Crítica", color: "#EF4444", bg: "bg-red-500/10", pulse: true },
  working: { label: "En Proceso", color: "#F59E0B", bg: "bg-amber-500/10", pulse: false },
  resolved: { label: "Resuelta", color: "#10B981", bg: "bg-emerald-500/10", pulse: false },
};

const CONTACT_LABELS = {
  pending: { label: "Pendiente", color: "#F59E0B" },
  accepted: { label: "Aceptado", color: "#10B981" },
  rejected: { label: "Rechazado", color: "#EF4444" },
};

export default function AdminDashboard() {
  const { theme, toggleTheme } = useTheme();
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState(null);
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeChart, setActiveChart] = useState("radar");
  const [contacting, setContacting] = useState({});

  useEffect(() => {
    supabase.rpc("is_admin").then(({ data }) => {
      setAdmin(!!data);
      if (data) fetchAdminData();
      else setLoading(false);
    });
  }, []);

  const fetchAdminData = async () => {
    try {
      const [{ data: statsData }, { data: alarmsData }] = await Promise.all([
        supabase.rpc("get_admin_stats"),
        supabase.rpc("get_admin_alarms"),
      ]);
      if (statsData) setStats(statsData[0]);

      let combined = alarmsData || [];

      const { data: resolvedRaw } = await supabase
        .from("entries")
        .select("id, user_id, text, mood, score, status, created_at")
        .eq("mood", "Crisis")
        .eq("status", "resolved")
        .order("created_at", { ascending: false })
        .limit(50);

      if (resolvedRaw && resolvedRaw.length > 0) {
        const userIds = [...new Set(resolvedRaw.map(e => e.user_id))];
        const { data: resolvedProfiles } = userIds.length > 0
          ? await supabase.from("profiles").select("id, email").in("id", userIds)
          : { data: [] };
        const profileMap = Object.fromEntries((resolvedProfiles || []).map(p => [p.id, p.email]));

        const resolvedMapped = resolvedRaw.map(e => ({
          id: e.id,
          entry_id: e.id,
          user_id: e.user_id,
          email: profileMap[e.user_id] || "",
          student_email: profileMap[e.user_id] || "",
          diary_text: e.text,
          mood: e.mood,
          score: e.score,
          status: "resolved",
          recorded_at: e.created_at,
          contact_request_id: null,
          contact_status: null,
        }));
        combined = [...combined, ...resolvedMapped];
      }

      setAlarms(combined);
    } catch (err) { if (import.meta.env.DEV) console.error(err); }
    finally { setLoading(false); }
  };

  const handleStatusCycle = async (item) => {
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

  const handleContact = async (item) => {
    const entryId = item.id || item.entry_id;
    if (contacting[entryId]) return;
    if (!confirm("Enviar solicitud de contacto a este usuario?")) return;
    setContacting(prev => ({ ...prev, [entryId]: true }));
    try {
      const { error } = await contactService.adminInitiateContact(
        item.user_id,
        entryId,
        "Un administrador desea contactarte. Revisa tu bandeja de entrada."
      );
      if (error) alert(error.message);
      else fetchAdminData();
    } catch (err) { if (import.meta.env.DEV) console.error(err); }
    finally { setContacting(prev => ({ ...prev, [entryId]: false })); }
  };

  if (admin === false) {
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

  if (admin === null || loading) {
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

  const statusCounts = {
    all: alarms.length,
    active: alarms.filter(a => (a.status || "active") === "active").length,
    working: alarms.filter(a => a.status === "working").length,
    resolved: alarms.filter(a => a.status === "resolved").length,
  };

  const filteredAlarms = alarms.filter(a => {
    if (statusFilter !== "all" && (a.status || "active") !== statusFilter) return false;
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    const email = (a.student_email || a.email || "").toLowerCase();
    const text = (a.diary_text || "").toLowerCase();
    return email.includes(q) || text.includes(q);
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-500 font-black text-xs uppercase tracking-[0.3em]">
            <Command className="w-4 h-4" /> Command Center
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight dark:text-white">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme}
            className="p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl hover:scale-105 transition-transform">
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
          </button>
          <button onClick={handleLogout}
            className="p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-xl hover:scale-105 transition-transform hover:bg-rose-500/10">
            <LogOut className="w-5 h-5 text-rose-500" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Usuarios" value={stats?.total_users || 0} color="text-indigo-500" />
        <StatCard icon={FileText} label="Entradas" value={totalEntries} color="text-fuchsia-500" />
        <StatCard icon={AlertTriangle} label="Crisis" value={crisisCount} color="text-rose-500" />
        <StatCard icon={Activity} label="Salud" value={`${healthScore}%`} color={healthScore > 80 ? "text-emerald-500" : "text-amber-500"} />
      </div>

      <div className={`p-6 ${CARD}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-rose-500" />
            <h2 className="text-xl font-black dark:text-white">Incidentes Críticos</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input type="text" placeholder="Buscar por email o texto..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 outline-none focus:ring-2 ring-indigo-500/20 transition-all font-medium text-sm w-full md:w-60 dark:text-white dark:placeholder:text-slate-500" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: "all", label: "Todas", color: "#6366F1" },
            { key: "active", label: `Activas (${statusCounts.active})`, color: "#EF4444" },
            { key: "working", label: `En Proceso (${statusCounts.working})`, color: "#F59E0B" },
            { key: "resolved", label: `Resueltas (${statusCounts.resolved})`, color: "#10B981" },
          ].map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border-2 ${
                statusFilter === f.key
                  ? "text-white shadow-lg scale-105"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:border-current"
              }`}
              style={statusFilter === f.key ? { backgroundColor: f.color, borderColor: f.color } : {}}>
              {f.label}
            </button>
          ))}
        </div>

        {filteredAlarms.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <CheckCircle size={40} color="#10B981" />
            <p className="text-sm font-bold mt-3 text-slate-400">
              {statusFilter === "all" ? "No hay incidentes críticos" : `No hay incidentes en "${statusFilter}"`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlarms.map((item, idx) => {
              const st = item.status || "active";
              const stMeta = STATUS_LABELS[st] || STATUS_LABELS.active;
              const uid = (item.id || item.entry_id || "").toString().slice(0, 8);
              const createdDate = item.recorded_at || item.created_at;
              const hasContact = item.contact_request_id != null;
              const contactSt = item.contact_status;
              const contactMeta = CONTACT_LABELS[contactSt];
              const entryKey = item.id || item.entry_id || idx;
              const isContacting = contacting[entryKey];

              return (
                <motion.div key={`ci-${entryKey}`}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                  className={`p-5 rounded-[2rem] border transition-all ${
                    st === "active"
                      ? "bg-red-500/[0.04] dark:bg-red-500/[0.06] border-red-500/10"
                      : st === "working"
                      ? "bg-amber-500/[0.04] dark:bg-amber-500/[0.06] border-amber-500/10"
                      : "bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] border-emerald-500/10"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`w-2.5 h-2.5 rounded-full ${stMeta.pulse ? "animate-pulse" : ""}`}
                          style={{ backgroundColor: stMeta.color, boxShadow: stMeta.pulse ? `0 0 10px ${stMeta.color}` : "none" }} />
                        <span className="font-black text-sm dark:text-white truncate max-w-[200px]">
                          {item.student_email || item.email || "Sin email"}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg text-[8px] font-black tracking-widest uppercase">
                          UID: {uid}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium italic line-clamp-2 leading-relaxed">
                        "{item.diary_text}"
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-black">
                        <span className={`px-2.5 py-1 rounded-lg ${stMeta.bg}`} style={{ color: stMeta.color }}>
                          {stMeta.label}
                        </span>
                        {hasContact ? (
                          contactMeta ? (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800"
                              style={{ color: contactMeta.color }}>
                              {contactSt === "pending" ? "⏳ Contacto: Pendiente" :
                               contactSt === "accepted" ? "✓ Contacto: Aceptado" :
                               "✗ Contacto: Rechazado"}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                              Contacto enviado
                            </span>
                          )
                        ) : st !== "resolved" ? (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400">
                            No contactado
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-row md:flex-col items-center gap-2 shrink-0">
                      {createdDate && (
                        <div className="text-right px-2 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                            {format(new Date(createdDate), "dd MMM", { locale: es })}
                          </p>
                          <p className="font-black text-xs dark:text-white leading-none mt-0.5">
                            {format(new Date(createdDate), "HH:mm")}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {st !== "resolved" && !hasContact && (
                          <button onClick={() => handleContact(item)} disabled={isContacting}
                            className="px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all hover:scale-105 disabled:opacity-50 border-none cursor-pointer"
                            style={{ backgroundColor: "#6366F120", color: "#6366F1" }}>
                            {isContacting ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            Contactar
                          </button>
                        )}
                        <button onClick={() => handleStatusCycle(item)}
                          className="px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all hover:scale-105 border-none cursor-pointer"
                          style={{ backgroundColor: `${stMeta.color}15`, color: stMeta.color }}>
                          <RefreshCw className="w-3.5 h-3.5" />
                          {st === "active" ? "Pasar a Proceso" :
                           st === "working" ? "Resolver" :
                           "Reabrir"}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div className={`p-6 ${CARD}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black dark:text-white">
            {activeChart === "radar" ? "Red de Sentimiento" : "Estabilidad Global"}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setActiveChart("radar")}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border-2 ${
                activeChart === "radar"
                  ? "bg-indigo-500 border-indigo-500 text-white shadow-lg"
                  : "bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 dark:text-slate-400"
              }`}>
              Radar
            </button>
            <button onClick={() => setActiveChart("donut")}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border-2 ${
                activeChart === "donut"
                  ? "bg-indigo-500 border-indigo-500 text-white shadow-lg"
                  : "bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 dark:text-slate-400"
              }`}>
              Donut
            </button>
          </div>
        </div>
        {activeChart === "radar" ? (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <defs>
                  <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#A855F7" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <PolarGrid stroke="#94a3b8" strokeDasharray="3 3" opacity={0.3} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 10, fontWeight: 800 }} />
                <PolarRadiusAxis domain={[0, maxRadar]} hide />
                <Radar name="Sentiment" dataKey="A" stroke="#6366F1" strokeWidth={3} fill="url(#radarGradient)" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-[300px] w-full md:w-1/2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={alarmStatusData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={10} dataKey="value" stroke="none">
                    {alarmStatusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "20px", border: "none", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", fontSize: "12px", fontWeight: "800" }} />
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black dark:text-white">{healthScore}%</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Salud</span>
              </div>
            </div>
            <div className="flex-1 w-full md:w-1/2 space-y-3">
              {alarmStatusData.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-sm font-black dark:text-white">{d.name}</span>
                  </div>
                  <span className="text-lg font-black" style={{ color: d.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`${CARD} p-5 md:p-6 hover:shadow-2xl transition-all`}>
      <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 inline-flex mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-2xl md:text-3xl font-black dark:text-white">{value}</p>
      </div>
    </div>
  );
}
