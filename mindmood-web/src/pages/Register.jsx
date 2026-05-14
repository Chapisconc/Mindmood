/* ======================================================
   FILE: Register.jsx  —  Página de Registro
   Ruta:  /register
   Auth:  Solo usuarios NO autenticados
   Propósito: Crear cuenta nueva vía Supabase Auth
              (signUp con email/contraseña).
   ====================================================== */

// React hook para estado local
import { useState } from "react";
// Navegación programática entre rutas
import { useNavigate } from "react-router-dom";
// Animaciones de entrada/salida con Framer Motion
import { motion } from "framer-motion";
// Cliente Supabase para autenticación
import { supabase } from "../services/supabase";
// Hook personalizado del tema (claro/oscuro)
import { useTheme } from "../theme/ThemeContext";
// Iconos: correo, candado, ojo, sol, luna
import { Mail, Lock, Eye, EyeOff, Sun, Moon } from "lucide-react";
// Componente Icono SVG personalizado
import Icon from "../components/Icon";
// Botón reutilizable con estado de carga
import AppButton from "../components/AppButton";

export default function Register() {
  // Hook de navegación — redirige al login tras registro exitoso
  const navigate = useNavigate();
  // Tema actual, estilos del tema y función para alternar (toggle) desde ThemeContext
  const { theme, themeStyles, toggleTheme } = useTheme();

  /* ---------- Estados del formulario ---------- */
  const [email, setEmail] = useState("");              // Correo electrónico ingresado por el usuario
  const [password, setPassword] = useState("");         // Contraseña ingresada (mín. 6 caracteres)
  const [loading, setLoading] = useState(false);         // Indicador de carga durante signUp
  const [showPassword, setShowPassword] = useState(false); // Alternar visibilidad de la contraseña
  const [error, setError] = useState("");                // Mensaje de error (ej. email duplicado)
  const [success, setSuccess] = useState("");            // Mensaje de éxito tras registro completado

  /**
   * signUpWithEmail:  Registra un nuevo usuario en Supabase Auth.
   * - Endpoint: supabase.auth.signUp({ email, password })
   * - Validaciones: campos vacíos y longitud mínima de contraseña (6 caracteres).
   * - Respuesta esperada: { data: { user }, error }
   * - En éxito: muestra mensaje "Cuenta Creada" y permite ir al login.
   * - En error: muestra el mensaje devuelto por Supabase (ej. email ya registrado).
   */
  async function signUpWithEmail() {
    // Validación de campos obligatorios
    if (!email || !password) { setError("Por favor llena todos los campos."); return; }
    // Validación de seguridad: longitud mínima de contraseña
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    setError(""); setSuccess(""); setLoading(true);

    // Llamada a Supabase Auth — crea el usuario con email y contraseña
    const { error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password });

    if (signUpError) setError(signUpError.message);       // Error de Supabase (email existente, etc.)
    else setSuccess("¡Cuenta Creada! Se ha creado tu perfil de MindMood con éxito."); // Éxito

    setLoading(false);
  }

  return (
    /* Fondo principal claro/oscuro con desbordamiento oculto */
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 relative overflow-hidden flex flex-col">

      {/* Capa decorativa: círculos borrosos de fondo, no interactivos */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Contenedor centrado del formulario */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 max-w-md mx-auto w-full relative z-10">

        {/* Encabezado: título y botón de cambio de tema */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative flex flex-col items-center mb-9">
          {/* Botón toggle de tema (sol/luna) posicionado en la esquina superior derecha */}
          <button onClick={toggleTheme} className="absolute right-0 top-0 p-3 rounded-xl border bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-slate-200 dark:border-slate-700 cursor-pointer">
            {theme === "dark" ? <Sun size={28} className="dark:text-white" /> : <Moon size={28} className="text-slate-700" />}
          </button>
          <h1 className="text-[34px] font-black text-center mb-[10px] dark:text-white">Crear Cuenta</h1>
          <p className="text-[17px] text-center dark:text-slate-300">Comienza a cuidar tu salud mental hoy</p>
        </motion.div>

        {/* Card del formulario con animación de aparición retrasada */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <div className="p-[26px] rounded-[28px] border bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/20 dark:border-slate-800">

            {/* Mensaje de error (rojo) o de éxito (verde) condicionales */}
            {error && <div className="mb-4 p-3 rounded-2xl text-sm font-bold text-center bg-red-100 dark:bg-red-900/30 text-red-600">{error}</div>}
            {success && <div className="mb-4 p-3 rounded-2xl text-sm font-bold text-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">{success}</div>}

            {/* Campo de correo electrónico con icono SVG */}
            <label className="text-[14px] font-extrabold mb-[10px] ml-[6px] block dark:text-white">Correo Electrónico</label>
            <div className="flex items-center rounded-[18px] mb-[22px] border-[1.5px] px-[18px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <Icon name="mail" size={22} color={theme === "dark" ? "#94A3B8" : "#64748B"} />
              <input className="flex-1 p-4 text-base bg-transparent outline-none dark:text-white" placeholder="tu@correo.com"
                onChange={(e) => setEmail(e.target.value)} value={email} autoCapitalize="none" type="email" />
            </div>

            {/* Campo de contraseña con icono SVG y botón toggle visibilidad */}
            <label className="text-[14px] font-extrabold mb-[10px] ml-[6px] block dark:text-white">Contraseña</label>
            <div className="flex items-center rounded-[18px] mb-[22px] border-[1.5px] px-[18px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <Icon name="lock" size={22} color={theme === "dark" ? "#94A3B8" : "#64748B"} />
              <input className="flex-1 p-4 text-base bg-transparent outline-none dark:text-white" placeholder="Mínimo 6 caracteres"
                onChange={(e) => setPassword(e.target.value)} value={password} type={showPassword ? "text" : "password"} />
              <button onClick={() => setShowPassword(!showPassword)} className="bg-transparent border-none p-0 cursor-pointer">
                {showPassword ? <EyeOff size={24} className="text-slate-400" /> : <Eye size={24} className="text-slate-400" />}
              </button>
            </div>

            {/* Botón condicional: si hay éxito, muestra "Ir al Login"; si no, "Confirmar Registro" */}
            {success ? (
              <AppButton title="Ir al Login" onClick={() => navigate("/")} loading={false} />
            ) : (
              <div className="mt-[14px]"><AppButton title="Confirmar Registro" onClick={signUpWithEmail} loading={loading} /></div>
            )}
          </div>

          {/* Enlace para volver al login */}
          <button onClick={() => navigate("/")} className="w-full text-center mt-8 bg-transparent border-none cursor-pointer">
            <span className="dark:text-slate-300 font-semibold text-[15px]">Volver al Inicio de Sesión</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
