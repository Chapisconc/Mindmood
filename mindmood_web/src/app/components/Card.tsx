import { ReactNode } from "react";
import { motion } from "motion/react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  className = "",
  hover = false,
  gradient = false,
  padding = "md",
}: CardProps) {
  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const baseStyles = `relative overflow-hidden rounded-[var(--radius-xl)] ${paddingStyles[padding]} ${className}`;
  // Glassmorphism base
  const bgStyles = gradient 
    ? "bg-gradient-to-br from-card/90 to-secondary/40 backdrop-blur-xl border border-white/10 dark:border-white/5" 
    : "bg-card/80 backdrop-blur-xl border border-border/50";
  
  const shadowClass = "shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.1)]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={hover ? { 
        y: -5, 
        boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1), 0 0 20px rgba(99,102,241,0.1)",
        borderColor: "rgba(99,102,241,0.2)"
      } : {}}
      className={`${baseStyles} ${bgStyles} ${shadowClass} transition-colors duration-300 group`}
    >
      {/* Subtle inner top highlight for 3D effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
      
      {/* Hover glow effect */}
      {hover && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
      
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
