/* ================================================================== */
/* themes.js — Definiciones de temas claro y oscuro para MindMood     */
/* Exporta un objeto `themes` con dos variantes (light/dark).         */
/* Cada tema contiene colores para fondo, tarjetas, texto, bordes,    */
/* gradientes, sombras, inputs y placeholders.                        */
/* Usado por ThemeContext.jsx para proveer estilos a la app.          */
/* ================================================================== */

export const themes = {
  /* Tema claro — Colores base: slate claro + indigo como acento */
  light: {
    background: "#F8FAFC",
    card: "#FFFFFF",
    text: "#0F172A",
    secondaryText: "#6366F1",
    accent: "#6366F1",
    accentGradient: ["#6366F1", "#EC4899", "#F59E0B"],
    border: "#E2E8F0",
    header: "#FFFFFF",
    tabBar: "#FFFFFF",
    error: "#EF4444",
    success: "#10B981",
    neutral: "#F59E0B",
    itemBg: "#F1F5F9",
    cardGradient: ["#FFFFFF", "#F8FAFC"],
    softAccent: "rgba(99, 102, 241, 0.08)",
    shadow: "rgba(99, 102, 241, 0.15)",
    glassBg: "rgba(255, 255, 255, 0.75)",
    glow: "#818CF8",
    inputBg: "#F8FAFC",
    placeholder: "#94A3B8",
  },
  /* Tema oscuro — Colores base: slate oscuro + indigo claro como acento */
  dark: {
    background: "#020617",
    card: "#1E293B",
    text: "#F8FAFC",
    secondaryText: "#818CF8",
    accent: "#818CF8",
    accentGradient: ["#818CF8", "#F472B6", "#38BDF8"],
    border: "#334155",
    header: "#0F172A",
    tabBar: "#0F172A",
    error: "#F87171",
    success: "#34D399",
    neutral: "#FBBF24",
    itemBg: "#1E293B",
    cardGradient: ["#1E293B", "#0F172A"],
    softAccent: "rgba(129, 140, 248, 0.12)",
    shadow: "rgba(0, 0, 0, 0.4)",
    glassBg: "rgba(30, 41, 59, 0.8)",
    glow: "#F472B6",
    inputBg: "#0F172A",
    placeholder: "#64748B",
  },
};
