import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Users,
  FileText,
  AlertTriangle,
  TrendingUp,
  Shield,
  Loader2,
  Brain,
  RefreshCw,
} from "lucide-react";
import { Card } from "../components/Card";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../components/AuthProvider";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const emotionsMap = [
  { name: "Excelente", color: "#10B981", icon: "⭐" },
  { name: "Feliz", color: "#6366F1", icon: "😊" },
  { name: "Agradecido", color: "#FACC15", icon: "🙏" },
  { name: "Sorpresa", color: "#06B6D4", icon: "😲" },
  { name: "Neutral", color: "#94A3B8", icon: "😐" },
  { name: "Enojo", color: "#F97316", icon: "😠" },
  { name: "Ansiedad", color: "#8B5CF6", icon: "😰" },
  { name: "Miedo", color: "#4B5563", icon: "😨" },
  { name: "Triste", color: "#F87171", icon: "😢" },
  { name: "Crisis", color: "#EF4444", icon: "🚨" },
];

interface AdminStats {
  total_users: number;
  total_entries: number;
  excellent_entries: number;
  happy_entries: number;
  sad_entries: number;
  neutral_entries: number;
  crisis_entries: number;
  anger_entries: number;
  anxiety_entries: number;
  fear_entries: number;
  gratitude_entries: number;
  surprise_entries: number;
}

interface CrisisAlarm {
  entry_id: string;
  student_email: string;
  diary_text: string;
  recorded_at: string;
  crisis_score: number;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [alarms, setAlarms] = useState<CrisisAlarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Obtener estadísticas globales
      const { data: statsData, error: statsError } = await supabase.rpc("get_admin_stats");
      if (statsError) throw statsError;
      if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }

      // Obtener alertas de crisis
      const { data: alarmsData, error: alarmsError } = await supabase.rpc("get_admin_alarms");
      if (alarmsError) throw alarmsError;
      setAlarms(alarmsData || []);
    } catch (e: any) {
      console.error("Error cargando datos de admin:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdminData();
  };

  const handleResolve = async (id: string) => {
    try {
      const { error } = await supabase.rpc("resolve_entry", { target_id: id });
      if (error) throw error;
      fetchAdminData();
    } catch (err) {
      console.error("Error resolving entry:", err);
      alert("No se pudo resolver la entrada.");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Preparar datos del pie chart
  const pieData = stats
    ? [
        { name: "Excelente", value: stats.excellent_entries, color: "#10B981" },
        { name: "Feliz", value: stats.happy_entries, color: "#6366F1" },
        { name: "Agradecido", value: stats.gratitude_entries, color: "#FACC15" },
        { name: "Sorpresa", value: stats.surprise_entries, color: "#06B6D4" },
        { name: "Neutral", value: stats.neutral_entries, color: "#94A3B8" },
        { name: "Enojo", value: stats.anger_entries, color: "#F97316" },
        { name: "Ansiedad", value: stats.anxiety_entries, color: "#8B5CF6" },
        { name: "Miedo", value: stats.fear_entries, color: "#4B5563" },
        { name: "Triste", value: stats.sad_entries, color: "#F87171" },
        { name: "Crisis", value: stats.crisis_entries, color: "#EF4444" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="px-6 py-8 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-intelligent-indigo to-emotional-lavender">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Panel de Administración</h1>
              <p className="text-muted-foreground text-sm">MindMood — Vista Global</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
              title="Refrescar datos"
            >
              <RefreshCw className={`w-5 h-5 text-foreground ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-xl text-sm font-medium text-warm-coral hover:bg-warm-coral/10 transition-colors"
            >
              Salir
            </button>
          </div>
        </motion.div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card padding="lg" className="text-center">
              <Users className="w-8 h-8 text-intelligent-indigo mx-auto mb-2" />
              <p className="text-3xl font-bold">{stats?.total_users || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Usuarios Totales</p>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card padding="lg" className="text-center">
              <FileText className="w-8 h-8 text-calm-teal mx-auto mb-2" />
              <p className="text-3xl font-bold">{stats?.total_entries || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Entradas Totales</p>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card padding="lg" className="text-center">
              <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-3xl font-bold">
                {stats ? (stats.excellent_entries || 0) + (stats.happy_entries || 0) + (stats.gratitude_entries || 0) : 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Entradas Positivas</p>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card padding="lg" className="text-center">
              <AlertTriangle className={`w-8 h-8 mx-auto mb-2 ${(stats?.crisis_entries || 0) > 0 ? "text-red-500" : "text-muted-foreground"}`} />
              <p className={`text-3xl font-bold ${(stats?.crisis_entries || 0) > 0 ? "text-red-500" : ""}`}>
                {stats?.crisis_entries || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Alertas de Crisis</p>
            </Card>
          </motion.div>
        </div>

        {/* Crisis Alerts */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <Card padding="lg" className={alarms.length > 0 ? "border-2 border-red-500/30 bg-red-500/5" : "border border-green-500/20 bg-green-500/5"}>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${alarms.length > 0 ? "text-red-500" : "text-green-600"}`}>
              {alarms.length > 0 ? (
                <>
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                  Panel de Riesgo — Últimas Alertas de Crisis
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Estado del Sistema: Sin Alertas Críticas
                </>
              )}
            </h3>
            
            {alarms.length > 0 ? (
              <div className="space-y-4">
                {alarms.map((alarm, i) => (
                  <div key={i} className="p-4 bg-background rounded-xl border border-border">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{alarm.student_email}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alarm.recorded_at).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{alarm.diary_text}</p>
                    <div className="flex justify-between items-end mt-2">
                      <span className="inline-block px-3 py-1 bg-red-500/10 text-red-500 text-xs font-semibold rounded-full">
                        Score: {typeof alarm.crisis_score === 'number' ? alarm.crisis_score.toFixed(2) : '0.00'}
                      </span>
                      <button
                        onClick={() => handleResolve(alarm.entry_id)}
                        className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Marcar como Resuelto
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No se han detectado indicadores de riesgo en las últimas entradas. El bienestar institucional se mantiene estable.</p>
            )}
          </Card>
        </motion.div>

        {/* Panorama Mental Global */}
        {pieData.length > 0 && (
          <Card padding="lg">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Panorama Mental Global
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Desglose por Emoción */}
        <Card padding="lg">
          <h3 className="font-semibold mb-4">Desglose por Emoción</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {emotionsMap.map((emo) => {
              const count = stats
                ? {
                    Excelente: stats.excellent_entries,
                    Feliz: stats.happy_entries,
                    Agradecido: stats.gratitude_entries,
                    Sorpresa: stats.surprise_entries,
                    Neutral: stats.neutral_entries,
                    Enojo: stats.anger_entries,
                    Ansiedad: stats.anxiety_entries,
                    Miedo: stats.fear_entries,
                    Triste: stats.sad_entries,
                    Crisis: stats.crisis_entries,
                  }[emo.name] || 0
                : 0;

              return (
                <div
                  key={emo.name}
                  className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl"
                >
                  <span className="text-2xl">{emo.icon}</span>
                  <div>
                    <p className="text-xs text-muted-foreground">{emo.name}</p>
                    <p className="font-bold" style={{ color: emo.color }}>
                      {count}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
