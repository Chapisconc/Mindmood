import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, LogOut } from "lucide-react";
import { supabase } from "../services/supabase";
import { useTheme } from "../theme/ThemeContext";
import { useTranslation } from "../i18n/I18nContext";
import { useAuth } from "../hooks/useAuth";
import { contactService } from "../services/contactService";
import NoticeModal from "../components/NoticeModal";

export default function Profile() {
  const navigate = useNavigate();
  const { themeStyles } = useTheme();
  const { lang, t, toggleLang } = useTranslation();
  const { profile, signOut } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ visible: false, title: "", message: "", icon: "checkmark-circle", color: "#10B981" });
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactActive, setContactActive] = useState(true);
  const [savingContact, setSavingContact] = useState(false);
  const isAdmin = profile?.role === "admin";

  useEffect(() => { fetchProfile(); }, []);

  useEffect(() => {
    if (profile) {
      setContactEmail(profile.contact_email || "");
      setContactPhone(profile.contact_phone || "");
      setContactName(profile.contact_name || "");
      setContactActive(profile.contact_is_active !== false);
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (data) {
          setDisplayName(data.display_name || user.email.split("@")[0]);
          setContactEmail(data.contact_email || "");
          setContactPhone(data.contact_phone || "");
          setContactName(data.contact_name || "");
          setContactActive(data.contact_is_active !== false);
        }
      }
    } catch (error) { if (import.meta.env.DEV) console.error(error); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.rpc("update_own_profile", { display_name: displayName.trim(), theme: null, lang: null });
      if (error && error.message && error.message.includes("function")) {
        const { error: upsertError } = await supabase.from("profiles").upsert({ id: user.id, display_name: displayName.trim() }, { onConflict: "id" });
        if (upsertError) throw upsertError;
      } else if (error) throw error;
      setNotice({ visible: true, title: t("success"), message: t("profileUpdated"), icon: "checkmark-circle", color: "#10B981" });
    } catch (error) {
      setNotice({ visible: true, title: "Error", message: error.message, icon: "alert-circle", color: "#EF4444" });
    } finally { setSaving(false); }
  };

  const handleSaveContact = async () => {
    setSavingContact(true);
    try {
      const { error } = await contactService.updateMyContactInfo(contactEmail.trim(), contactPhone.trim(), contactName.trim(), contactActive);
      if (error) throw error;
      setNotice({ visible: true, title: "Contacto actualizado", message: "Tu información de contacto profesional ha sido guardada.", icon: "checkmark-circle", color: "#10B981" });
    } catch (error) {
      setNotice({ visible: true, title: "Error", message: error.message, icon: "alert-circle", color: "#EF4444" });
    } finally { setSavingContact(false); }
  };

  const handleLogout = async () => { try { await signOut(); navigate("/"); } catch (_) { navigate("/"); } };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="max-w-4xl mx-auto px-4 lg:px-12 py-6 lg:py-12 relative z-10 pb-24">
        <header className="flex items-center gap-4 mb-10">
          <button onClick={() => navigate("/home")} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors dark:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-black dark:text-white">{t("settings")}</h1>
        </header>

        <div className="space-y-6 max-w-2xl">
          {isAdmin && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800"
            >
              <p className="text-sm font-black uppercase tracking-[1px] mb-6" style={{ color: "#EC4899" }}>🔐 Perfil de Administrador</p>
              <div className="inline-block px-4 py-2 rounded-xl mb-6" style={{ backgroundColor: "#EC489920" }}>
                <span className="text-xs font-black uppercase tracking-[0.5px]" style={{ color: "#EC4899" }}>Admin</span>
              </div>

              <div className="space-y-5">
                {[
                  { label: "Nombre profesional", val: contactName, set: setContactName, placeholder: "Dr. Juan Pérez" },
                  { label: "Correo de contacto", val: contactEmail, set: setContactEmail, placeholder: "contacto@psicologia.com", type: "email" },
                  { label: "Teléfono de contacto", val: contactPhone, set: setContactPhone, placeholder: "+52 55 1234 5678", type: "tel" },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="text-xs font-extrabold mb-2 ml-1 block uppercase tracking-[1px] text-slate-500">{f.label}</label>
                    <input className="w-full p-4 rounded-2xl text-base border outline-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} type={f.type || "text"} />
                  </div>
                ))}

                <div className="flex items-center justify-between py-3">
                  <span className="text-base font-semibold dark:text-white">Activo para recibir solicitudes</span>
                  <button onClick={() => setContactActive(!contactActive)} className="w-12 h-6 rounded-full relative cursor-pointer border-none" style={{ backgroundColor: contactActive ? "#F472B6" : "#CBD5E1" }}>
                    <div className="w-5 h-5 rounded-full absolute top-[2px] transition-transform" style={{ left: contactActive ? "26px" : "2px", backgroundColor: contactActive ? "#EC4899" : "#F4F3F4" }} />
                  </button>
                </div>

                <button onClick={handleSaveContact} disabled={savingContact}
                  className="w-full py-5 rounded-[22px] text-white text-lg font-black cursor-pointer border-none mt-4"
                  style={{ backgroundColor: "#EC4899" }}
                >
                  {savingContact ? "..." : "Guardar Contacto"}
                </button>
              </div>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800"
          >
            <label className="text-xs font-extrabold mb-3 ml-1 block uppercase tracking-[1px] text-slate-500">{t("displayName")}</label>
            <input className="w-full p-4 rounded-2xl text-base border outline-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 dark:text-white"
              value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={lang === "es" ? "Tu nombre" : "Your name"} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800"
          >
            <label className="text-xs font-extrabold mb-3 ml-1 block uppercase tracking-[1px] text-slate-500">{t("languageSection")}</label>
            <div className="flex gap-3">
              <button onClick={() => lang !== "es" && toggleLang()}
                className="flex-1 p-3 rounded-2xl border text-sm font-bold cursor-pointer"
                style={{ backgroundColor: lang === "es" ? "#6366F1" : "transparent", borderColor: "#E2E8F0", color: lang === "es" ? "#FFF" : "#64748B" }}>
                🇲🇽 Español
              </button>
              <button onClick={() => lang !== "en" && toggleLang()}
                className="flex-1 p-3 rounded-2xl border text-sm font-bold cursor-pointer"
                style={{ backgroundColor: lang === "en" ? "#6366F1" : "transparent", borderColor: "#E2E8F0", color: lang === "en" ? "#FFF" : "#64748B" }}>
                🇺🇸 English
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800"
          >
            <label className="text-xs font-extrabold mb-3 ml-1 block uppercase tracking-[1px] text-slate-500">{t("dailyReminder")}</label>
            <p className="text-sm text-slate-500">Los recordatorios diarios estarán disponibles en la versión PWA.</p>
          </motion.div>

          <button onClick={handleSave} disabled={saving}
            className="w-full py-5 rounded-[22px] text-white text-lg font-black cursor-pointer border-none"
            style={{ backgroundColor: "#6366F1" }}
          >
            {saving ? "..." : t("save")}
          </button>

          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-5 mt-2 bg-transparent border-none cursor-pointer">
            <LogOut size={20} color="#EF4444" />
            <span className="text-[17px] font-bold" style={{ color: "#EF4444" }}>{t("logout")}</span>
          </button>
        </div>
      </div>

      <NoticeModal visible={notice.visible} onClose={() => setNotice({ ...notice, visible: false })} title={notice.title} message={notice.message} icon={notice.icon} color={notice.color} />
    </div>
  );
}
