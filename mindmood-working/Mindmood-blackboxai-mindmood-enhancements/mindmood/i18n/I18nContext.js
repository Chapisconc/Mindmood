import { es, en } from './translations';
import { supabase } from '../services/supabase';
import { useState, useEffect, createContext, useContext } from 'react';

const I18nContext = createContext();

export const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState('es');
  const translations = lang === 'es' ? es : en;

  useEffect(() => {
    loadLang();
  }, []);

  const loadLang = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from('profiles')
        .select('lang')
        .eq('id', session.user.id)
        .single();
      if (data?.lang) setLang(data.lang);
    }
  };

  const toggleLang = async () => {
    const newLang = lang === 'es' ? 'en' : 'es';
    setLang(newLang);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('profiles').update({ lang: newLang }).eq('id', session.user.id);
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
