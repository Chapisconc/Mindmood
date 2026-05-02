import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  PlusCircle,
  TrendingUp,
  User,
  Smile,
  Meh,
  Frown,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Card } from "../components/Card";
import { BottomNav } from "../components/BottomNav";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "../components/AuthProvider";
import { supabase } from "../../lib/supabase";

const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function HomeScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [weekData, setWeekData] = useState<any[]>([]);
  const [latestMood, setLatestMood] = useState<string>("Neutral");
  const [latestScore, setLatestScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Perfil del usuario
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      setProfile(profileData);

      // Últimas entradas de la semana
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const { data: entries } = await supabase
        .from("entries")
        .select("*")
        .eq("user_id", user!.id)
        .gte("created_at", lastWeek.toISOString())
        .order("created_at", { ascending: true });

      if (entries && entries.length > 0) {
        // Transformar entradas para la gráfica
        const chartData = entries.map((e: any) => ({
          day: dayNames[new Date(e.created_at).getDay()],
          mood: Math.round(((e.score + 1) / 2) * 10), // Convertir score (-1,1) a escala (0,10)
        }));
        setWeekData(chartData);

        // Último mood
        const last = entries[entries.length - 1];
        setLatestMood(last.mood);
        setLatestScore(last.score);
      }
    } catch (e) {
      console.error("Error cargando datos:", e);
    } finally {
      setLoading(false);
    }
  };

  const moodScale = Math.round(((latestScore + 1) / 2) * 10);
  
  const getMoodIcon = (mood: number) => {
    if (mood >= 7) return <Smile className="w-8 h-8" />;
    if (mood >= 4) return <Meh className="w-8 h-8" />;
    return <Frown className="w-8 h-8" />;
  };

  const getMoodColor = (mood: number) => {
    if (mood >= 7) return "bg-mood-joyful";
    if (mood >= 4) return "bg-mood-calm";
    return "bg-mood-sad";
  };

  const getMoodText = (mood: string) => {
    const texts: Record<string, string> = {
      Excelente: "Increíble",
      Feliz: "Bien",
      Agradecido: "Agradecido/a",
      Sorpresa: "Sorprendido/a",
      Neutral: "Tranquilo/a",
      Triste: "Triste",
      Enojo: "Enojado/a",
      Ansiedad: "Ansioso/a",
      Miedo: "Con Miedo",
      Crisis: "En Crisis",
    };
    return texts[mood] || mood;
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
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-2xl font-bold">¿Cómo te sientes hoy?</h1>
            <p className="text-muted-foreground mt-1">
              {new Date().toLocaleDateString("es-MX", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={() => navigate("/profile")}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <User className="w-6 h-6 text-foreground" />
          </button>
        </motion.div>

        <Card hover padding="lg" className="text-center">
          <motion.div
            className="flex flex-col items-center gap-4"
            whileHover={{ scale: 1.02 }}
          >
            <div className={`${getMoodColor(moodScale)} p-6 rounded-full text-white`}>
              {getMoodIcon(moodScale)}
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                {weekData.length > 0
                  ? `Te sientes ${getMoodText(latestMood)}`
                  : "¡Escribe tu primera entrada!"}
              </h3>
              <p className="text-muted-foreground mt-1">
                {weekData.length > 0
                  ? "Basado en tu última entrada"
                  : "Comienza tu viaje emocional hoy"}
              </p>
              {profile?.streak > 0 && (
                <p className="text-sm text-primary mt-2 font-semibold">
                  🔥 Racha: {profile.streak} {profile.streak === 1 ? "día" : "días"}
                </p>
              )}
            </div>
          </motion.div>
        </Card>

        {weekData.length > 0 && (
          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Tu Ánimo Esta Semana</h3>
              <button
                onClick={() => navigate("/statistics")}
                className="text-primary hover:underline text-sm"
              >
                Ver Todo
              </button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weekData}>
                <XAxis
                  dataKey="day"
                  stroke="currentColor"
                  className="text-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 10]}
                  stroke="currentColor"
                  className="text-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="var(--intelligent-indigo)"
                  strokeWidth={3}
                  dot={{ fill: "var(--intelligent-indigo)", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {weekData.length === 0 && (
          <Card padding="lg" className="text-center">
            <p className="text-muted-foreground py-8">
              Aún no tienes entradas esta semana. ¡Escribe tu primera reflexión!
            </p>
          </Card>
        )}
      </div>

      <motion.button
        onClick={() => navigate("/write")}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-6 bg-gradient-to-r from-intelligent-indigo to-emotional-lavender text-white p-4 rounded-full shadow-xl flex items-center gap-2"
      >
        <PlusCircle className="w-6 h-6" />
        <span className="font-medium pr-2">Nueva Entrada</span>
      </motion.button>

      <BottomNav />
    </div>
  );
}
