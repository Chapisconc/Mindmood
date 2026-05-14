import { motion } from "framer-motion";

export default function BackgroundDecor({ variant = "default" }) {
  const variants = {
    default: (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-fuchsia-500/5 blur-[100px] rounded-full"
        />
      </>
    ),
    auth: (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-indigo-500/[0.03] blur-[150px] rounded-full"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-fuchsia-500/[0.03] blur-[130px] rounded-full"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.8 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/[0.03] blur-[100px] rounded-full"
        />
      </>
    ),
    dark: (
      <>
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-fuchsia-500/10 blur-[100px] rounded-full" />
      </>
    ),
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {variants[variant] || variants.default}
    </div>
  );
}
