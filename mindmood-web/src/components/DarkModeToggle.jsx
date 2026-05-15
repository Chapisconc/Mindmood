import { useTheme } from "../theme/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export default function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.button
      onClick={toggleTheme}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, type: "spring" }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-24 lg:bottom-8 right-4 lg:right-8 z-50 w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg transition-all duration-500 cursor-pointer"
      style={{
        background: isDark
          ? "linear-gradient(135deg, #1E293B, #0F172A)"
          : "linear-gradient(135deg, #FFFFFF, #F8FAFC)",
        borderColor: isDark ? "#334155" : "#E2E8F0",
        boxShadow: isDark
          ? "0 0 25px rgba(244, 114, 182, 0.3), 0 4px 15px rgba(0,0,0,0.4)"
          : "0 0 25px rgba(99, 102, 241, 0.25), 0 4px 15px rgba(99, 102, 241, 0.1)",
      }}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {isDark ? (
          <Sun size={20} className="text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
        ) : (
          <Moon size={20} className="text-indigo-500 drop-shadow-[0_0_6px_rgba(99,102,241,0.4)]" />
        )}
      </motion.div>
    </motion.button>
  );
}
