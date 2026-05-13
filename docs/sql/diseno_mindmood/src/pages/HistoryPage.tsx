import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
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
  Clock 
} from 'lucide-react';
import { MOODS } from '../constants.ts';
import { mockBackend } from '../lib/mockData.ts';
import { cn } from '../lib/utils.ts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ICON_MAP: Record<string, any> = {
  Sparkles, Sun, HeartHandshake, Zap, Waves, Flame, Wind, Ghost, CloudRain, Frown, AlertTriangle, HelpCircle
};

export default function HistoryPage() {
  const [entries] = useState(mockBackend.getEntries());
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredEntries = activeFilter === 'all' 
    ? entries 
    : entries.filter(e => e.moodId === activeFilter);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="space-y-8 pb-24"
    >
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight dark:text-white">Cápsula del Tiempo</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium font-sans">Tus momentos, ordenados por emoción.</p>
        </div>

        <div className="relative group lg:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar en tus notas..."
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none shadow-sm dark:text-white transition-all font-medium"
          />
        </div>
      </header>

      <section className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide snap-x px-1">
        <button
          onClick={() => setActiveFilter('all')}
          className={cn(
            "px-6 py-3 rounded-full font-bold text-sm transition-all shrink-0 snap-start",
            activeFilter === 'all' 
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" 
              : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800"
          )}
        >
          Todos
        </button>
        {MOODS.map(mood => (
          <button
            key={mood.id}
            onClick={() => setActiveFilter(mood.id)}
            className={cn(
              "px-6 py-3 rounded-full font-bold text-sm transition-all shrink-0 snap-start flex items-center gap-2",
              activeFilter === mood.id 
                ? "ring-2 ring-indigo-500 shadow-md" 
                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            )}
            style={activeFilter === mood.id ? { backgroundColor: mood.color, color: 'white' } : {}}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeFilter === mood.id ? 'white' : mood.color }} />
            {mood.name}
          </button>
        ))}
      </section>

      <div className="grid gap-4">
        {filteredEntries.map((entry, idx) => {
          const mood = MOODS.find(m => m.id === entry.moodId) || MOODS[4];
          const Icon = ICON_MAP[mood.icon] || HelpCircle;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-slate-900/40 rounded-full -translate-y-1/2 translate-x-1/2 p-4 flex items-end justify-start opacity-0 group-hover:opacity-100 transition-opacity">
                <Icon className="w-8 h-8" style={{ color: mood.color }} />
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl min-w-[100px]">
                  <span className="text-xs font-black uppercase text-indigo-500">{format(entry.timestamp, 'MMM', { locale: es })}</span>
                  <span className="text-2xl font-black dark:text-white leading-none">{format(entry.timestamp, 'dd')}</span>
                  <span className="text-[10px] font-bold text-slate-400 mt-1">{format(entry.timestamp, 'yyyy')}</span>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span 
                      className="px-3 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-sm"
                      style={{ backgroundColor: mood.color }}
                    >
                      {mood.name}
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase">{format(entry.timestamp, 'HH:mm')}</span>
                    </div>
                  </div>
                  <p className="text-slate-800 dark:text-slate-100 font-medium line-clamp-2 leading-relaxed">
                    "{entry.text}"
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                     <p className="text-[10px] italic text-indigo-500 line-clamp-2 leading-tight">IA: {entry.aiAnalysis}</p>
                  </div>
                </div>

                <div className="hidden md:block">
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
