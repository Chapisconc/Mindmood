import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { 
  Users, 
  Database, 
  Activity, 
  Search, 
  ArrowUpRight, 
  Command, 
  Bell, 
  Shield,
  LayoutGrid,
  ClipboardList,
  CheckCircle,
  AlertOctagon,
  LifeBuoy
} from 'lucide-react';
import { MOODS } from '../constants.ts';
import { mockBackend } from '../lib/mockData.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { cn } from '../lib/utils.ts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminDashboard() {
  const { user } = useAuth();
  const entries = mockBackend.getEntries();
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  if (user?.role !== 'admin') {
    return <div className="p-10 text-center font-bold">Acceso Denegado</div>;
  }

  const crisisEntries = entries.filter(e => e.isCrisis);
  
  // Custom Data for Radar Chart (Sentimiento Global)
  const radarData = MOODS.slice(0, 6).map(mood => ({
    subject: mood.name,
    A: Math.floor(Math.random() * 100) + 20,
    fullMark: 150,
  }));

  const alarmStatusData = [
    { name: 'Crítico', value: 40, color: '#F87171' },
    { name: 'Monitoreo', value: 30, color: '#FBBF24' },
    { name: 'Estable', value: 30, color: '#34D399' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-20"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-500 font-black text-xs uppercase tracking-[0.3em]">
            <Command className="w-4 h-4" /> Command Center
          </div>
          <h1 className="text-5xl font-black tracking-tight dark:text-white">Admin Dashboard</h1>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="relative">
              <Bell className="w-6 h-6 text-slate-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] text-white font-bold">3</div>
           </div>
           <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800" />
           <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold dark:text-white">Encrypted Node</span>
           </div>
        </div>
      </header>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Users" value="2.4k" delta="+12%" color="text-indigo-500" />
        <StatCard icon={Database} label="Data Points" value="85k" delta="+5%" color="text-fuchsia-500" />
        <StatCard icon={Activity} label="System Load" value="14%" delta="Optimal" color="text-emerald-500" />
        <StatCard icon={AlertOctagon} label="Active Alerts" value={crisisEntries.length.toString()} delta="Follow up" color="text-rose-500" />
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Sentiment Network (Radar) */}
        <section className="lg:col-span-7 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl p-8 rounded-[3rem] border border-white/20 dark:border-slate-800 shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -mr-20 -mt-20 group-hover:bg-indigo-500/10 transition-colors" />
          
          <div className="flex items-center justify-between mb-10 relative z-10">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/10 rounded-2xl">
                   <LayoutGrid className="w-5 h-5 text-indigo-500" />
                </div>
                <h2 className="text-2xl font-black dark:text-white">Red de Sentimiento</h2>
             </div>
             <button className="text-xs font-black text-indigo-500 uppercase tracking-widest hover:underline">Ver Histórico</button>
          </div>
          
          <div className="h-[400px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <defs>
                  <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#A855F7" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <PolarGrid stroke="#94a3b8" strokeDasharray="3 3" opacity={0.3} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em' }} />
                <PolarRadiusAxis hide />
                <Radar
                   name="Sentiment"
                   dataKey="A"
                   stroke="#6366F1"
                   strokeWidth={3}
                   fill="url(#radarGradient)"
                   fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Global Stability (Pie/Donut) */}
        <section className="lg:col-span-5 flex flex-col gap-8">
           <div className="flex-1 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl p-8 rounded-[3rem] border border-white/20 dark:border-slate-800 shadow-2xl relative overflow-hidden">
             <h3 className="text-xl font-black mb-6 dark:text-white">Estabilidad Global</h3>
             <div className="h-64 relative">
               <ResponsiveContainer width="100%" height="100%">
                 <RePieChart>
                   <Pie
                     data={alarmStatusData}
                     cx="50%"
                     cy="50%"
                     innerRadius={70}
                     outerRadius={95}
                     paddingAngle={10}
                     dataKey="value"
                     stroke="none"
                     cornerRadius={12}
                   >
                     {alarmStatusData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip 
                     contentStyle={{ 
                       borderRadius: '24px', 
                       border: 'none', 
                       boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                       fontSize: '12px',
                       fontWeight: '800'
                     }}
                   />
                 </RePieChart>
               </ResponsiveContainer>
               {/* Center Label */}
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black dark:text-white">98%</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Salud</span>
               </div>
             </div>
             <div className="grid grid-cols-3 gap-2 mt-8">
               {alarmStatusData.map((d, i) => (
                 <div key={i} className="flex flex-col items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="w-1.5 h-1.5 rounded-full mb-1" style={{ backgroundColor: d.color }} />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter truncate w-full text-center">{d.name}</span>
                    <span className="text-xs font-black dark:text-white mt-1">{d.value}%</span>
                 </div>
               ))}
             </div>
           </div>

           <div className="p-8 bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-[3rem] shadow-xl text-white">
              <LifeBuoy className="w-10 h-10 mb-4 opacity-50" />
              <h4 className="text-2xl font-black mb-2">Protocolo Alpha</h4>
              <p className="text-white/70 text-xs italic mb-6">El sistema ha detectado una anomalía emocional colectiva. Activar medidas de prevención.</p>
              <button className="w-full py-4 bg-white/20 backdrop-blur-md rounded-2xl font-black hover:bg-white/30 transition-all">Desplegar Unidades</button>
           </div>
        </section>
      </div>

      {/* Alerts Table-ish */}
      <section className="space-y-8 mt-12 px-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="p-4 bg-rose-500/10 rounded-3xl">
                <ClipboardList className="w-6 h-6 text-rose-500" />
             </div>
             <div>
               <h2 className="text-3xl font-black dark:text-white">Incidentes Críticos</h2>
               <p className="text-slate-400 text-sm font-medium">Casos que requieren atención inmediata de un profesional.</p>
             </div>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Filtro rápido..."
              className="pl-12 pr-6 py-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-4 ring-indigo-500/10 transition-all font-bold text-sm w-full md:w-64"
            />
          </div>
        </div>

        <div className="grid gap-6">
          {crisisEntries.map((entry, idx) => (
            <motion.div 
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white/70 dark:bg-slate-900/40 backdrop-blur-md p-8 rounded-[3rem] border border-white/20 dark:border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center gap-8"
            >
              <div className="flex items-center gap-6 flex-1">
                 <div className="w-16 h-16 rounded-[2rem] bg-rose-500/10 flex items-center justify-center shrink-0">
                    <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.8)]" />
                 </div>
                 <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                       <span className="font-black text-base md:text-lg dark:text-white truncate max-w-[200px]">user@mindmood.app</span>
                       <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-[8px] font-black tracking-widest uppercase">
                         UID: {entry.id.split('-')[0]}
                       </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium italic line-clamp-2 md:line-clamp-1">"{entry.text}"</p>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <div className="text-right mr-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{format(entry.timestamp, "dd MMM", { locale: es })}</p>
                    <p className="font-black text-sm dark:text-white">{format(entry.timestamp, "HH:mm")}</p>
                 </div>
                 <button className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2">
                    Triaje <ArrowUpRight className="w-4 h-4" />
                 </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, delta, color }: any) {
  return (
    <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/20 dark:border-slate-800 shadow-xl group hover:shadow-2xl transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 md:p-4 rounded-2xl md:rounded-3xl bg-slate-50 dark:bg-slate-800", color)}>
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <span className={cn("text-[8px] md:text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest", delta === 'Optimal' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500')}>
          {delta}
        </span>
      </div>
      <div>
        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest md:tracking-[0.2em] mb-1 truncate">{label}</h4>
        <p className="text-2xl md:text-3xl font-black dark:text-white">{value}</p>
      </div>
    </div>
  );
}
