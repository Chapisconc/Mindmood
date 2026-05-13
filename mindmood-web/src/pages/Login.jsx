import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../services/supabase";
import { useTheme } from "../theme/ThemeContext";
import { Mail, Lock, Eye, EyeOff, Heart, Moon, Sun } from "lucide-react";
import AppButton from "../components/AppButton";

export default function Login() {
  const navigate = useNavigate();
  const { theme, themeStyles } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const timeoutRef = useRef(null);

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
    if (!email || !password) {
      setError("Por favor llena todos los campos");
      return;
    }
    setError("");
    setLoading(true);
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError("Tiempo de espera agotado. Intenta de nuevo.");
      }
    }, 10000);

    try {
      const {
        data: { user },
        error: signInError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (!user) {
        setError("Usuario no encontrado");
        setLoading(false);
        return;
      }

      try {
        await supabase.from("profiles").update({ theme: theme }).eq("id", user.id);
      } catch (_) {}

      try {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (profile?.role === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/home");
        }
      } catch (_) {
        navigate("/home");
      }
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: gradientColors }}
    >
      <div className="flex-1 flex flex-col justify-center px-7 py-10 max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: themeStyles.card }}>
              <Heart size={40} color="#EC4899" />
            </div>
          </div>
          <h1 className="text-4xl font-black mb-2" style={{ color: themeStyles.text }}>
            MindMood
          </h1>
          <p className="text-base font-semibold" style={{ color: themeStyles.secondaryText }}>
            Tu espacio seguro
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-5"
        >
          <div className="relative">
            <Mail
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: themeStyles.secondaryText }}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              className="w-full h-14 pl-12 pr-4 rounded-2xl border text-base font-medium outline-none"
              style={{
                backgroundColor: themeStyles.card,
                borderColor: themeStyles.border,
                color: themeStyles.text,
              }}
            />
          </div>

          <div className="relative">
            <Lock
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: themeStyles.secondaryText }}
            />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full h-14 pl-12 pr-14 rounded-2xl border text-base font-medium outline-none"
              style={{
                backgroundColor: themeStyles.card,
                borderColor: themeStyles.border,
                color: themeStyles.text,
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1"
            >
              {showPassword ? (
                <EyeOff size={20} style={{ color: themeStyles.secondaryText }} />
              ) : (
                <Eye size={20} style={{ color: themeStyles.secondaryText }} />
              )}
            </button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm font-bold"
              style={{ color: "#EF4444" }}
            >
              {error}
            </motion.p>
          )}

          <AppButton
            title={loading ? "Ingresando..." : "Iniciar Sesión"}
            onClick={signInWithEmail}
            loading={loading}
          />

          <p className="text-center text-sm font-semibold" style={{ color: themeStyles.secondaryText }}>
            ¿No tienes cuenta?{" "}
            <span
              className="cursor-pointer font-bold"
              style={{ color: "#EC4899" }}
              onClick={() => navigate("/register")}
            >
              Regístrate
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}