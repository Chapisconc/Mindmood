/* ================================================================== */
/* spacing.js — Sistema de diseño (Design System) de MindMood         */
/* Define tokens de espaciado, bordes redondeados, tamaños de fuente, */
/* pesos tipográficos, sombras y colores temáticos.                   */
/* Diseñado para ser usado con React Native / estilo inline.          */
/* ================================================================== */

/* Escala de espaciado (padding/margin) en píxeles */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  xxxxl: 32,
};

/* Radios de borde (border-radius) en píxeles */
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  full: 9999,
};

/* Tamaños de fuente (font-size) en píxeles */
export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 28,
  hero: 32,
};

/* Pesos de fuente (font-weight) como strings CSS */
export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
  black: "900",
};

/* Sombras predefinidas para diferentes profundidades (sm/md/lg/xl) */
/* Además una función glow() que genera sombra con color personalizado */
export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: (color = "#A78BFA") => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  }),
};

/* Colores del sistema: paleta "unicornio" y fondos claro/oscuro */
export const colors = {
  unicorn: {
    purple: "#7C3AED",
    violet: "#8B5CF6",
    lavender: "#A78BFA",
    pink: "#EC4899",
    fuchsia: "#F472B6",
    cyan: "#06B6D4",
    teal: "#14B8A6",
    amber: "#F59E0B",
    gold: "#FBBF24",
  },
  light: {
    bg: "#FAF5FF",
    card: "#FFFFFF",
    text: "#2D1B69",
  },
  dark: {
    bg: "#0F0A1E",
    card: "#1A0A2E",
    text: "#F8FAFC",
  },
};
