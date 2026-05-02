import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { X, Send, Loader2 } from "lucide-react";
import { Button } from "../components/Button";
import { useAuth } from "../components/AuthProvider";
import { supabase, API_URL } from "../../lib/supabase";

export function WriteEntryScreen() {
  const [entry, setEntry] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!entry.trim() || !user) return;

    setIsAnalyzing(true);
    try {
      // 1. Enviar a la API de IA para análisis
      let aiData = { mood: "Neutral", score: 0, requires_help: false, summary: "", emotions_distribution: {}, all_moods: ["Neutral"], confidence: 0.5, crisis_level: "normal" };

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos para Render

        const response = await fetch(`${API_URL}/analyze`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true"
          },
          body: JSON.stringify({ text: entry, language: "es" }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          aiData = await response.json();
        }
      } catch (e) {
        console.log("API de IA no disponible o timeout, usando valores por defecto.");
      }

      // 2. Guardar en Supabase
      const { error: entryError } = await supabase
        .from("entries")
        .insert([{
          user_id: user.id,
          text: entry,
          mood: aiData.mood,
          score: aiData.score,
        }]);

      if (entryError) throw entryError;

      // 3. Actualizar racha (streak)
      await updateStreak(user.id);

      // 4. Guardar resultado para la pantalla de insight
      sessionStorage.setItem("lastAnalysis", JSON.stringify(aiData));
      sessionStorage.setItem("lastEntryText", entry);

      navigate("/insight");
    } catch (error: any) {
      console.error("Error al guardar:", error);
      setIsAnalyzing(false);
      alert(error.message || "Error al guardar la entrada. Inténtalo de nuevo.");
    }
  };

  const updateStreak = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("streak, last_entry_at")
        .eq("id", userId)
        .single();

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      let newStreak = 1;
      if (profile?.last_entry_at) {
        const lastDate = new Date(profile.last_entry_at);
        const lastTime = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
        const diffDays = (today - lastTime) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
          newStreak = (profile.streak || 0) + 1;
        } else if (diffDays === 0) {
          newStreak = profile.streak || 1;
        }
      }

      await supabase
        .from("profiles")
        .update({ streak: newStreak, last_entry_at: now.toISOString() })
        .eq("id", userId);
    } catch (e) {
      console.log("Error actualizando racha:", e);
    }
  };

  const wordCount = entry.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-6 border-b border-border"
      >
        <button
          onClick={() => navigate("/home")}
          className="p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <X className="w-6 h-6 text-foreground" />
        </button>

        <div className="flex items-center gap-4">
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-primary"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analizando...</span>
            </motion.div>
          )}
          <span className="text-sm text-muted-foreground">
            {wordCount} palabras
          </span>
        </div>
      </motion.div>

      <div className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-bold mb-2">
            Reflexión del Día
          </h2>
          <p className="text-muted-foreground">
            Escribe libremente. Tu diario es un espacio seguro para descargar tu mente.
          </p>
        </motion.div>

        <motion.textarea
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="Hoy mi mente se siente..."
          className="w-full h-96 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none resize-none text-lg leading-relaxed"
          autoFocus
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 border-t border-border"
      >
        <Button
          variant="gradient"
          size="lg"
          fullWidth
          onClick={handleSubmit}
          disabled={!entry.trim() || isAnalyzing}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Analizando y guardando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Guardar en la Bóveda
              <Send className="w-5 h-5" />
            </span>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
