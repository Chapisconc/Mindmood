/* ------------------------------------------------------------------ */
/* Profile.jsx — Página de Perfil de Usuario                          */
/* Ruta: /profile                                                     */
/* Propósito: Visualizar y editar el perfil (avatar, nombre, email).  */
/* Requiere autenticación.                                            */
/* ------------------------------------------------------------------ */

// React hooks para estado y efectos secundarios
import { useState, useEffect } from "react";
// Framer Motion para animaciones de entrada y micro-interacciones
import { motion } from "framer-motion";
// Iconos desde librería Lucide
import { LogOut, User, Mail } from "lucide-react";
// Cliente de Supabase para operaciones en BD
import { supabase } from "../services/supabase";
// Contexto de tema (modo claro/oscuro)
import { useTheme } from "../theme/ThemeContext";
// Hook personalizado de autenticación (user, profile, signOut, updateProfile)
import { useAuth } from "../hooks/useAuth";
// Modal de notificación tipo toast para feedback visual
import NoticeModal from "../components/NoticeModal";

/* Lista de avatares disponibles: nombre clave + gradiente de fondo */
const AVATARS = [
  { icon: "user", bg: "from-indigo-500 to-fuchsia-500" },
  { icon: "smile", bg: "from-emerald-500 to-teal-500" },
  { icon: "sparkles", bg: "from-amber-400 to-orange-500" },
  { icon: "heart", bg: "from-rose-400 to-pink-500" },
  { icon: "star", bg: "from-yellow-400 to-amber-500" },
  { icon: "flame", bg: "from-red-500 to-rose-500" },
  { icon: "zap", bg: "from-violet-500 to-purple-500" },
  { icon: "moon", bg: "from-sky-500 to-indigo-500" },
  { icon: "sun", bg: "from-amber-300 to-yellow-500" },
  { icon: "ghost", bg: "from-slate-400 to-slate-600" },
];

/* Mapa de avatar -> emoji visual para mostrar en la UI */
const AVATAR_EMOJI = {
  user: "👤", smile: "😊", sparkles: "✨", heart: "❤️",
  star: "⭐", flame: "🔥", zap: "⚡", moon: "🌙",
  sun: "☀️", ghost: "👻",
};

