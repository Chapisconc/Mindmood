/* ------------------------------------------------------------------ */
/* AdminDashboard.jsx — Panel de Administración                       */
/* Ruta: /admin                                                       */
/* Propósito: Estadísticas, gestión de alarmas/crisis, tabla de       */
/* usuarios con búsqueda/filtro, gráficos de emociones (barras,       */
/* pastel, radar), y formulario de información de contacto.           */
/* Requiere rol de administrador (verifica vía RPC is_admin).         */
/* ------------------------------------------------------------------ */

// React hooks para estado y efectos
import { useState, useEffect } from "react";
// Framer Motion para animaciones de entrada en tarjetas y lista
import { motion } from "framer-motion";
// Iconos de Lucide para toda la interfaz administrativa
import {
  AlertTriangle, Search, Send, Shield, RefreshCw, Sun, Moon, LogOut,
  Users, FileText, Activity, BarChart3, PieChart, Radar,
} from "lucide-react";
// Recharts para el gráfico de pastel (donut)
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
// Cliente Supabase para RPCs y consultas directas
import { supabase } from "../services/supabase";
// Servicio de contacto para iniciar solicitudes desde el admin
import { contactService } from "../services/contactService";
// Contexto de tema para alternar modo claro/oscuro
import { useTheme } from "../theme/ThemeContext";
// Mapa de emociones (nombre -> color, ícono)
import { EMOTIONS_MAP } from "../theme/emotions";
// date-fns para formato de fechas con locale español
import { format } from "date-fns";
import { es } from "date-fns/locale";

/* Etiquetas y colores para los estados de las alarmas/entradas */
const STATUS_LABELS = {
  active: { label: "Crítica", color: "#EF4444", pulse: true },
  working: { label: "En Proceso", color: "#F59E0B", pulse: false },
  resolved: { label: "Resuelta", color: "#10B981", pulse: false },
};

/* Paleta de colores por emoción para gráficos y badges */
const emotionColors = {
  Excelente: "#10B981", Feliz: "#EC4899", Agradecido: "#FBBF24",
  Sorpresa: "#06B6D4", Neutral: "#A78BFA", Enojo: "#F97316",
  Ansiedad: "#8B5CF6", Miedo: "#7C3AED", Triste: "#F43F5E",
  Asco: "#84CC16", Crisis: "#EF4444", Indeterminado: "#64748B",
};

/* Emoji asociado a cada emoción para mostrar en las tarjetas de alarma */
const MOOD_EMOJI = {
  Crisis: "🚨", Triste: "😢", Enojo: "😠", Ansiedad: "😰",
  Miedo: "😨", Feliz: "😊", Excelente: "🌟", Agradecido: "🙏",
  Sorpresa: "😮", Neutral: "😐", Asco: "🤢", Indeterminado: "❓",
};

/* Tipos de gráfico disponibles para la distribución de emociones */
const CHART_TYPES = [
  { id: "bar", icon: BarChart3, label: "Barras" },
  { id: "pie", icon: PieChart, label: "Pastel" },
  { id: "radar", icon: Radar, label: "Radar" },
];

