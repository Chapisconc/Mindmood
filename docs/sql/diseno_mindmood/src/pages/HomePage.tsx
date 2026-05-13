import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
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
  ChevronRight,
  TrendingUp,
  CircleDot,
  Fingerprint,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import { 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { MOODS } from '../constants.ts';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils.ts';

const ICON_MAP: Record<string, any> = {
  Sparkles, Sun, HeartHandshake, Zap, Waves, Flame, Wind, Ghost, CloudRain, Frown, AlertTriangle, HelpCircle
};

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [streak] = useState(12);
  const [chartView, setChartView] = useState<'bars' | 'pie'>('bars');

  const chartData = MOODS.slice(0, 4).map((m, i) => ({
    name: m.name,
    value: [45, 25, 20, 10][i],
    color: m.color
  }));

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 30, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', damping: 20 } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-12 pb-24 lg:pb-0"
    >
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-4">
        <div className="space-y-2">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter dark:text-white leading-none">
            Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-500">{user?.displayName.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-base md:text-lg italic">¿En qué frecuencia vibramos hoy?</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] flex items-center gap-4 border border-white/20 dark:border-slate-800 shadow-2xl">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-tr from-orange-400 to-rose-400 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
               <Flame className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Streak</p>
              <p className="font-black text-slate-900 dark:text-white text-xl md:text-2xl leading-none">{streak} Días</p>
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[10px] md:text-xs font-black dark:text-white uppercase tracking-[0.3em] flex items-center gap-3">
             Registrar Estado <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          </h2>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Análisis por IA</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {MOODS.map((mood) => {
            const Icon = ICON_MAP[mood.icon] || HelpCircle;
            return (
              <motion.button
                key={mood.id}
                variants={item}
                whileHover={{ y: -8, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/new-entry?mood=${mood.id}`)}
                className="group relative flex flex-col items-center justify-center p-6 md:p-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] md:rounded-[3rem] border border-white/20 dark:border-slate-800 shadow-xl transition-all duration-500 overflow-hidden"
              >
                {/* Mood Color Glow */}
                <div 
                   className="absolute -top-10 -right-10 w-20 h-20 blur-[40px] opacity-20 transition-opacity group-hover:opacity-40"
                   style={{ backgroundColor: mood.color }}
                />
                
                <div 
                  className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[2rem] flex items-center justify-center mb-4 transition-transform duration-500 group-hover:rotate-12 shadow-2xl"
                  style={{ backgroundColor: mood.color }}
                >
                  <Icon className="w-6 h-6 md:w-8 md:h-8 text-white shadow-sm" />
                </div>
                <span className="font-black text-[10px] md:text-xs uppercase tracking-wider text-slate-800 dark:text-white mb-1 text-center line-clamp-1">{mood.name}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-3">{mood.description}</span>
              </motion.button>
            );
          })}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div 
          variants={item} 
          className="p-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[3.5rem] shadow-2xl border border-white/20 dark:border-slate-800 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <TrendingUp className="w-32 h-32" />
          </div>
          
          <div className="relative space-y-10 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black dark:text-white tracking-tighter">Bitácora Semanal</h3>
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-1">
                  {chartView === 'bars' ? 'Índice de Bienestar Energético' : 'Distribución de Sentimientos'}
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setChartView('bars')}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    chartView === 'bars' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  )}
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setChartView('pie')}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    chartView === 'pie' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  )}
                >
                  <PieChartIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 min-h-[160px] relative">
              <AnimatePresence mode="wait">
                {chartView === 'bars' ? (
                  <motion.div 
                    key="bars"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="h-full flex items-end justify-between gap-4"
                  >
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => {
                      const height = [40, 60, 45, 80, 55, 90, 75][i];
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                          <div className="w-full relative h-32 bg-slate-100 dark:bg-slate-800/50 rounded-2xl overflow-hidden">
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                               <span className="text-[8px] font-black dark:text-white">{height}%</span>
                            </div>
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${height}%` }}
                              transition={{ duration: 1, type: 'spring' }}
                              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-500 to-fuchsia-500 rounded-2xl"
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{d}</span>
                        </div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="pie"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="h-full flex items-center justify-center -mt-4"
                  >
                    <div className="w-full h-48 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={8}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '10px', fontWeight: 'bold' }}
                          />
                        </RePieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xl font-black dark:text-white">EQ</span>
                        <span className="text-[7px] font-black text-indigo-500 uppercase tracking-widest">Balance</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                       {chartData.map((d, i) => (
                         <div key={i} className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                           <span className="text-[8px] font-black dark:text-white uppercase tracking-tighter line-clamp-1">{d.name}</span>
                         </div>
                       ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={item} 
          className="p-10 bg-slate-950 rounded-[3.5rem] shadow-2xl text-white relative overflow-hidden group"
        >
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-amber-600 opacity-60 group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-3xl" />
          
          <div className="relative flex flex-col h-full space-y-6">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-2xl border border-white/20">
              <Fingerprint className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-4xl font-black tracking-tighter mb-4 leading-tight">Tu Ecosistema Emocional</h3>
              <p className="text-white/60 text-sm font-medium leading-relaxed max-w-xs">Hemos procesado tus datos. Estás vibrando en frecuencias de alta productividad este mes.</p>
            </div>
            <div className="mt-auto">
              <button 
                onClick={() => navigate('/history')}
                className="w-full bg-white text-slate-950 py-5 rounded-3xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:translate-x-1 transition-all shadow-2xl active:scale-95"
              >
                Abrir Archivo <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
