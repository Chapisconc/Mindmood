import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Check, Sparkles, TrendingUp, Lightbulb, Heart, AlertTriangle } from "lucide-react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

const MOOD_COLORS: Record<string, string> = {
  Excelente: "var(--mood-joyful)",
  Feliz: "#22c55e",
  Agradecido: "var(--calm-teal)",
  Sorpresa: "var(--emotional-lavender)",
  Neutral: "var(--mood-neutral)",
  Triste: "var(--mood-sad)",
  Enojo: "#ef4444",
  Ansiedad: "var(--mood-anxious)",
  Miedo: "#a855f7",
  Crisis: "#dc2626",
};

interface AnalysisResult {
  mood: string;
  all_moods: string[];
  emotions_distribution: Record<string, number>;
  score: number;
  confidence: number;
  summary: string;
  requires_help: boolean;
  crisis_level: string;
}

export function InsightScreen() {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [entryText, setEntryText] = useState("");

  useEffect(() => {
    const savedAnalysis = sessionStorage.getItem("lastAnalysis");
    const savedText = sessionStorage.getItem("lastEntryText");
    if (savedAnalysis) {
      setAnalysis(JSON.parse(savedAnalysis));
    }
    if (savedText) {
      setEntryText(savedText);
    }
  }, []);

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No hay análisis disponible.</p>
          <Button variant="gradient" onClick={() => navigate("/write")}>
            Escribe una entrada
          </Button>
        </div>
      </div>
    );
  }

  // Preparar datos para la gráfica de pastel desde la respuesta real
  const emotionData = Object.entries(analysis.emotions_distribution).map(
    ([name, value]) => ({
      name,
      value,
      color: MOOD_COLORS[name] || "#94a3b8",
    })
  );

  const confidencePercent = Math.round(analysis.confidence * 100);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 py-8 space-y-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="flex flex-col items-center text-center mb-8"
        >
          <div className={`p-6 rounded-full mb-4 ${
            analysis.requires_help
              ? "bg-gradient-to-br from-red-500 to-orange-500"
              : "bg-gradient-to-br from-intelligent-indigo to-emotional-lavender"
          }`}>
            {analysis.requires_help ? (
              <AlertTriangle className="w-16 h-16 text-white" />
            ) : (
              <Check className="w-16 h-16 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2">Entrada Analizada</h1>
          <p className="text-muted-foreground">
            {analysis.summary}
          </p>
        </motion.div>

        {analysis.requires_help && (
          <Card padding="lg" className="border-2 border-red-500/50 bg-red-500/5">
            <div className="flex gap-4 items-start">
              <div className="p-3 rounded-lg bg-red-500/10">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h4 className="font-semibold text-red-500 mb-2">Alerta de Bienestar</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Detectamos que podrías estar pasando por un momento muy difícil.
                  No estás solo/a. Considera hablar con alguien de confianza o contactar
                  la Línea de la Vida: 800-911-2000 (México, disponible 24/7).
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card padding="lg">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-warm-coral" />
            Composición Emocional
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={emotionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {emotionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                Puntuación de Confianza:
              </span>{" "}
              {confidencePercent}% — {confidencePercent >= 70 ? "Alta confianza en este análisis" : "Confianza moderada"}
            </p>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Detalle del Análisis
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Estado de ánimo principal</span>
              <span className="font-semibold">{analysis.mood}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Emociones detectadas</span>
              <span className="font-semibold">{analysis.all_moods.join(", ")}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Puntuación VADER</span>
              <span className={`font-semibold ${analysis.score >= 0 ? "text-green-500" : "text-red-500"}`}>
                {analysis.score > 0 ? "+" : ""}{analysis.score}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Nivel de crisis</span>
              <span className={`font-semibold ${analysis.crisis_level === "critical" ? "text-red-500" : "text-green-500"}`}>
                {analysis.crisis_level === "critical" ? "Crítico" : "Normal"}
              </span>
            </div>
          </div>
        </Card>

        <Card padding="lg" gradient>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-calm-teal/10">
              <Lightbulb className="w-6 h-6 text-calm-teal" />
            </div>
            <div>
              <h4 className="font-semibold mb-2">Reflexión de la IA</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.summary}
              </p>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => navigate("/home")}
          >
            Volver al Inicio
          </Button>
          <Button
            variant="gradient"
            size="lg"
            fullWidth
            onClick={() => navigate("/write")}
          >
            Nueva Entrada
          </Button>
        </div>
      </div>
    </div>
  );
}
