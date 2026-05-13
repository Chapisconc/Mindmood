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

  useEffect(() => {
    fetchProfile();
  }, []);

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
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.rpc("update_own_profile", {
        display_name: displayName.trim(),
        theme: null,
        lang: null,
      });
      if (error && error.message && error.message.includes("function")) {
        const { error: upsertError } = await supabase.from("profiles").upsert(
          { id: user.id, display_name: displayName.trim() },
          { onConflict: "id" }
        );
        if (upsertError) throw upsertError;
      } else if (error) {
        throw error;
      }
      setNotice({ visible: true, title: t("success"), message: t("profileUpdated"), icon: "checkmark-circle", color: "#10B981" });
    } catch (error) {
      setNotice({ visible: true, title: "Error", message: error.message, icon: "alert-circle", color: "#EF4444" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContact = async () => {
    setSavingContact(true);
    try {
      const { error } = await contactService.updateMyContactInfo(
        contactEmail.trim(),
        contactPhone.trim(),
        contactName.trim(),
        contactActive
      );
      if (error) throw error;
      setNotice({ visible: true, title: "Contacto actualizado", message: "Tu información de contacto profesional ha sido guardada.", icon: "checkmark-circle", color: "#10B981" });
    } catch (error) {
      setNotice({ visible: true, title: "Error", message: error.message, icon: "alert-circle", color: "#EF4444" });
    } finally {
      setSavingContact(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (_) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: themeStyles.background }}>
      <div className="max-w-lg mx-auto pb-16 px-5">
        <button
          onClick={() => navigate("/home")}
          className="bg-transparent border-none cursor-pointer pt-8 pb-2 flex items-center gap-2"
        >
          <ArrowLeft size={24} color={themeStyles.secondaryText} />
          <span className="text-sm font-bold" style={{ color: themeStyles.secondaryText }}>Volver</span>
        </button>

        <p className="text-[34px] font-black mb-8 mt-2" style={{ color: themeStyles.text }}>{t("settings")}</p>

        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-[26px] mb-5 border"
            style={{ backgroundColor: themeStyles.card, borderColor: "#EC489940" }}
          >
            <p className="text-sm font-black uppercase tracking-[1px] mb-4" style={{ color: "#EC4899" }}>
              🔐 Perfil de Administrador
            </p>
            <div className="inline-block px-3 py-1.5 rounded-xl border mb-4"
              style={{ backgroundColor: "#EC489920", borderColor: "#EC489940" }}
            >
              <span className="text-xs font-black uppercase tracking-[0.5px]" style={{ color: "#EC4899" }}>Admin</span>
            </div>

            <div className="mb-4">
              <label className="text-xs font-extrabold mb-2 ml-1 block uppercase tracking-[1px]" style={{ color: themeStyles.secondaryText }}>
                Nombre profesional
              </label>
              <input
                className="w-full p-4 rounded-2xl text-base border outline-none"
                style={{ backgroundColor: themeStyles.softAccent, color: themeStyles.text, borderColor: themeStyles.border }}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Dr. Juan Pérez"
              />
            </div>

            <div className="mb-4">
              <label className="text-xs font-extrabold mb-2 ml-1 block uppercase tracking-[1px]" style={{ color: themeStyles.secondaryText }}>
                Correo de contacto
              </label>
              <input
                className="w-full p-4 rounded-2xl text-base border outline-none"
                style={{ backgroundColor: themeStyles.softAccent, color: themeStyles.text, borderColor: themeStyles.border }}
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contacto@psicologia.com"
                type="email"
              />
            </div>

            <div className="mb-4">
              <label className="text-xs font-extrabold mb-2 ml-1 block uppercase tracking-[1px]" style={{ color: themeStyles.secondaryText }}>
                Teléfono de contacto
              </label>
              <input
                className="w-full p-4 rounded-2xl text-base border outline-none"
                style={{ backgroundColor: themeStyles.softAccent, color: themeStyles.text, borderColor: themeStyles.border }}
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+52 55 1234 5678"
                type="tel"
              />
            </div>

            <div className="flex items-center justify-between my-3">
              <span className="text-lg font-semibold" style={{ color: themeStyles.text }}>Activo para recibir solicitudes</span>
              <button
                onClick={() => setContactActive(!contactActive)}
                className="w-12 h-6 rounded-full relative cursor-pointer border-none"
                style={{ backgroundColor: contactActive ? "#F472B6" : themeStyles.border }}
              >
                <div
                  className="w-5 h-5 rounded-full absolute top-[2px] transition-transform"
                  style={{
                    left: contactActive ? "26px" : "2px",
                    backgroundColor: contactActive ? "#EC4899" : "#F4F3F4",
                  }}
                />
              </button>
            </div>

            <button
              onClick={handleSaveContact}
              disabled={savingContact}
              className="w-full py-[22px] rounded-[22px] text-white text-lg font-black cursor-pointer border-none mt-3"
              style={{ backgroundColor: "#EC4899", boxShadow: "0 6px 14px #EC4899" }}
            >
              {savingContact ? "..." : "Guardar Contacto"}
            </button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-[26px] mb-5 border"
          style={{ backgroundColor: themeStyles.card, borderColor: themeStyles.border }}
        >
          <label className="text-xs font-extrabold mb-3 ml-1 block uppercase tracking-[1px]" style={{ color: themeStyles.secondaryText }}>
            {t("displayName")}
          </label>
          <input
            className="w-full p-[18px] rounded-xl text-base border outline-none"
            style={{ backgroundColor: themeStyles.softAccent, color: themeStyles.text, borderColor: themeStyles.border }}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={lang === "es" ? "Tu nombre" : "Your name"}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-[26px] mb-5 border"
          style={{ backgroundColor: themeStyles.card, borderColor: themeStyles.border }}
        >
          <label className="text-xs font-extrabold mb-3 ml-1 block uppercase tracking-[1px]" style={{ color: themeStyles.secondaryText }}>
            {t("languageSection")}
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => lang !== "es" && toggleLang()}
              className="flex-1 p-3 rounded-2xl border text-sm font-bold cursor-pointer"
              style={{
                backgroundColor: lang === "es" ? themeStyles.accent : "transparent",
                borderColor: themeStyles.border,
                color: lang === "es" ? "#FFF" : themeStyles.secondaryText,
              }}
            >
              🇲🇽 Español
            </button>
            <button
              onClick={() => lang !== "en" && toggleLang()}
              className="flex-1 p-3 rounded-2xl border text-sm font-bold cursor-pointer"
              style={{
                backgroundColor: lang === "en" ? themeStyles.accent : "transparent",
                borderColor: themeStyles.border,
                color: lang === "en" ? "#FFF" : themeStyles.secondaryText,
              }}
            >
              🇺🇸 English
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 rounded-[26px] mb-5 border"
          style={{ backgroundColor: themeStyles.card, borderColor: themeStyles.border }}
        >
          <label className="text-xs font-extrabold mb-3 ml-1 block uppercase tracking-[1px]" style={{ color: themeStyles.secondaryText }}>
            {t("dailyReminder")}
          </label>
          <p className="text-sm mb-2" style={{ color: themeStyles.secondaryText }}>
            Los recordatorios diarios estarán disponibles en la versión PWA.
          </p>
        </motion.div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-[22px] rounded-[22px] text-white text-lg font-black cursor-pointer border-none mt-2"
          style={{
            backgroundColor: themeStyles.accent,
            boxShadow: `0 6px 14px ${themeStyles.accent}`,
          }}
        >
          {saving ? "..." : t("save")}
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-5 mt-6 mb-16 bg-transparent border-none cursor-pointer"
        >
          <LogOut size={20} color={themeStyles.error} />
          <span className="text-[17px] font-bold" style={{ color: themeStyles.error }}>
            {t("logout")}
          </span>
        </button>
      </div>

      <NoticeModal
        visible={notice.visible}
        onClose={() => setNotice({ ...notice, visible: false })}
        title={notice.title}
        message={notice.message}
        icon={notice.icon}
        color={notice.color}
      />
    </div>
  );
}
