import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Sparkles, TrendingUp, Clock, Zap, Loader2 } from "lucide-react";
import { Card } from "../components/Card";
import { BottomNav } from "../components/BottomNav";
import { useAuth } from "../components/AuthProvider";
import { supabase } from "../../lib/supabase";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const emotionsMap = [
  { name: "Excelente", color: "#10B981" },
  { name: "Feliz", color: "#6366F1" },
  { name: "Agradecido", color: "#FACC15" },
  { name: "Sorpresa", color: "#06B6D4" },
  { name: "Neutral", color: "#94A3B8" },
  { name: "Enojo", color: "#F97316" },
  { name: "Ansiedad", color: "#8B5CF6" },
  { name: "Miedo", color: "#4B5563" },
  { name: "Triste", color: "#F87171" },
  { name: "Crisis", color: "#EF4444" },
];

const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function StatisticsScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"Semana" | "Mes" | "Año">("Semana");

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      setProfile(profileData);

      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setEntries(data || []);
    } catch (e) {
      console.error("Error:", e);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar por periodo
  const getFilteredEntries = () => {
    const now = new Date();
    let cutoff = new Date();
    if (period === "Semana") cutoff.setDate(now.getDate() - 7);
    else if (period === "Mes") cutoff.setMonth(now.getMonth() - 1);
    else cutoff.setFullYear(now.getFullYear() - 1);

    return entries.filter((e) => new Date(e.created_at) >= cutoff);
  };

  const filtered = getFilteredEntries();

  // Datos para gráfica de línea (Trayectoria)
  const lineData = filtered.map((e) => ({
    label: new Date(e.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short" }),
    score: Math.round(((e.score + 1) / 2) * 10),
  }));

  // Datos para gráfica de barras (Frecuencia por día de la semana)
  const barMap: Record<string, number> = {};
  dayNames.forEach((d) => (barMap[d] = 0));
  filtered.forEach((e) => {
    const day = dayNames[new Date(e.created_at).getDay()];
    barMap[day]++;
  });
  const barData = dayNames.map((d) => ({ day: d, entradas: barMap[d] }));

  // Datos para gráfica de pastel (Distribución de moods)
  const moodCounts: Record<string, number> = {};
  filtered.forEach((e) => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  });
  const pieData = emotionsMap
    .filter((emo) => moodCounts[emo.name])
    .map((emo) => ({
      name: emo.name,
      value: moodCounts[emo.name],
      color: emo.color,
    }));

  // Insight
  const getInsight = () => {
    if (filtered.length < 2) return "Necesitamos más registros para darte un análisis de tendencia.";
    const scores = filtered.map((e) => e.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg > 0.4) return "Tu energía general es vibrante y positiva en este periodo. ¡Sigue así!";
    if (avg > -0.1) return "Mantienes un equilibrio emocional notable. Estás en tu centro.";
    return "Este periodo ha sido emocionalmente exigente. Prioriza tu descanso y bienestar.";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 py-8 space-y-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold">Estadísticas</h1>
          <p className="text-muted-foreground mt-1">
            Tu evolución histórica ({period})
          </p>
        </motion.div>

        {/* Period selector */}
        <div className="grid grid-cols-3 gap-3">
          {(["Semana", "Mes", "Año"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                period === p
                  ? "bg-primary text-white"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card padding="md" className="text-center">
            <TrendingUp className="w-5 h-5 text-calm-teal mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Racha</p>
            <p className="text-xl font-bold">{profile?.streak || 0} días</p>
          </Card>
          <Card padding="md" className="text-center">
            <Zap className="w-5 h-5 text-warm-coral mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-xl font-bold">{entries.length}</p>
          </Card>
          <Card padding="md" className="text-center">
            <Clock className="w-5 h-5 text-intelligent-indigo mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Periodo</p>
            <p className="text-xl font-bold">{filtered.length}</p>
          </Card>
        </div>

        {filtered.length > 0 ? (
          <>
            {/* Trayectoria */}
            <Card padding="lg">
              <h3 className="font-semibold mb-4">Trayectoria Personal</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="currentColor" />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} stroke="currentColor" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--intelligent-indigo)"
                    strokeWidth={3}
                    dot={{ fill: "var(--intelligent-indigo)", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Frecuencia por día */}
            <Card padding="lg">
              <h3 className="font-semibold mb-4">Frecuencia de Entradas</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="currentColor" />
                  <YAxis tick={{ fontSize: 12 }} stroke="currentColor" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                    }}
                  />
                  <Bar dataKey="entradas" fill="var(--emotional-lavender)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Panorama Mental (Pie) */}
            <Card padding="lg">
              <h3 className="font-semibold mb-4">Panorama Mental</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </>
        ) : (
          <Card padding="lg" className="text-center">
            <p className="text-muted-foreground py-8">
              No hay datos para este periodo. ¡Escribe más entradas!
            </p>
          </Card>
        )}

        {/* Insight */}
        <Card padding="lg" gradient>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-calm-teal/10">
              <Sparkles className="w-6 h-6 text-calm-teal" />
            </div>
            <div>
              <h4 className="font-semibold mb-2">Análisis de Bienestar</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getInsight()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
