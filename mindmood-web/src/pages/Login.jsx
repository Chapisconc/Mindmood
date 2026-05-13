import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../services/supabase";
import { useTheme } from "../theme/ThemeContext";
import { Mail, Lock, Eye, EyeOff, Heart, Moon, Sun } from "lucide-react";
import AppButton from "../components/AppButton";

export default function Login() {
  const navigate = useNavigate();
  const { theme, themeStyles, toggleTheme, syncTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

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
    
    if (user) {
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
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: gradientColors }}
    >
      <div className="flex-1 flex flex-col justify-center px-7 py-10 max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center mb-8 relative"
        >
          <button
            onClick={toggleTheme}
            className="absolute right-0 -top-2 p-3 rounded-2xl border"
            style={{
              backgroundColor: themeStyles.card,
              borderColor: themeStyles.border,
            }}
          >
            {theme === "dark" ? (
              <Sun size={26} color={themeStyles.text} />
            ) : (
              <Moon size={26} color={themeStyles.text} />
            )}
          </button>

          <div
            className="w-[110px] h-[110px] rounded-[32px] flex items-center justify-center mb-6 border"
            style={{
              backgroundColor: themeStyles.card,
              borderColor: themeStyles.border,
              boxShadow: `0 20px 30px ${themeStyles.shadow}`,
            }}
          >
            <div
              className="w-[72px] h-[72px] rounded-3xl flex items-center justify-center"
              style={{
                backgroundColor: themeStyles.accent,
                boxShadow: `0 8px 16px ${themeStyles.glow}`,
              }}
            >
              <Heart size={44} color="white" />
            </div>
          </div>

          <h1
            className="text-[32px] font-black tracking-tight mb-2"
            style={{ color: themeStyles.text }}
          >
            MindMood
          </h1>
          <p
            className="text-[15px] text-center font-medium max-w-[300px] opacity-80"
            style={{ color: themeStyles.secondaryText }}
          >
            Tu espacio seguro de salud mental
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div
            className="p-7 rounded-[28px] border"
            style={{
              backgroundColor: themeStyles.card,
              borderColor: themeStyles.border,
              boxShadow: `0 25px 40px ${themeStyles.shadow}`,
            }}
          >
            {error && (
              <div
                className="mb-4 p-3 rounded-2xl text-sm font-bold text-center"
                style={{
                  backgroundColor: themeStyles.error + "20",
                  color: themeStyles.error,
                }}
              >
                {error}
              </div>
            )}

            <label
              className="text-[13px] font-bold mb-[10px] ml-1 uppercase tracking-[0.5px] block"
              style={{ color: themeStyles.text }}
            >
              Correo Electrónico
            </label>
            <div
              className="flex items-center rounded-2xl mb-[18px] border-[1.5px] px-4 py-1"
              style={{
                backgroundColor: themeStyles.softAccent,
                borderColor: themeStyles.border,
              }}
            >
              <Mail size={22} color={themeStyles.secondaryText} />
              <input
                className="flex-1 py-[14px] px-3 text-base font-medium bg-transparent outline-none"
                style={{ color: themeStyles.text }}
                placeholder="ejemplo@correo.com"
                placeholderTextColor={themeStyles.glow}
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                autoCapitalize="none"
                type="email"
              />
            </div>

            <label
              className="text-[13px] font-bold mb-[10px] ml-1 uppercase tracking-[0.5px] block"
              style={{ color: themeStyles.text }}
            >
              Contraseña
            </label>
            <div
              className="flex items-center rounded-2xl mb-[18px] border-[1.5px] px-4 py-1"
              style={{
                backgroundColor: themeStyles.softAccent,
                borderColor: themeStyles.border,
              }}
            >
              <Lock size={22} color={themeStyles.secondaryText} />
              <input
                className="flex-1 py-[14px] px-3 text-base font-medium bg-transparent outline-none"
                style={{ color: themeStyles.text }}
                placeholder="••••••••"
                placeholderTextColor={themeStyles.glow}
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                type={showPassword ? "text" : "password"}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="bg-transparent border-none p-0 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff size={24} color={themeStyles.secondaryText} />
                ) : (
                  <Eye size={24} color={themeStyles.secondaryText} />
                )}
              </button>
            </div>

            <div className="mt-[10px]">
              <AppButton
                title="Entrar"
                onClick={signInWithEmail}
                loading={loading}
              />
            </div>
          </div>

          <button
            onClick={() => navigate("/register")}
            className="w-full text-center mt-7 pb-5 bg-transparent border-none cursor-pointer"
          >
            <span style={{ color: themeStyles.secondaryText, fontWeight: 600, fontSize: 15 }}>
              ¿No tienes cuenta?{" "}
            </span>
            <span
              style={{
                fontWeight: 900,
                color: themeStyles.accent,
                fontSize: 15,
              }}
            >
              Regístrate aquí
            </span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
