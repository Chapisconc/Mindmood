import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Mail, Lock, LogIn, ChevronRight } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl space-y-10 border border-slate-100 dark:border-slate-800/50"
      >
        <div className="text-center space-y-4">
          <div className="inline-flex bg-gradient-to-br from-indigo-500 to-pink-500 w-20 h-20 rounded-3xl items-center justify-center text-white text-4xl font-black shadow-xl mb-2">
            M
          </div>
          <h1 className="text-4xl font-black tracking-tighter dark:text-white">MindMood</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium italic">Tu refugio emocional digital.</p>
        </div>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="email" 
                placeholder="Email"
                className="w-full pl-12 pr-4 py-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none transition-all dark:text-white font-medium"
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="password" 
                placeholder="Contraseña"
                className="w-full pl-12 pr-4 py-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none transition-all dark:text-white font-medium"
              />
            </div>
          </div>

          <button className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xl rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3">
            Entrar <LogIn className="w-6 h-6" />
          </button>
        </form>

        <div className="text-center pt-4">
          <p className="text-slate-500 font-bold text-sm">
            ¿No tienes cuenta? {' '}
            <Link to="/register" className="text-indigo-600 hover:underline">Regístrate</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
