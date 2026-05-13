import { es, en } from "./translations";
import { supabase } from "../services/supabase";
import { subscribeToSession } from "../hooks/useAuth";
import { useState, useEffect, createContext, useContext } from "react";

const I18nContext = createContext();

export const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState("es");
  const translations = lang === "es" ? es : en;

  useEffect(() => {
    const unsubscribe = subscribeToSession(async (session) => {
      if (session?.user) {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("lang")
            .eq("id", session.user.id)
            .single();
          if (data?.lang) setLang(data.lang);
        } catch (e) {
          if (import.meta.env.DEV) console.log("Lang load fail:", e);
        }
      }
    });

    return unsubscribe;
  }, []);

  const toggleLang = async () => {
    const newLang = lang === "es" ? "en" : "es";
    setLang(newLang);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (session) {
        await supabase
          .from("profiles")
          .update({ lang: newLang })
          .eq("id", session.user.id);
      }
    } catch (e) {
      if (import.meta.env.DEV) console.log("Lang save fail:", e);
    }
  };

  const t = (key) => translations[key] || key;

  return (
    <I18nContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
