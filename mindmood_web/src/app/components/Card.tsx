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

  const baseStyles = `bg-card rounded-[var(--radius-xl)] ${paddingStyles[padding]} ${className}`;
  const shadowClass = "shadow-[var(--shadow-md)]";
  const gradientClass = gradient ? "border border-border" : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -4, boxShadow: "var(--shadow-xl)" } : {}}
      className={`${baseStyles} ${shadowClass} ${gradientClass}`}
    >
      {children}
    </motion.div>
  );
}
