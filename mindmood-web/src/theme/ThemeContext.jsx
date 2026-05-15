/* ================================================================== */
/* ThemeContext.jsx — Proveedor de contexto de tema (claro/oscuro)    */
/* Gestiona el estado del tema, lo persiste en el perfil del usuario, */
/* y sincroniza con la preferencia del sistema (prefers-color-scheme).*/
/* Expone: theme, themeStyles, toggleTheme y syncTheme.               */
/* ================================================================== */

import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { themes } from "./themes";

/* Contexto de tema con valor inicial vacío */
const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
  /* Hook de autenticación para acceder al perfil y actualizarlo */
  const { profile, updateProfile } = useAuth();
  
  /* Detecta la preferencia del sistema (modo claro/oscuro del S.O.) */
  const getSystemTheme = () => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "dark";
  };

  /* Estado del tema actual: arranca con la preferencia del sistema */
  const [theme, setTheme] = useState(getSystemTheme);

  /* Sincroniza el tema con el perfil del usuario cuando se carga */
  useEffect(() => {
    if (profile?.theme) {
      setTheme(profile.theme);
    }
  }, [profile?.theme]);

  /* Escucha cambios en la preferencia del sistema (ej. al atardecer) */
  /* Solo aplica si el usuario no ha establecido un tema manualmente  */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      if (!document.documentElement.getAttribute("data-theme-set")) {
        setTheme(e.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* Aplica la clase .dark al <html> y marca que el tema fue definido */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme-set", "true");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  /* Re-sincroniza el tema desde el perfil (útil tras actualización) */
  const syncTheme = () => {
    if (profile?.theme) {
      setTheme(profile.theme);
    }
  };

  /* Alterna entre claro y oscuro y persiste la elección en la BD */
  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    await updateProfile({ theme: newTheme });
  };

  /* Estilos completos del tema activo */
  const themeStyles = themes[theme];

  return (
    <ThemeContext.Provider value={{ theme, themeStyles, toggleTheme, syncTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/* Hook personalizado para consumir el contexto del tema */
/* Incluye valores por defecto seguros si no hay proveedor */
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: "dark", themeStyles: themes.dark, toggleTheme: () => {}, syncTheme: () => {} };
  return ctx;
};