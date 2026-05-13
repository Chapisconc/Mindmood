import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { themes } from "./themes";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { profile, updateProfile } = useAuth();
  
  const getSystemTheme = () => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "dark";
  };

  const [theme, setTheme] = useState(getSystemTheme);

  useEffect(() => {
    if (profile?.theme) {
      setTheme(profile.theme);
    }
  }, [profile?.theme]);

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

  useEffect(() => {
    document.documentElement.setAttribute("data-theme-set", "true");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const syncTheme = () => {
    if (profile?.theme) {
      setTheme(profile.theme);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    await updateProfile({ theme: newTheme });
  };

  const themeStyles = themes[theme];

  return (
    <ThemeContext.Provider value={{ theme, themeStyles, toggleTheme, syncTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);