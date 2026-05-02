import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Calendar, Search, Loader2 } from "lucide-react";
import { Card } from "../components/Card";
import { BottomNav } from "../components/BottomNav";
import { useAuth } from "../components/AuthProvider";
import { supabase } from "../../lib/supabase";

const moodConfig: Record<string, { color: string; icon: string }> = {
  Excelente: { color: "bg-green-500", icon: "⭐" },
  Feliz: { color: "bg-indigo-500", icon: "😊" },
  Agradecido: { color: "bg-yellow-500", icon: "🙏" },
  Sorpresa: { color: "bg-cyan-500", icon: "😲" },
  Neutral: { color: "bg-slate-400", icon: "😐" },
  Enojo: { color: "bg-orange-500", icon: "😠" },
  Ansiedad: { color: "bg-purple-500", icon: "😰" },
  Miedo: { color: "bg-gray-600", icon: "😨" },
  Triste: { color: "bg-red-400", icon: "😢" },
  Crisis: { color: "bg-red-600", icon: "🚨" },
};

interface Entry {
  id: string;
  text: string;
  mood: string;
  score: number;
  created_at: string;
}

export function HistoryScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user) fetchEntries();
  }, [user]);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (e) {
      console.error("Error cargando historial:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter(
    (e) =>
      e.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.mood.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
          <h1 className="text-2xl font-bold">Tu Recorrido</h1>
          <span className="text-sm text-muted-foreground">
            {entries.length} {entries.length === 1 ? "entrada" : "entradas"}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar en tus entradas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-secondary rounded-[var(--radius-lg)] border border-border focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
        </motion.div>

        <div className="space-y-4">
          {filteredEntries.map((entry, index) => {
            const config = moodConfig[entry.mood] || { color: "bg-slate-400", icon: "😐" };
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover padding="lg">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-2 min-w-[60px]">
                      <div
                        className={`w-14 h-14 rounded-full ${config.color} flex items-center justify-center`}
                      >
                        <span className="text-2xl">{config.icon}</span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{formatDate(entry.created_at)}</h4>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(entry.created_at)}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {entry.text}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-full text-xs font-medium text-foreground">
                          <span>{config.icon}</span>
                          {entry.mood}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          entry.score >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                        }`}>
                          {entry.score > 0 ? "+" : ""}{entry.score}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {entries.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="bg-secondary/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Aún no hay entradas</h3>
            <p className="text-muted-foreground mb-6">
              Comienza tu viaje de bienestar emocional hoy
            </p>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
