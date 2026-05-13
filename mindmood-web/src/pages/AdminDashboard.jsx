import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import {
  Users, FileText, AlertTriangle, Search, Send,
  Command, Shield, LayoutGrid, ClipboardList,
  CheckCircle, AlertOctagon, RefreshCw, Sun, Moon,
  LogOut, Activity,
} from "lucide-react";
import { supabase } from "../services/supabase";
import { contactService } from "../services/contactService";
import { EMOTIONS_MAP } from "../theme/emotions";
import { useTheme } from "../theme/ThemeContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const CARD = "bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] border border-white/20 dark:border-slate-800 shadow-xl";

const MOOD_COLORS = {
  Excelente: "#10B981", Feliz: "#EC4899", Agradecido: "#FBBF24",
  Sorpresa: "#06B6D4", Neutral: "#A78BFA", Enojo: "#F97316",
  Ansiedad: "#8B5CF6", Miedo: "#7C3AED", Triste: "#F43F5E",
  Asco: "#84CC16", Crisis: "#EF4444",
};

const STATUS_LABELS = {
  active: { label: "Crítica", color: "#EF4444", bg: "bg-red-500/10", pulse: true },
  working: { label: "En Proceso", color: "#F59E0B", bg: "bg-amber-500/10", pulse: false },
  resolved: { label: "Resuelta", color: "#10B981", bg: "bg-emerald-500/10", pulse: false },
};

