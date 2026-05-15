/* ================================================================== */
/* I18nContext.jsx — Proveedor de internacionalización (i18n)         */
/* Permite alternar entre español (es) e inglés (en) y persiste la    */
/* preferencia en el perfil del usuario en Supabase.                  */
/* Expone: lang (idioma activo), t() (función de traducción),         */
/* y toggleLang (cambia entre ES/EN).                                 */
/* ================================================================== */

import { es, en } from "./translations";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect, createContext, useContext } from "react";

/* Contexto de traducción */
const I18nContext = createContext();

export const I18nProvider = ({ children }) => {
  /* Hook de autenticación para acceder y actualizar el perfil */
  const { profile, updateProfile } = useAuth();
  /* Idioma activo: por defecto español */
  const [lang, setLang] = useState("es");

  /* Al cargar el perfil, aplica el idioma guardado por el usuario */
  useEffect(() => {
    if (profile?.lang) {
      setLang(profile.lang);
    }
  }, [profile?.lang]);

  /* Objeto de traducciones según el idioma activo */
  const translations = lang === "es" ? es : en;

  /* Alterna entre español e inglés y persiste en la BD */
  const toggleLang = async () => {
    const newLang = lang === "es" ? "en" : "es";
    setLang(newLang);
    await updateProfile({ lang: newLang });
  };

  /* Función de traducción: recibe una clave y devuelve el texto */
  /* Si la clave no existe, devuelve la misma clave como fallback */
  const t = (key) => translations[key] || key;

  return (
    <I18nContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
};

/* Hook personalizado para consumir el contexto de traducción */
export const useTranslation = () => useContext(I18nContext);