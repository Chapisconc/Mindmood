import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../services/supabase";
import { useTheme } from "../theme/ThemeContext";
import { Mail, Lock, Eye, EyeOff, Heart } from "lucide-react";
import AppButton from "../components/AppButton";

export default function Login() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const timeoutRef = useRef(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const gradientColors =
    theme === "dark"
      ? "linear-gradient(180deg, #0F0A1E, #2E1065, #0F0A1E)"
      : "linear-gradient(180deg, #FAF5FF, #F3E8FF, #FAF5FF)";

  async function signInWithEmail() {
    if (!email || !password) { setError("Por favor llena todos los campos"); return; }
    setError(""); setLoading(true); loadingRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (loadingRef.current) { setLoading(false); loadingRef.current = false; setError("Tiempo de espera agotado. Intenta de nuevo."); }
    }, 15000);
    try {
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) { setError(signInError.message); return; }
      if (!user) { setError("Usuario no encontrado"); return; }
      supabase.from("profiles").update({ theme }).eq("id", user.id).then().catch(() => {});
      let role = user.user_metadata?.role;
      try {
        const result = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (result?.data?.role) role = result.data.role;
      } catch (_) {}
      if (role === "admin") navigate("/admin-dashboard");
      else navigate("/home");
    } catch (err) { setError(err?.message || "Error al iniciar sesión"); }
    finally { loadingRef.current = false; if (timeoutRef.current) clearTimeout(timeoutRef.current); setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: gradientColors }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-500/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="flex-1 flex flex-col justify-center px-7 py-10 max-w-md mx-auto w-full relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800">
              <Heart size={40} color="#EC4899" />
            </div>
          </div>
          <h1 className="text-4xl font-black mb-2 dark:text-white" style={{ color: theme === "dark" ? "#FFF" : "#1E293B" }}>MindMood</h1>
          <p className="text-base font-semibold dark:text-slate-300" style={{ color: theme === "dark" ? "#CBD5E1" : "#64748B" }}>Tu espacio seguro</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-5">
          <div className="relative">
            <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo electrónico"
              className="w-full h-14 pl-12 pr-4 rounded-2xl text-base font-medium outline-none bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800 dark:text-white placeholder:text-slate-400" />
          </div>
          <div className="relative">
            <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña"
              className="w-full h-14 pl-12 pr-14 rounded-2xl text-base font-medium outline-none bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-slate-800 dark:text-white placeholder:text-slate-400" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1">
              {showPassword ? <EyeOff size={20} className="text-slate-400" /> : <Eye size={20} className="text-slate-400" />}
            </button>
          </div>
          {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm font-bold text-red-500">{error}</motion.p>}
          <AppButton title={loading ? "Ingresando..." : "Iniciar Sesión"} onClick={signInWithEmail} loading={loading} />
          <p className="text-center text-sm font-semibold dark:text-slate-300" style={{ color: theme === "dark" ? "#CBD5E1" : "#64748B" }}>
            ¿No tienes cuenta?{" "}
            <span className="cursor-pointer font-bold" style={{ color: "#EC4899" }} onClick={() => navigate("/register")}>Regístrate</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
