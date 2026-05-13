import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Inbox, MessageCircle, Clock, Trash2, CheckCircle2, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { cn } from '../lib/utils.ts';

export default function InboxPage() {
  const { user } = useAuth();

  const mockRequests = [
    {
      id: 'r1',
      adminName: 'Dr. Wellness',
      message: 'Notamos una alerta de crisis en tu diario de ayer. ¿Te gustaría agendar una llamada breve de 15 min sin costo?',
      status: 'pending',
      timestamp: Date.now() - 3600000 * 2,
    },
    {
      id: 'r2',
      adminName: 'Admin System',
      message: 'Felicidades por tu racha de 10 días. Hemos desbloqueado una nueva guía de meditación profunda.',
      status: 'accepted',
      timestamp: Date.now() - 86400000,
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="space-y-8 pb-24"
    >
      <header>
        <h1 className="text-4xl font-black tracking-tight dark:text-white">Bandeja de Entrada</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Mensajes importantes para tu bienestar.</p>
      </header>

      <div className="grid gap-6">
        {mockRequests.map((req, idx) => (
          <motion.div
            key={req.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "p-8 rounded-[2.5rem] shadow-xl border-2 transition-all relative overflow-hidden",
              req.status === 'pending' 
                ? "bg-white dark:bg-slate-800 border-indigo-100 dark:border-indigo-900/30" 
                : "bg-slate-50 dark:bg-slate-900/50 border-transparent opacity-70"
            )}
          >
            {req.status === 'pending' && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 flex items-end justify-start p-4">
                <Shield className="w-8 h-8 text-indigo-500" />
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20">
                <MessageCircle className="w-8 h-8" />
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-xl dark:text-white">{req.adminName}</h3>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest italic">Hace 2 horas</span>
                    </div>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    req.status === 'pending' ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                  )}>
                    {req.status === 'pending' ? 'Pendiente' : 'Leído'}
                  </span>
                </div>

                <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
                  "{req.message}"
                </p>

                {req.status === 'pending' && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-2">
                       Aceptar <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button className="px-8 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white rounded-2xl font-black transition-all active:scale-95">
                       Rechazar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {mockRequests.length === 0 && (
         <div className="p-20 text-center space-y-4 opacity-50">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto flex items-center justify-center">
               <div className="w-10 h-10 border-2 border-slate-300 rounded-lg" />
            </div>
            <p className="font-bold text-slate-400">No hay mensajes nuevos por ahora.</p>
         </div>
      )}
    </motion.div>
  );
}
