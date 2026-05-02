import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Brain } from "lucide-react";

export function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/onboarding");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-intelligent-indigo via-emotional-lavender to-warm-coral overflow-hidden">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center gap-6"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="bg-white/20 backdrop-blur-sm p-8 rounded-full"
        >
          <Brain className="w-20 h-20 text-white" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
            MindMood
          </h1>
          <p className="text-white/80 text-lg">
            Tu Compañero Emocional con IA
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex gap-2 mt-4"
        >
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            className="w-2 h-2 bg-white rounded-full"
          />
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            className="w-2 h-2 bg-white rounded-full"
          />
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            className="w-2 h-2 bg-white rounded-full"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
