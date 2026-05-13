import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../services/supabase";
import { useTheme } from "../theme/ThemeContext";
import { Mail, Lock, Eye, EyeOff, Sun, Moon } from "lucide-react";
import Icon from "../components/Icon";
import AppButton from "../components/AppButton";

export default function Register() {
  const navigate = useNavigate();
  const { theme, themeStyles, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function signUpWithEmail() {
    if (!email || !password) {
      setError("Por favor llena todos los campos.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess("¡Cuenta Creada! Se ha creado tu perfil de MindMood con éxito.");
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: themeStyles.background }}
    >
      <div className="flex-1 flex flex-col justify-center px-6 py-10 max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative flex flex-col items-center mb-9"
        >
          <button
            onClick={toggleTheme}
            className="absolute right-0 top-0 p-3 rounded-xl border bg-transparent cursor-pointer"
            style={{
              backgroundColor: themeStyles.card,
              borderColor: themeStyles.border,
            }}
          >
            {theme === "dark" ? (
              <Sun size={28} color={themeStyles.text} />
            ) : (
              <Moon size={28} color={themeStyles.text} />
            )}
          </button>

          <h1
            className="text-[34px] font-black text-center mb-[10px]"
            style={{ color: themeStyles.text }}
          >
            Crear Cuenta
          </h1>
          <p
            className="text-[17px] text-center"
            style={{ color: themeStyles.secondaryText }}
          >
            Comienza a cuidar tu salud mental hoy
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div
            className="p-[26px] rounded-[28px] border"
            style={{
              backgroundColor: themeStyles.glassBg,
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderColor: themeStyles.border,
              boxShadow: `0 12px 32px ${themeStyles.shadow}`,
            }}
          >
            {error && (
              <div
                className="mb-4 p-3 rounded-2xl text-sm font-bold text-center"
                style={{ backgroundColor: themeStyles.error + "20", color: themeStyles.error }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                className="mb-4 p-3 rounded-2xl text-sm font-bold text-center"
                style={{ backgroundColor: themeStyles.success + "20", color: themeStyles.success }}
              >
                {success}
              </div>
            )}

            <label
              className="text-[14px] font-extrabold mb-[10px] ml-[6px] block"
              style={{ color: themeStyles.text }}
            >
              Correo Electrónico
            </label>
            <div
              className="flex items-center rounded-[18px] mb-[22px] border-[1.5px] px-[18px]"
              style={{
                backgroundColor: themeStyles.softAccent,
                borderColor: themeStyles.border,
              }}
            >
              <Icon name="mail" size={22} color={themeStyles.secondaryText} />
              <input
                className="flex-1 p-4 text-base bg-transparent outline-none"
                style={{ color: themeStyles.text }}
                placeholder="tu@correo.com"
                placeholderTextColor={themeStyles.glow}
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                autoCapitalize="none"
                type="email"
              />
            </div>

            <label
              className="text-[14px] font-extrabold mb-[10px] ml-[6px] block"
              style={{ color: themeStyles.text }}
            >
              Contraseña
            </label>
            <div
              className="flex items-center rounded-[18px] mb-[22px] border-[1.5px] px-[18px]"
              style={{
                backgroundColor: themeStyles.softAccent,
                borderColor: themeStyles.border,
              }}
            >
              <Icon name="lock" size={22} color={themeStyles.secondaryText} />
              <input
                className="flex-1 p-4 text-base bg-transparent outline-none"
                style={{ color: themeStyles.text }}
                placeholder="Mínimo 6 caracteres"
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

            {success ? (
              <AppButton title="Ir al Login" onClick={() => navigate("/")} loading={false} />
            ) : (
              <div className="mt-[14px]">
                <AppButton title="Confirmar Registro" onClick={signUpWithEmail} loading={loading} />
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/")}
            className="w-full text-center mt-8 bg-transparent border-none cursor-pointer"
          >
            <span
              style={{ color: themeStyles.secondaryText, fontWeight: 600, fontSize: 15 }}
            >
              Volver al Inicio de Sesión
            </span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