/* Convierte coordenadas polares a cartesianas para dibujar arcos SVG */
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/* Genera el string de path SVG para un arco de dona (anillo) */
function describeDonutArc(cx, cy, innerR, outerR, startDeg, endDeg) {
  const startOuter = polarToCartesian(cx, cy, outerR, endDeg);
  const endOuter = polarToCartesian(cx, cy, outerR, startDeg);
  const startInner = polarToCartesian(cx, cy, innerR, endDeg);
  const endInner = polarToCartesian(cx, cy, innerR, startDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${startInner.x} ${startInner.y}`,
    `Z`,
  ].join(" ");
}

/* Colores cíclicos para sectores del gráfico de pastel */
const PIE_COLORS = ["#EC4899", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#F97316", "#84CC16", "#7C3AED", "#F43F5E", "#6366F1", "#14B8A6"];

/* Componente de gráfico de pastel (donut) usando Recharts */
/* Muestra la emoción predominante en el centro del donut */
function PieChartRecharts({ data, dominant }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const chartData = data.map((d, i) => ({ name: d.name, value: d.count, color: PIE_COLORS[i % PIE_COLORS.length] }));
  return (
    <div className="relative" style={{ width: 260, height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RePieChart>
          {/* Donut: innerRadius hueco, paddingAngle separa sectores */}
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} stroke="none">
            {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          {/* Tooltip flotante con estilo redondeado */}
          <Tooltip contentStyle={{ borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", fontSize: "12px", fontWeight: "700" }} />
        </RePieChart>
      </ResponsiveContainer>
      {/* Etiqueta central: emoción predominante */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-sm font-black dark:text-white text-center leading-tight px-2" style={{ fontSize: dominant?.name?.length > 8 ? "11px" : "14px" }}>{dominant?.name || "—"}</span>
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">predominante</span>
      </div>
    </div>
  );
}

/* Componente de gráfico radar SVG personalizado */
/* Dibuja polígonos concéntricos, ejes radiales, etiquetas y datos */
function RadarChartSVG({ data, size = 300 }) {
  const cx = size / 2;
  const cy = size / 2;
  const n = data.length;
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const r = size * 0.35;
  const labelR = r + Math.max(20, Math.min(45, 55 - n * 2));
  const fontSize = Math.max(6.5, Math.min(9, 11 - n * 0.3));

  /* Calcula puntos de datos normalizados proporcionalmente */
  const dataPoints = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const val = d.count / maxVal;
    return { x: cx + r * val * Math.cos(angle), y: cy + r * val * Math.sin(angle), color: d.color, label: d.name, count: d.count };
  });

  /* String de polígono para los datos */
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  /* Punto en un eje a una escala dada (0-1) */
  const getPoint = (i, scale) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * scale * Math.cos(angle), y: cy + r * scale * Math.sin(angle) };
  };

  /* Punto para etiqueta en el extremo del eje */
  const getLabelPoint = (i, rScale) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const labelR_ = rScale;
    let x = cx + labelR_ * cos;
    let y = cy + labelR_ * sin;
    return { x, y, angle: angle * 180 / Math.PI, cos, sin };
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Cuadrícula concéntrica: 25%, 50%, 75%, 100% */}
      {[0.25, 0.5, 0.75, 1].map((level, li) => (
        <polygon key={li} points={data.map((_, i) => getPoint(i, level)).map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />
      ))}
      {/* Ejes radiales desde el centro */}
      {data.map((_, i) => {
        const end = getPoint(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />;
      })}
      {/* Etiquetas de cada eje */}
      {data.map((_, i) => {
        const lp = getLabelPoint(i, labelR);
        const anchor = lp.cos > 0.1 ? "start" : lp.cos < -0.1 ? "end" : "middle";
        return (
          <text key={`lbl-${i}`} x={lp.x} y={lp.y} textAnchor={anchor} dominantBaseline="middle"
            className="fill-slate-500 dark:fill-slate-400 font-bold uppercase" style={{ fontSize: `${fontSize}px` }}>
            {data[i].name}
          </text>
        );
      })}
      {/* Polígono de datos con relleno semitransparente */}
      <polygon points={dataPolygon} fill="rgba(99,102,241,0.12)" stroke="#6366F1" strokeWidth="2" />
      {/* Puntos de datos interactivos con tooltip nativo SVG */}
      {dataPoints.map((p, i) => (
        <g key={i} className="cursor-pointer">
          <title>{p.label}: {p.count} entradas</title>
          <circle cx={p.x} cy={p.y} r="4.5" fill={p.color} stroke="#fff" strokeWidth="2" />
        </g>
      ))}
    </svg>
  );
}

export default function AdminDashboard() {
  /* Tema actual y función para alternar entre claro/oscuro */
  const { theme, toggleTheme } = useTheme();
  /* Estado de verificación del rol admin: null=cargando, true=es admin, false=no */
  const [admin, setAdmin] = useState(null);
  /* Lista de alarmas/entradas con mood "Crisis" */
  const [alarms, setAlarms] = useState([]);
  /* Indicador de carga de datos iniciales */
  const [loading, setLoading] = useState(true);
  /* Texto de búsqueda para filtrar alarmas por email o texto */
  const [searchQuery, setSearchQuery] = useState("");
  /* Mapa de IDs de entrada -> booleano: true si se está enviando contacto */
  const [contacting, setContacting] = useState({});
  /* Estadísticas globales (total usuarios, total entradas) */
  const [stats, setStats] = useState({ total_users: 0, total_entries: 0 });
  /* Conteo de entradas agrupadas por emoción */
  const [moodCounts, setMoodCounts] = useState({});
  /* Tipo de gráfico activo: "bar" | "pie" | "radar" */
  const [chartType, setChartType] = useState("bar");
  /* Filtro de estado activo: "active" | "working" | "resolved" */
  const [statusFilter, setStatusFilter] = useState("active");
  /* Alternar visibilidad del formulario de información de contacto */
  const [showContactForm, setShowContactForm] = useState(false);
  /* Campos del formulario de contacto profesional */
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactActive, setContactActive] = useState(true);
  /* Indicador de guardado del formulario de contacto */
  const [savingContact, setSavingContact] = useState(false);
  /* Límite de elementos visibles por página en la tabla */
  const ITEMS_PER_PAGE = 15;

  /* Efecto inicial: verifica rol admin mediante RPC y carga datos */
  useEffect(() => {
    supabase.rpc("is_admin").then(({ data }) => {
      setAdmin(!!data);
      if (data) fetchAll();
      else setLoading(false);
    });
  }, []);

  /* Al abrir el formulario de contacto, carga los datos existentes del perfil admin */
  useEffect(() => {
    if (!showContactForm || !admin) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("contact_name, contact_email, contact_phone, contact_is_active")
        .eq("id", user.id).single();
      if (data) { setContactName(data.contact_name || ""); setContactEmail(data.contact_email || ""); setContactPhone(data.contact_phone || ""); setContactActive(data.contact_is_active !== false); }
    })();
  }, [showContactForm, admin]);

  /* Carga todos los datos del dashboard en paralelo: estadísticas, emociones, alarmas */
  const fetchAll = async () => {
    try {
      /* Tres consultas concurrentes: stats, entries (para emociones), crisis */
      const [{ data: statsData }, { data: entriesData }, { data: rawAlarms }] = await Promise.all([
        supabase.rpc("get_admin_stats"),
        supabase.from("entries").select("mood, status"),
        supabase.from("entries")
          .select("id, user_id, text, mood, score, status, created_at")
          .eq("mood", "Crisis")
          .limit(200),
      ]);

      if (statsData?.[0]) setStats(statsData[0]);

      /* Cuenta frecuencias de cada emoción para los gráficos */
      const counts = {};
      (entriesData || []).forEach((e) => {
        const m = e.mood || "Indeterminado";
        counts[m] = (counts[m] || 0) + 1;
      });
      setMoodCounts(counts);

      /* Normaliza alarmas: mapea campos de entries al formato de alarma */
      const allCrisis = (rawAlarms || []).map((e) => ({
        id: e.id,
        entry_id: e.id,
        user_id: e.user_id,
        email: "",
        student_email: "ID: " + (e.user_id || "").toString().slice(0, 8),
        diary_text: e.text,
        mood: e.mood,
        score: e.score,
        status: e.status || "active",
        recorded_at: e.created_at,
        contact_request_id: null,
        contact_status: null,
      }));
      setAlarms(allCrisis);
    } catch (err) { if (import.meta.env.DEV) console.error(err); }
    finally { setLoading(false); }
  };

  /* Cicla el estado de una alarma: active -> working -> resolved -> active */
  const handleStatusCycle = async (item) => {
    const cur = item.status || "active";
    const next = { active: "working", working: "resolved", resolved: "active" }[cur];
    try {
      await supabase.rpc("admin_update_entry_status", {
        target_entry_id: item.id || item.entry_id, new_status: next,
      });
      fetchAll();
    } catch (err) { if (import.meta.env.DEV) console.error(err); }
  };

  /* Envía solicitud de contacto al usuario dueño de la entrada en crisis */
  const handleContact = async (item) => {
    const entryId = item.id || item.entry_id;
    if (contacting[entryId]) return;
    if (!confirm("Enviar solicitud de contacto a este usuario?")) return;
    setContacting((prev) => ({ ...prev, [entryId]: true }));
    try {
      const { error } = await contactService.adminInitiateContact(
        item.user_id, entryId,
        "Un administrador desea contactarte. Revisa tu bandeja de entrada."
      );
      if (error) alert(error.message);
      else fetchAll();
    } catch (err) { if (import.meta.env.DEV) console.error(err); }
    finally { setContacting((prev) => ({ ...prev, [entryId]: false })); }
  };

  /* Estado: usuario no es admin → pantalla de acceso denegado */
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

  /* Estado: verificando rol o cargando datos → spinner */
  if (admin === null || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
      </div>
    );
  }

  /* Prepara el filtro de búsqueda (insensible a mayúsculas) */
  const q = searchQuery.toLowerCase();
  const filterFn = (item) => {
    if (!q) return true;
    const email = (item.student_email || item.email || "").toLowerCase();
    const text = (item.diary_text || "").toLowerCase();
    return email.includes(q) || text.includes(q);
  };
  const combinedFilter = (a) => filterFn(a);
  /* Alarmas filtradas por texto de búsqueda */
  const filteredAlarms = alarms.filter(combinedFilter);

  /* Total de entradas con emoción "Crisis" */
  const crisisCount = moodCounts["Crisis"] || 0;
  /* Emociones ordenadas de mayor a menor frecuencia para gráficos */
  const sortedMoods = Object.entries(moodCounts)
    .map(([name, count]) => ({ name, count, color: emotionColors[name] || "#64748B" }))
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count);
  const maxMood = sortedMoods[0]?.count || 1;

  /* Icono del tipo de gráfico seleccionado */
  const ChartIcon = CHART_TYPES.find((t) => t.id === chartType)?.icon || BarChart3;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Encabezado: título + botones de contacto, tema y cerrar sesión */}
          <header className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-500 font-black text-xs uppercase tracking-[0.3em]">
                <Shield className="w-4 h-4" /> Panel de Control
              </div>
              <h1 className="text-4xl font-black tracking-tight dark:text-white">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Botón para abrir/cerrar formulario de contacto profesional */}
              <button onClick={() => setShowContactForm(!showContactForm)}
                className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 transition-transform text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                style={{ color: showContactForm ? "#EC4899" : "#64748B" }}>
                <Send className="w-3.5 h-3.5" />
                Contacto
              </button>
              {/* Botón de alternar tema claro/oscuro */}
              <button onClick={toggleTheme}
                className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 transition-transform">
                {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
              </button>
              {/* Botón de cerrar sesión */}
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
                className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 transition-transform">
                <LogOut className="w-5 h-5 text-rose-500" />
              </button>
            </div>
          </header>

          {/* Formulario de información de contacto profesional (toggle) */}
          {showContactForm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm"
            >
              <p className="text-sm font-black dark:text-white mb-4 flex items-center gap-2">
                <Send className="w-4 h-4 text-fuchsia-500" /> Informacion de Contacto Profesional
              </p>
              <p className="text-[10px] text-slate-400 mb-5 font-medium">
                Estos datos se mostraran a los usuarios cuando acepten una solicitud de contacto.
              </p>
              <div className="space-y-4">
                {/* Campo: nombre del profesional */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Nombre</label>
                  <input className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-sm dark:text-white"
                    value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Dr. Juan Pérez" />
                </div>
                {/* Campo: correo del profesional */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Correo</label>
                  <input className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-sm dark:text-white"
                    value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="contacto@psicologia.com" type="email" />
                </div>
                {/* Campo: teléfono del profesional */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Telefono</label>
                  <input className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-sm dark:text-white"
                    value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+52 55 1234 5678" type="tel" />
                </div>
                {/* Toggle: disponible / no disponible para solicitudes */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs font-bold dark:text-white">Disponible para solicitudes</span>
                  <button onClick={() => setContactActive(!contactActive)}
                    className="w-11 h-5.5 rounded-full relative cursor-pointer border-none transition-colors"
                    style={{ backgroundColor: contactActive ? "#EC4899" : "#CBD5E1" }}>
                    <div className="w-4 h-4 rounded-full absolute top-[3px] transition-all shadow-sm"
                      style={{ left: contactActive ? "25px" : "3px", backgroundColor: "#fff" }} />
                  </button>
                </div>
                {/* Botón de guardar datos de contacto */}
                <button onClick={async () => {
                    setSavingContact(true);
                    try {
                      const { error } = await contactService.updateMyContactInfo(
                        contactEmail.trim(), contactPhone.trim(), contactName.trim(), contactActive
                      );
                      if (error) throw error;
                      setShowContactForm(false);
                    } catch (err) { alert(err.message); }
                    finally { setSavingContact(false); }
                  }} disabled={savingContact}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-bold text-xs uppercase tracking-wider border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50">
                  {savingContact ? "Guardando..." : "Guardar Contacto"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Tarjetas de estadísticas: usuarios, entradas, crisis, activas, resueltas */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total de usuarios registrados */}
            <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Usuarios</span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-3xl font-black dark:text-white">{stats.total_users}</p>
            </div>
            {/* Total de entradas registradas */}
            <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Entradas</span>
                <FileText className="w-4 h-4 text-fuchsia-500" />
              </div>
              <p className="text-3xl font-black dark:text-white">{stats.total_entries}</p>
            </div>
            {/* Conteo de entradas con emoción "Crisis" */}
            <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Crisis</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-3xl font-black text-rose-500">{crisisCount}</p>
            </div>
            {/* Alarmas con estado "active" */}
            <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Activas</span>
                <Activity className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-black text-amber-500">{alarms.filter(a => (a.status || "active") === "active").length}</p>
            </div>
            {/* Tarjeta de resueltas con barra de progreso SVG apilada */}
            <div className="col-span-2 lg:col-span-1 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Resueltas</span>
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-black text-emerald-500">{alarms.filter(a => a.status === "resolved").length}</p>
              {/* Barra de progreso SVG con segmentos: activo, en proceso, resuelto */}
              <svg viewBox="0 0 100 20" className="w-full h-5 mt-2">
                {(() => {
                  const total = alarms.length || 1;
                  const activeW = (alarms.filter(a => (a.status || "active") === "active").length / total) * 100;
                  const workingW = (alarms.filter(a => a.status === "working").length / total) * 100;
                  const resolvedW = (alarms.filter(a => a.status === "resolved").length / total) * 100;
                  return <>
                    <rect x="0" y="0" width={activeW} height="20" rx="4" fill="#EF4444" />
                    <rect x={activeW} y="0" width={workingW} height="20" rx="4" fill="#F59E0B" />
                    <rect x={activeW + workingW} y="0" width={resolvedW} height="20" rx="4" fill="#10B981" />
                  </>;
                })()}
              </svg>
              {/* Leyenda de colores para la barra */}
              <div className="flex items-center gap-3 mt-1.5 text-[8px] font-bold">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Crit</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Pro</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Res</span>
              </div>
            </div>
          </div>

          {/* Sección de gráficos: distribución de emociones */}
          {sortedMoods.length > 0 && (
            <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              {/* Encabezado con selector de tipo de gráfico */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-black dark:text-white uppercase tracking-wider">Distribución de Emociones</h2>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                  {CHART_TYPES.map((t) => {
                    const Icon = t.icon;
                    const active = chartType === t.id;
                    return (
                      <button key={t.id} onClick={() => setChartType(t.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-none cursor-pointer text-[10px] font-bold uppercase tracking-wider transition-all"
                        style={{
                          backgroundColor: active ? (theme === "dark" ? "#1E293B" : "#fff") : "transparent",
                          color: active ? (theme === "dark" ? "#fff" : "#0F172A") : "#94A3B8",
                          boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                        }}>
                        <Icon size={14} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gráfico de barras horizontales animadas */}
              {chartType === "bar" && (
                <div className="space-y-3">
                  {sortedMoods.map((m, i) => (
                    <motion.div key={m.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                        <span className="text-xs font-bold dark:text-white min-w-[80px]">{m.name}</span>
                        <span className="text-xs font-black text-slate-400 ml-auto">{m.count}</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(m.count / maxMood) * 100}%` }}
                          transition={{ duration: 0.6, delay: i * 0.04 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: m.color }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Gráfico de pastel (donut) con Recharts */}
              {chartType === "pie" && (
                <div className="flex flex-row items-center justify-center gap-6 py-4">
                  <PieChartRecharts data={sortedMoods} dominant={sortedMoods[0]} />
                  <div className="space-y-1">
                    {sortedMoods.map((m) => (
                      <div key={m.name} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                        <span className="text-[11px] font-bold dark:text-white min-w-[60px]">{m.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gráfico radar personalizado en SVG */}
              {chartType === "radar" && (
                <div className="flex justify-center py-4">
                  <RadarChartSVG data={sortedMoods} size={300} />
                </div>
              )}
            </div>
          )}

          {/* Barra de búsqueda y botón de recarga */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input type="text" placeholder="Buscar por email o texto..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-indigo-500/20 transition-all font-medium text-sm dark:text-white dark:placeholder:text-slate-500" />
            </div>
            <button onClick={fetchAll}
              className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 transition-transform">
              <RefreshCw className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Filtros de estado: Críticas / En Proceso / Resueltas con badge de conteo */}
          <div className="flex gap-1.5 overflow-x-auto pb-3 snap-x scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0">
            {(["active", "working", "resolved"]).map((status) => {
              const count = filteredAlarms.filter(a => (status === "active" ? (a.status || "active") === "active" : a.status === status)).length;
              const meta = STATUS_LABELS[status];
              const label = status === "active" ? "Críticas" : status === "working" ? "En Proceso" : "Resueltas";
              const selected = statusFilter === status;
              return (
                <button key={status} onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shrink-0 snap-start border ${
                    selected
                      ? "text-white shadow-lg"
                      : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                  }`}
                  style={selected ? {
                    backgroundColor: meta.color,
                    borderColor: meta.color,
                    boxShadow: `0 0 20px ${meta.color}60, 0 0 40px ${meta.color}30`,
                  } : {}}>
                  {label} <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Tabla de alarmas filtradas por estado y búsqueda */}
          <div className="bg-white dark:bg-slate-900/60 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-6">
            {(() => {
              const items = filteredAlarms.filter(a => statusFilter === "active" ? (a.status || "active") === "active" : a.status === statusFilter);
              const meta = STATUS_LABELS[statusFilter];
              const visibleItems = items.slice(0, ITEMS_PER_PAGE);
              const hasMore = items.length > ITEMS_PER_PAGE;

              return (
                <div className="space-y-3">
                  {items.length > 0 ? (
                    <>
                      {visibleItems.map((item, idx) => {
                        /* Desestructura campos de la alarma */
                        const st = item.status || "active";
                        const stMeta = STATUS_LABELS[st];
                        const uid = (item.id || item.entry_id || "").toString().slice(0, 8);
                        const entryKey = item.id || item.entry_id || `${statusFilter}-${idx}`;
                        const hasContact = item.contact_request_id != null;
                        const contactSt = item.contact_status;
                        const isContacting = contacting[entryKey];

                        return (
                          /* Tarjeta individual de alarma con animación escalonada */
                          <motion.div key={entryKey}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                            className="p-3 md:p-4 rounded-xl border bg-white dark:bg-slate-900/60 border-slate-100 dark:border-slate-800 shadow-sm"
                          >
                            <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-3">
                              {/* Columna de información: email, ID, estado, emoción, texto */}
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {/* Email del usuario */}
                                  <span className="font-bold text-xs md:text-sm dark:text-white truncate max-w-[140px] md:max-w-[200px]">
                                    {item.student_email || item.email || "Sin email"}
                                  </span>
                                  {/* ID corto de la entrada */}
                                  <span className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded text-[7px] font-bold tracking-widest uppercase">
                                    {uid}
                                  </span>
                                  {/* Badge de estado (Crítica/En Proceso/Resuelta) */}
                                  <span className="text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: stMeta.color, backgroundColor: `${stMeta.color}15` }}>
                                    {stMeta.label}
                                  </span>
                                  {/* Badge de emoción con emoji */}
                                  <span className="px-1.5 py-0.5 rounded-md text-[9px] md:text-[10px] font-bold flex items-center gap-1" style={{ backgroundColor: `${emotionColors[item.mood] || "#64748B"}18`, color: emotionColors[item.mood] || "#64748B" }}>
                                    <span className="text-[11px]">{MOOD_EMOJI[item.mood] || "❓"}</span>
                                    <span>{item.mood}</span>
                                  </span>
                                  {/* Indicador de estado de solicitud de contacto */}
                                  {hasContact && (
                                    <span className="text-[9px] font-bold"
                                      style={{ color: contactSt === "accepted" ? "#10B981" : contactSt === "rejected" ? "#EF4444" : "#F59E0B" }}>
                                      {contactSt === "pending" ? "⏳" : contactSt === "accepted" ? "✓" : "✗"}
                                    </span>
                                  )}
                                </div>
                                {/* Texto de la entrada (diario) truncado a 2 líneas */}
                                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm italic line-clamp-2 leading-relaxed">"{item.diary_text}"</p>
                                {/* Fecha formateada con date-fns locale español */}
                                {(item.recorded_at || item.created_at) && (
                                  <p className="text-[9px] font-bold text-slate-400">{format(new Date(item.recorded_at || item.created_at), "dd MMM HH:mm", { locale: es })}</p>
                                )}
                              </div>
                              {/* Columna de acciones: contactar + cambiar estado */}
                              <div className="flex items-center gap-1.5 shrink-0 md:pt-0 pt-1">
                                {/* Botón "Contactar" (solo si no está resuelto y no tiene solicitud previa) */}
                                {st !== "resolved" && !hasContact && (
                                  <button onClick={() => handleContact(item)} disabled={isContacting}
                                    className="px-2.5 py-1.5 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all hover:scale-105 disabled:opacity-50 border-none cursor-pointer"
                                    style={{ backgroundColor: "#6366F120", color: "#6366F1" }}>
                                    {isContacting ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Send className="w-2.5 h-2.5" />}
                                    Contactar
                                  </button>
                                )}
                                {/* Botón para ciclar estado: Proceso → Resolver → Reabrir */}
                                <button onClick={() => handleStatusCycle(item)}
                                  className="px-2.5 py-1.5 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all hover:scale-105 border-none cursor-pointer"
                                  style={{ backgroundColor: `${stMeta.color}15`, color: stMeta.color }}>
                                  <RefreshCw className="w-2.5 h-2.5" />
                                  {st === "active" ? "Proceso" : st === "working" ? "Resolver" : "Reabrir"}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                      {/* Mensaje de paginación cuando hay más de ITEMS_PER_PAGE */}
                      {hasMore && (
                        <p className="text-center text-[10px] font-bold text-slate-400 italic pt-2 border-t border-slate-100 dark:border-slate-800">
                          Mostrando {ITEMS_PER_PAGE} de {items.length} — usá el buscador para filtrar
                        </p>
                      )}
                    </>
                  ) : (
                    /* Mensaje de lista vacía según el filtro de estado */
                    <p className="text-xs text-slate-400 italic text-center py-8">
                      {statusFilter === "active" ? "No hay alertas activas" : statusFilter === "working" ? "No hay casos en proceso" : "No hay casos resueltos"}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
