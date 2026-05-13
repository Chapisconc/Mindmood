import { es, en } from "./translations";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect, createContext, useContext } from "react";

const I18nContext = createContext();

export const I18nProvider = ({ children }) => {
  const { profile, updateProfile } = useAuth();
  const [lang, setLang] = useState("es");

  useEffect(() => {
    if (profile?.lang) {
      setLang(profile.lang);
    }
  }, [profile?.lang]);

  const translations = lang === "es" ? es : en;

  const toggleLang = async () => {
    const newLang = lang === "es" ? "en" : "es";
    setLang(newLang);
    await updateProfile({ lang: newLang });
  };

  const t = (key) => translations[key] || key;

  return (
    <I18nContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);