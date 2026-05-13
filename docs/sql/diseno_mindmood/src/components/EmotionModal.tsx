import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Sun, 
  HeartHandshake, 
  Zap, 
  Waves, 
  Flame, 
  Wind, 
  Ghost, 
  CloudRain, 
  Frown, 
  AlertTriangle, 
  HelpCircle, 
  Phone, 
  Info 
} from 'lucide-react';
import { Mood, Entry } from '../types.ts';
import { MOODS } from '../constants.ts';
import { cn } from '../lib/utils.ts';

const ICON_MAP: Record<string, any> = {
  Sparkles, Sun, HeartHandshake, Zap, Waves, Flame, Wind, Ghost, CloudRain, Frown, AlertTriangle, HelpCircle
};

interface EmotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: Partial<Entry> | null;
  mood: Mood;
}

export function EmotionModal({ isOpen, onClose, entry, mood }: EmotionModalProps) {
  const IconComponent = ICON_MAP[mood.icon] || HelpCircle;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={cn(
              "relative w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl",
              "border border-white/10"
            )}
            style={{ backgroundColor: mood.bgModal }}
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 pb-0 flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-2xl"
                style={{ backgroundColor: mood.color }}
              >
                <IconComponent className="w-12 h-12 text-white" />
              </motion.div>

              <h2 className="text-3xl font-black text-white mb-2">{mood.name}</h2>
              <p className="text-white/70 font-medium text-center italic px-8">
                "En la calma encontrarás la respuesta que el ruido te oculta."
              </p>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-white/50 text-[10px] font-bold uppercase tracking-widest">
                  <span>Balance Emocional</span>
                  <span>{Math.round((mood.score + 1) * 50)}%</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(mood.score + 1) * 50}%` }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: mood.color }}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 text-white/50 mb-3">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Análisis de IA</span>
                </div>
                <p className="text-white/90 text-sm leading-relaxed bg-white/5 p-4 rounded-2xl italic border border-white/5">
                  {entry?.aiAnalysis || "Procesando tu entrada para brindarte una reflexión personalizada..."}
                </p>
              </div>

              {mood.id === 'crisis' ? (
                <div className="space-y-3 mt-6">
                  <p className="text-rose-400 text-xs font-black uppercase text-center mb-4 flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> RECURSOS DE APOYO URGENTE
                  </p>
                  <a href="tel:075" className="flex items-center justify-between p-4 bg-rose-500/20 hover:bg-rose-500/30 rounded-2xl border border-rose-500/30 transition-all group">
                    <span className="text-white font-bold">Cero Suicidios 075</span>
                    <Phone className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
                  </a>
                  <a href="tel:8009112000" className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group">
                    <span className="text-white font-bold">Línea de la Vida</span>
                    <Phone className="w-5 h-5 text-white/40 group-hover:scale-110 transition-transform" />
                  </a>
                  <button 
                    onClick={onClose}
                    className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95"
                  >
                    ENTENDIDO
                  </button>
                </div>
              ) : (
                <button 
                  onClick={onClose}
                  className="w-full mt-6 py-4 bg-white text-slate-900 font-black rounded-2xl shadow-xl hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  CERRAR
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
