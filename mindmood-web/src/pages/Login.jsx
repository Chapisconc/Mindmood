/* ======================================================
   FILE: Login.jsx  —  Página de Inicio de Sesión
   Ruta:  /login (default "/")
   Auth:  Solo usuarios NO autenticados
   Propósito: Autenticación con Supabase (email/contraseña),
              redirección según rol (admin vs normal).
   ====================================================== */

// React hooks: estado, referencias, efectos secundarios
import { useState, useRef, useEffect } from "react";
// Navegación programática entre rutas
import { useNavigate } from "react-router-dom";
// Animaciones de entrada/salida con Framer Motion
import { motion } from "framer-motion";
// Cliente Supabase para autenticación y base de datos
import { supabase } from "../services/supabase";
// Hook personalizado del tema (claro/oscuro)
import { useTheme } from "../theme/ThemeContext";
// Iconos: correo, candado, ojo visible/oculto, corazón
import { Mail, Lock, Eye, EyeOff, Heart } from "lucide-react";
// Botón reutilizable con estado de carga
import AppButton from "../components/AppButton";
import BackgroundDecor from "../components/BackgroundDecor";

export default function Login() {
  // Hook de navegación — redirige tras login exitoso
  const navigate = useNavigate();
  // Tema actual (claro/oscuro) desde ThemeContext
  const { theme } = useTheme();

  /* ---------- Estados del formulario ---------- */
  const [email, setEmail] = useState("");            // Correo electrónico ingresado
  const [password, setPassword] = useState("");       // Contraseña ingresada
  const [loading, setLoading] = useState(false);       // Indicador de carga (spinner en botón)
  const [showPassword, setShowPassword] = useState(false); // Alternar visibilidad de contraseña
  const [error, setError] = useState("");              // Mensaje de error a mostrar al usuario

  /* Referencias para controlar el timeout de 15s (evitar memory leaks al desmontar) */
  const timeoutRef = useRef(null);     // Referencia al setTimeout de timeout de seguridad
  const loadingRef = useRef(false);    // Ref espejo de loading para acceder desde el closure del timeout

  /**
   * Efecto de limpieza: cancela el timeout pendiente si el componente se desmonta
   * para evitar setState en componente desmontado.
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  /**
   * Gradiente de fondo según el tema actual (oscuro o claro).
   * Se aplica inline con el atributo style.
   */
  const gradientColors =
    theme === "dark"
      ? "linear-gradient(180deg, #0F0A1E, #2E1065, #0F0A1E)"
      : "linear-gradient(180deg, #FAF5FF, #F3E8FF, #FAF5FF)";

  /**
   * signInWithEmail:  Autentica al usuario con Supabase Auth.
   * - Endpoint: supabase.auth.signInWithPassword({ email, password })
   * - Respuesta esperada: { data: { user }, error }
   * - Tras login exitoso: actualiza el theme en la BD y redirige según rol (admin / normal).
   * - Manejo de errores: muestra el mensaje de Supabase o un fallback genérico.
   * - Timeout de seguridad: 15 segundos, evita que el loading quede infinito.
   */
  async function signInWithEmail() {
    // Validación: ambos campos obligatorios
    if (!email || !password) { setError("Por favor llena todos los campos"); return; }
    setError(""); setLoading(true); loadingRef.current = true;

    // Timeout de seguridad: si la petición demora > 15s, aborta y muestra error
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (loadingRef.current) { setLoading(false); loadingRef.current = false; setError("Tiempo de espera agotado. Intenta de nuevo."); }
    }, 15000);

    try {
      // Llamada a Supabase Auth con email y password
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) { setError(signInError.message); return; }            // Error devuelto por Supabase
      if (!user) { setError("Usuario no encontrado"); return; }              // Usuario nulo (caso borde)

      // Actualiza el tema del usuario en la tabla profiles (fire-and-forget)
      supabase.from("profiles").update({ theme }).eq("id", user.id).then().catch(() => {});

      // Verifica si el usuario es administrador mediante RPC
      const { data: isAdmin } = await supabase.rpc("is_admin");
      // Redirección según rol
      if (isAdmin) navigate("/admin-dashboard");
      else navigate("/home");
    } catch (err) { setError(err?.message || "Error al iniciar sesión"); }   // Error de red / excepción inesperada
    finally { loadingRef.current = false; if (timeoutRef.current) clearTimeout(timeoutRef.current); setLoading(false); }
  }

  return (
    /* Fondo principal con gradiente según tema */
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: gradientColors }}>

      <BackgroundDecor />

      {/* Contenedor principal del formulario, centrado vertical y horizontal */}
      <div className="flex-1 flex flex-col justify-center px-7 py-10 max-w-md mx-auto w-full relative z-10">

        {/* Encabezado: logo, nombre de la app y eslogan con animación de entrada */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800">
              <Heart size={40} color="#EC4899" />
            </div>
          </div>
          <h1 className="text-4xl font-black mb-2 dark:text-white" style={{ color: theme === "dark" ? "#FFF" : "#1E293B" }}>MindMood</h1>
          <p className="text-base font-semibold dark:text-slate-300" style={{ color: theme === "dark" ? "#CBD5E1" : "#64748B" }}>Tu espacio seguro</p>
        </motion.div>

        {/* Formulario: campos de email, password, botón de login y enlace a registro */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-5">

          {/* Campo de correo electrónico con icono de mail a la izquierda */}
          <div className="relative">
            <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo electrónico"
              className="w-full h-14 pl-12 pr-4 rounded-2xl text-base font-medium outline-none bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800 dark:text-white placeholder:text-slate-400" />
          </div>

          {/* Campo de contraseña con icono de candado y botón toggle visibilidad */}
          <div className="relative">
            <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña"
              className="w-full h-14 pl-12 pr-14 rounded-2xl text-base font-medium outline-none bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800 dark:text-white placeholder:text-slate-400" />
            {/* Botón para mostrar/ocultar contraseña (icono Eye/EyeOff) */}
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1">
              {showPassword ? <EyeOff size={20} className="text-slate-400" /> : <Eye size={20} className="text-slate-400" />}
            </button>
          </div>

          {/* Mensaje de error animado (solo visible si hay error) */}
          {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm font-bold text-red-500">{error}</motion.p>}

          {/* Botón principal de inicio de sesión con estado de carga */}
          <AppButton title={loading ? "Ingresando..." : "Iniciar Sesión"} onClick={signInWithEmail} loading={loading} />

          {/* Enlace a la página de registro */}
          <p className="text-center text-sm font-semibold dark:text-slate-300" style={{ color: theme === "dark" ? "#CBD5E1" : "#64748B" }}>
            ¿No tienes cuenta?{" "}
            <span className="cursor-pointer font-bold" style={{ color: "#EC4899" }} onClick={() => navigate("/register")}>Regístrate</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
