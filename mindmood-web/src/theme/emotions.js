export const EMOTIONS_MAP = [
  { name: "Excelente", color: "#10B981", icon: "star", desc: "Plenitud total.", value: 1 },
  { name: "Feliz", color: "#EC4899", icon: "happy-outline", desc: "Bienestar y paz.", value: 0.7 },
  { name: "Agradecido", color: "#FBBF24", icon: "heart-outline", desc: "Gratitud profunda.", value: 0.5 },
  { name: "Sorpresa", color: "#06B6D4", icon: "flash", desc: "Asombro positivo.", value: 0.4 },
  { name: "Neutral", color: "#A78BFA", icon: "remove-circle", desc: "Calma estable.", value: 0 },
  { name: "Enojo", color: "#F97316", icon: "flame", desc: "Frustración.", value: -0.4 },
  { name: "Ansiedad", color: "#8B5CF6", icon: "pulse-outline", desc: "Inquietud persistente.", value: -0.5 },
  { name: "Miedo", color: "#7C3AED", icon: "eye-off-outline", desc: "Inseguridad.", value: -0.7 },
  { name: "Triste", color: "#F43F5E", icon: "rainy-outline", desc: "Melancolía.", value: -0.8 },
  { name: "Asco", color: "#84CC16", icon: "sad-outline", desc: "Rechazo.", value: -0.9 },
  { name: "Crisis", color: "#EF4444", icon: "alert-circle", desc: "Apoyo urgente.", value: -1 },
  { name: "Indeterminado", color: "#64748B", icon: "help-circle", desc: "Sentimiento ambiguo.", value: 0 },
];

export const getEmotionByName = (name) =>
  EMOTIONS_MAP.find((e) => e.name === name) || EMOTIONS_MAP[3];
export const getEmotionColor = (name) => getEmotionByName(name).color;
