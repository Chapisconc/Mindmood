import React, { createContext, useState, useContext, useEffect } from "react";
import { themes } from "./themes";
import { supabase } from "../services/supabase";
import { subscribeToSession } from "../hooks/useAuth";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
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
    const unsubscribe = subscribeToSession(async (session) => {
      if (session?.user) {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("theme")
            .eq("id", session.user.id)
            .single();

          if (data?.theme) {
            setTheme(data.theme);
          }
        } catch (e) {
          if (import.meta.env.DEV) console.log("Theme load fail:", e);
        }
      }
    });

    return unsubscribe;
  }, []);

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

  const syncTheme = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session) return;
      const { data } = await supabase
        .from("profiles")
        .select("theme")
        .eq("id", session.user.id)
        .single();
      if (data?.theme) {
        setTheme(data.theme);
      }
    } catch (e) {
      if (import.meta.env.DEV) console.log("Theme sync fail:", e);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (session) {
        await supabase
          .from("profiles")
          .update({ theme: newTheme })
          .eq("id", session.user.id);
      }
    } catch (e) {
      if (import.meta.env.DEV) console.log("Theme save fail:", e);
    }
  };

  const themeStyles = themes[theme];

  return (
    <ThemeContext.Provider value={{ theme, themeStyles, toggleTheme, syncTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
