import { motion } from "framer-motion";
import { useTheme } from "../theme/ThemeContext";

export default function BackgroundDecor({ variant = "default" }) {
  const { themeStyles } = useTheme();
  const colors = themeStyles.meshColors;
  const opacity = themeStyles.meshOpacity;

  const blobs = [
    { color: colors[0], w: 500, h: 500, x: "-15%", y: "-20%", delay: 0 },
    { color: colors[1], w: 400, h: 400, x: "70%", y: "-10%", delay: 5 },
    { color: colors[2], w: 450, h: 450, x: "50%", y: "60%", delay: 10 },
    { color: colors[3], w: 350, h: 350, x: "-10%", y: "55%", delay: 15 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {blobs.map((blob, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
            x: [0, 30, -20, 0],
            y: [0, -20, 15, 0],
            scale: [1, 1.05, 0.95, 1],
          }}
          transition={{
            opacity: { duration: 8, repeat: Infinity, delay: blob.delay, ease: "easeInOut" },
            x: { duration: 25, repeat: Infinity, delay: blob.delay, ease: "easeInOut" },
            y: { duration: 20, repeat: Infinity, delay: blob.delay, ease: "easeInOut" },
            scale: { duration: 18, repeat: Infinity, delay: blob.delay, ease: "easeInOut" },
          }}
          className="absolute rounded-full blur-[120px]"
          style={{
            left: blob.x,
            top: blob.y,
            width: blob.w,
            height: blob.h,
            backgroundColor: blob.color,
            opacity: opacity,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
      {/* Mesh gradient overlay for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${colors[0]}08 0%, transparent 60%),
                       radial-gradient(circle at 70% 60%, ${colors[1]}06 0%, transparent 60%),
                       radial-gradient(circle at 50% 80%, ${colors[2]}04 0%, transparent 50%)`,
        }}
      />
    </div>
  );
}