export default function AdminDashboard() {
  const { theme, toggleTheme } = useTheme();
  const [admin, setAdmin] = useState(null);
  const [moodStats, setMoodStats] = useState({});
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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
      const [
        { data: entriesData },
        { data: alarmsData },
        { data: statsData },
      ] = await Promise.all([
        supabase.from("entries").select("mood, status"),
        supabase.rpc("get_admin_alarms"),
        supabase.rpc("get_admin_stats"),
      ]);

      setTotalUsers(statsData?.[0]?.total_users || 0);
      setTotalEntries(entriesData?.length || 0);

      const moodCounts = {};
      (entriesData || []).forEach(e => {
        const m = e.mood || "Indeterminado";
        moodCounts[m] = (moodCounts[m] || 0) + 1;
      });
      setMoodStats(moodCounts);

      let combined = alarmsData || [];

      const { data: resolvedRaw } = await supabase
        .from("entries")
        .select("id, user_id, text, mood, score, status, created_at")
        .eq("mood", "Crisis")
        .eq("status", "resolved")
        .limit(50);

      if (resolvedRaw && resolvedRaw.length > 0) {
        const resolvedMapped = resolvedRaw.map(e => ({
          id: e.id, entry_id: e.id, user_id: e.user_id,
          email: "", student_email: "ID: " + e.user_id?.toString().slice(0, 8),
          diary_text: e.text, mood: e.mood, score: e.score,
          status: "resolved", recorded_at: e.created_at,
          contact_request_id: null, contact_status: null,
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
        item.user_id, entryId,
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

  const crisisCount = moodStats["Crisis"] || 0;
  const totalEntriesNum = totalEntries;

  const keyMap = {
    Excelente: "excellent_entries", Feliz: "happy_entries",
    Agradecido: "gratitude_entries", Sorpresa: "surprise_entries",
    Neutral: "neutral_entries", Enojo: "anger_entries",
    Ansiedad: "anxiety_entries", Miedo: "fear_entries",
    Triste: "sad_entries", Asco: "disgust_entries",
    Crisis: "crisis_entries",
  };

  const radarData = EMOTIONS_MAP.slice(0, 11).map(emo => ({
    subject: emo.name,
    A: moodStats[emo.name] || 0,
  }));
  const maxRadar = Math.max(...radarData.map(d => d.A), 10);

  const emotionDistData = EMOTIONS_MAP.slice(0, 11).map(emo => ({
    name: emo.name,
    value: moodStats[emo.name] || 0,
    color: MOOD_COLORS[emo.name] || "#64748B",
  })).filter(d => d.value > 0);

  const topMood = EMOTIONS_MAP.slice(0, 11).reduce((best, emo) =>
    (moodStats[emo.name] || 0) > (moodStats[best.name] || 0) ? emo : best
  , EMOTIONS_MAP[0]);

  const matchesSearch = (item) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    const email = (item.student_email || item.email || "").toLowerCase();
    const text = (item.diary_text || "").toLowerCase();
    return email.includes(q) || text.includes(q);
  };

  const activeAlarms = alarms.filter(a => (a.status || "active") === "active" && matchesSearch(a));
  const workingAlarms = alarms.filter(a => a.status === "working" && matchesSearch(a));
  const resolvedAlarms = alarms.filter(a => a.status === "resolved" && matchesSearch(a));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const renderCrisisCard = (item, idx, sectionPrefix) => {
    const st = item.status || "active";
    const stMeta = STATUS_LABELS[st] || STATUS_LABELS.active;
    const uid = (item.id || item.entry_id || "").toString().slice(0, 8);
    const createdDate = item.recorded_at || item.created_at;
    const hasContact = item.contact_request_id != null;
    const contactSt = item.contact_status;
    const entryKey = item.id || item.entry_id || `${sectionPrefix}-${idx}`;
    const isContacting = contacting[entryKey];

    return (
      <motion.div key={`ci-${entryKey}`}
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
        className="p-4 rounded-[1.5rem] border bg-white dark:bg-slate-900/60 border-slate-100 dark:border-slate-800 shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-start gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`w-2 h-2 rounded-full ${stMeta.pulse ? "animate-pulse" : ""}`}
                style={{ backgroundColor: stMeta.color, boxShadow: stMeta.pulse ? `0 0 8px ${stMeta.color}` : "none" }} />
              <span className="font-bold text-sm dark:text-white truncate max-w-[200px]">
                {item.student_email || item.email || "Sin email"}
              </span>
              <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded text-[7px] font-bold tracking-widest uppercase">
                UID: {uid}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${stMeta.bg}`} style={{ color: stMeta.color }}>
                {stMeta.label}
              </span>
              {hasContact && (
                <span className="text-[10px] font-bold"
                  style={{ color: contactSt === "accepted" ? "#10B981" : contactSt === "rejected" ? "#EF4444" : "#F59E0B" }}>
                  {contactSt === "pending" ? "⏳ Pendiente" :
                   contactSt === "accepted" ? "✓ Contactado" : "✗ Rechazado"}
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm italic line-clamp-2 leading-relaxed">
              "{item.diary_text}"
            </p>
            {createdDate && (
              <p className="text-[10px] font-bold text-slate-400">
                {format(new Date(createdDate), "dd MMM HH:mm", { locale: es })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {st !== "resolved" && !hasContact && (
              <button onClick={() => handleContact(item)} disabled={isContacting}
                className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all hover:scale-105 disabled:opacity-50 border-none cursor-pointer"
                style={{ backgroundColor: "#6366F120", color: "#6366F1" }}>
                {isContacting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Contactar
              </button>
            )}
            <button onClick={() => handleStatusCycle(item)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all hover:scale-105 border-none cursor-pointer"
              style={{ backgroundColor: `${stMeta.color}15`, color: stMeta.color }}>
              <RefreshCw className="w-3.5 h-3.5" />
              {st === "active" ? "Pasar a Proceso" : st === "working" ? "Marcar Resuelta" : "Reabrir"}
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderCrisisSection = (title, items, icon, emptyText, color) => {
    if (items.length === 0 && activeChart !== "all") return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-black dark:text-white uppercase tracking-wider">{title}</h3>
          <span className="text-xs font-bold text-slate-400">({items.length})</span>
        </div>
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item, idx) => renderCrisisCard(item, idx, title))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic pl-1">{emptyText}</p>
        )}
      </div>
    );
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
        <StatCard icon={Users} label="Usuarios" value={totalUsers} color="text-indigo-500" />
        <StatCard icon={FileText} label="Entradas" value={totalEntriesNum} color="text-fuchsia-500" />
        <StatCard icon={AlertTriangle} label="Crisis" value={crisisCount} color="text-rose-500" />
        <StatCard icon={Activity} label="Sentimiento Global" value={topMood.name || "Neutral"} color={topMood.color || "text-slate-500"} />
      </div>

      <div className={`${CARD}`}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
        <div className="p-6 space-y-8">
          {renderCrisisSection("Activas", activeAlarms,
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />,
            "No hay alertas activas", "#EF4444")}
          {renderCrisisSection("En Proceso", workingAlarms,
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />,
            "No hay casos en proceso", "#F59E0B")}
          {renderCrisisSection("Resueltas", resolvedAlarms,
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />,
            "No hay casos resueltos", "#10B981")}
        </div>
      </div>

      {emotionDistData.length === 0 ? (
        <div className={`p-8 text-center ${CARD}`}>
          <p className="text-lg font-black dark:text-white">No hay datos de emociones aún</p>
          <p className="text-sm text-slate-400 mt-2">Las gráficas aparecerán cuando haya entradas registradas.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className={`p-6 ${CARD}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black dark:text-white">
                {activeChart === "radar" ? "Red de Sentimiento" : "Distribución Global"}
              </h2>
              <button onClick={() => setActiveChart(activeChart === "radar" ? "donut" : "radar")}
                className="px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border-2 bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 dark:text-slate-400 hover:border-current">
                {activeChart === "radar" ? "Donut" : "Radar"}
              </button>
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
                    <Radar name="Entradas" dataKey="A" stroke="#6366F1" strokeWidth={3} fill="url(#radarGradient)" fillOpacity={0.6} />
                    <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", fontSize: "12px", fontWeight: "800" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={emotionDistData} cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                      paddingAngle={3} dataKey="value" stroke="none">
                      {emotionDistData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", fontSize: "12px", fontWeight: "800" }}
                      formatter={(value) => [`${value} entradas`]} />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-4 space-y-1.5">
              {emotionDistData.map((d, i) => {
                const pct = totalEntries > 0 ? Math.round((d.value / totalEntries) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-xs font-bold dark:text-white flex-1">{d.name}</span>
                    <span className="text-[11px] font-black text-slate-500">{d.value} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`p-6 ${CARD}`}>
            <h2 className="text-xl font-black mb-6 dark:text-white">Frecuencia Global por Emoción</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emotionDistData} layout="vertical" margin={{ left: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 700, fill: "#64748B" }} />
                  <Tooltip cursor={{ fill: "transparent" }}
                    contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", fontSize: "12px", fontWeight: "800" }} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {emotionDistData.map((entry, i) => (
                      <Cell key={`bar-cell-${i}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
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
