import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RePieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { ArrowLeft, TrendingUp, Calendar, Zap, Award, Target, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOODS } from '../constants.ts';
import { mockBackend } from '../lib/mockData.ts';
import { useAuth } from '../contexts/AuthContext.tsx';

export default function StatsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const entries = mockBackend.getEntries();

  // Prepare data for distribution chart
  const moodDistribution = entries.reduce((acc: any, entry) => {
    acc[entry.moodId] = (acc[entry.moodId] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(moodDistribution).map(([id, count]) => {
    const mood = MOODS.find(m => m.id === id);
    return {
      name: mood?.name || id,
      value: count,
      color: mood?.color || '#CBD5E1'
    };
  }).sort((a, b) => (b.value as number) - (a.value as number));

  const barData = MOODS.slice(0, 8).map(m => ({
    name: m.name,
    count: moodDistribution[m.id] || 0,
    color: m.color
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-24 lg:pb-8"
    >
      <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors dark:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-black dark:text-white">Estadísticas</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
           <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
             <Zap className="w-7 h-7" />
           </div>
           <div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider truncate">Registros Totales</p>
             <p className="text-2xl font-black dark:text-white">{entries.length}</p>
           </div>
        </div>
        <div className="p-6 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
           <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
             <Award className="w-7 h-7" />
           </div>
           <div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider truncate">Mejor Racha</p>
             <p className="text-2xl font-black dark:text-white">15 Días</p>
           </div>
        </div>
        <div className="p-6 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
           <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
             <Target className="w-7 h-7" />
           </div>
           <div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider truncate">Mood Promedio</p>
             <p className="text-2xl font-black dark:text-white">Estable</p>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <section className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
           <h2 className="text-xl font-black mb-8 dark:text-white">Distribución Dominante</h2>
           <div className="flex-1 min-h-[300px] flex flex-col md:flex-row items-center gap-8">
             <div className="w-full h-full relative">
               <ResponsiveContainer width="100%" height="100%">
                 <RePieChart>
                   <Pie
                     data={pieData}
                     cx="50%"
                     cy="50%"
                     innerRadius={80}
                     outerRadius={110}
                     paddingAngle={10}
                     dataKey="value"
                     stroke="none"
                     cornerRadius={12}
                   >
                     {pieData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip 
                     contentStyle={{ 
                       borderRadius: '24px', 
                       border: 'none', 
                       boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                       backgroundColor: '#FFFFFF',
                       color: '#0F172A',
                       fontSize: '12px',
                       fontWeight: '800'
                     }}
                   />
                 </RePieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-black dark:text-white">{entries.length}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registros</span>
               </div>
             </div>
             
             <div className="w-full md:w-1/3 grid grid-cols-2 md:grid-cols-1 gap-3">
               {pieData.slice(0, 5).map((d, i) => (
                 <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                       <span className="text-[10px] font-black dark:text-white uppercase tracking-tighter truncate max-w-[80px]">{d.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-500">{d.value}</span>
                 </div>
               ))}
             </div>
           </div>
        </section>

        <section className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
           <h2 className="text-xl font-black mb-8 dark:text-white">Frecuencia por Emoción</h2>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <ReBarChart data={barData} layout="vertical" margin={{ left: 40 }}>
                 <XAxis type="number" hide />
                 <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} />
                 <Tooltip cursor={{ fill: 'transparent' }} />
                 <Bar dataKey="count" radius={[0, 10, 10, 0]}>
                   {barData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Bar>
               </ReBarChart>
             </ResponsiveContainer>
           </div>
        </section>
      </div>

      <section className="p-8 bg-slate-900 dark:bg-indigo-600 rounded-[2.5rem] text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="space-y-2">
             <h3 className="text-2xl font-black">Reporte Proyectado</h3>
             <p className="text-white/60 text-sm max-w-md">Basado en tus últimas entradas, tu balance emocional ha mejorado un 12% este mes. Sigue registrando tus sentimientos para un análisis más profundo.</p>
           </div>
           <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black hover:bg-slate-100 transition-colors shrink-0">
             Manual de Cuidado
           </button>
        </div>
      </section>
    </motion.div>
  );
}