/* Componente principal del perfil de usuario */
export default function Profile() {
  /* Tema actual (light/dark) con estilos correspondientes */
  const { themeStyles } = useTheme();
  /* Hook de autenticación: datos del usuario, perfil, cierre de sesión y actualización */
  const { user, profile, signOut, updateProfile } = useAuth();
  /* Estado local del nombre visible en el formulario */
  const [displayName, setDisplayName] = useState("");
  /* Avatar seleccionado actualmente (clave del mapa AVATARS) */
  const [selectedAvatar, setSelectedAvatar] = useState("user");
  /* Indicador de guardado en curso para deshabilitar el botón */
  const [saving, setSaving] = useState(false);
  /* Estado del modal de notificación: visible, título, mensaje, icono y color */
  const [notice, setNotice] = useState({ visible: false, title: "", message: "", icon: "checkmark-circle", color: "#10B981" });

  /* Al cargar el perfil, sincroniza nombre y avatar guardado en localStorage */
  useEffect(() => {
    if (profile) setDisplayName(profile.display_name || "");
    const saved = localStorage.getItem("mindmood_avatar");
    if (saved) setSelectedAvatar(saved);
  }, [profile]);

  /* Guarda el avatar en localStorage y persiste el nombre en Supabase */
  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem("mindmood_avatar", selectedAvatar);
      const { error } = await updateProfile({ display_name: displayName.trim() });
      if (error) throw error;
      setNotice({ visible: true, title: "Éxito", message: "Tu perfil ha sido actualizado correctamente.", icon: "checkmark-circle", color: "#10B981" });
    } catch (error) {
      /* Muestra error en el modal si falla la actualización */
      setNotice({ visible: true, title: "Error", message: error.message, icon: "alert-circle", color: "#EF4444" });
    } finally { setSaving(false); }
  };

  /* Cierra sesión y redirige al login */
  const handleLogout = async () => { try { await signOut(); window.location.href = "/"; } catch (_) { window.location.href = "/"; } };

  return (
    {/*
      Fondo principal con decoraciones de blur efecto glass.
      Capa fija de orbes difuminados que no interfieren con clicks.
    */}
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Orbe decorativo superior derecho */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full" />
        {/* Orbe decorativo inferior izquierdo */}
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-fuchsia-500/5 blur-[100px] rounded-full" />
      </div>

      {/*
        Contenedor principal centrado.
        pb-24 reserva espacio para la barra de navegación inferior.
      */}
      <div className="max-w-2xl mx-auto px-4 lg:px-8 py-6 lg:py-12 relative z-10 pb-24">
        {/* Encabezado: avatar renderizado y email del usuario */}
        <div className="mb-10 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/20 text-3xl">
            {AVATAR_EMOJI[selectedAvatar] || "👤"}
          </div>
            <h1 className="text-3xl font-black tracking-tight dark:text-white">Perfil</h1>
          <p className="text-slate-400 dark:text-slate-500 font-medium mt-1">{user?.email}</p>
        </div>

        <div className="space-y-5">
          {/* Selector de avatar: grilla 6 columnas con efecto hover */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3 block">Avatar</label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((a) => (
                /* Cada avatar es un botón; el seleccionado escala y agrega borde */
                <button key={a.icon} onClick={() => setSelectedAvatar(a.icon)}
                  className={`w-full aspect-square rounded-xl flex items-center justify-center text-lg transition-all border-2 cursor-pointer ${
                    selectedAvatar === a.icon
                      ? "border-indigo-500 scale-110 shadow-lg"
                      : "border-transparent hover:scale-105 opacity-60 hover:opacity-100"
                  }`}
                  style={{ background: selectedAvatar === a.icon ? `linear-gradient(135deg, ${a.bg.replace('from-', '').replace('to-', '').trim()})` : undefined }}>
                  <span className={`bg-gradient-to-br ${a.bg} w-full h-full rounded-xl flex items-center justify-center`}>
                    {AVATAR_EMOJI[a.icon]}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Campo de nombre editable */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 block">Nombre</label>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl px-4 border border-slate-200 dark:border-slate-700">
              <User className="w-5 h-5 text-slate-400 shrink-0" />
              <input className="w-full py-3 bg-transparent outline-none text-sm font-medium dark:text-white placeholder:text-slate-400"
                value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Tu nombre" />
            </div>
          </motion.div>

          {/* Email de solo lectura (deshabilitado, no editable) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 block">Correo</label>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl px-4 border border-slate-200 dark:border-slate-700">
              <Mail className="w-5 h-5 text-slate-400 shrink-0" />
              <input className="w-full py-3 bg-transparent outline-none text-sm font-medium dark:text-white" value={user?.email || ""} disabled />
            </div>
          </motion.div>

          {/* Botón de guardar cambios */}
          <motion.button whileTap={{ scale: 0.98 }}
            onClick={handleSave} disabled={saving}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-xl transition-all disabled:opacity-50 border-none cursor-pointer">
            {saving ? "Guardando..." : "Guardar cambios"}
          </motion.button>

          {/* Botón de cerrar sesión */}
          <motion.button whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full py-3.5 rounded-xl border border-rose-200 dark:border-rose-900/30 bg-transparent text-rose-500 font-bold text-sm cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all">
            <LogOut className="w-4 h-4 inline mr-2" />Cerrar sesión
          </motion.button>
        </div>
      </div>

      {/* Modal de notificación: éxito o error según resultado */}
      <NoticeModal visible={notice.visible} onClose={() => setNotice({ ...notice, visible: false })} title={notice.title} message={notice.message} icon={notice.icon} color={notice.color} />
    </div>
  );
}
