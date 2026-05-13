/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Mood } from './types.ts';

export const MOODS: Mood[] = [
  {
    id: 'excellent',
    name: 'Excelente',
    color: '#10B981',
    icon: 'Sparkles',
    score: 1.0,
    description: 'Plenitud total',
    bgModal: '#064E3B',
  },
  {
    id: 'happy',
    name: 'Feliz',
    color: '#F472B6',
    icon: 'Sun',
    score: 0.7,
    description: 'Bienestar y paz',
    bgModal: '#4C1D95',
  },
  {
    id: 'grateful',
    name: 'Agradecido',
    color: '#FBBF24',
    icon: 'HeartHandshake',
    score: 0.5,
    description: 'Gratitud profunda',
    bgModal: '#1A3A1A',
  },
  {
    id: 'surprise',
    name: 'Sorpresa',
    color: '#22D3EE',
    icon: 'Zap',
    score: 0.4,
    description: 'Asombro positivo',
    bgModal: '#083344',
  },
  {
    id: 'neutral',
    name: 'Neutral',
    color: '#818CF8',
    icon: 'Waves',
    score: 0,
    description: 'Calma estable',
    bgModal: '#2E1065',
  },
  {
    id: 'angry',
    name: 'Enojo',
    color: '#FB923C',
    icon: 'Flame',
    score: -0.4,
    description: 'Frustración',
    bgModal: '#431407',
  },
  {
    id: 'anxious',
    name: 'Ansiedad',
    color: '#A78BFA',
    icon: 'Wind',
    score: -0.5,
    description: 'Inquietud persistente',
    bgModal: '#1E1B4B',
  },
  {
    id: 'fear',
    name: 'Miedo',
    color: '#C084FC',
    icon: 'Ghost',
    score: -0.7,
    description: 'Inseguridad',
    bgModal: '#2E1065',
  },
  {
    id: 'sad',
    name: 'Triste',
    color: '#FB7185',
    icon: 'CloudRain',
    score: -0.8,
    description: 'Melancolía',
    bgModal: '#4C0519',
  },
  {
    id: 'disgust',
    name: 'Asco',
    color: '#A3E635',
    icon: 'Frown',
    score: -0.9,
    description: 'Rechazo',
    bgModal: '#1A2E05',
  },
  {
    id: 'crisis',
    name: 'Crisis',
    color: '#F87171',
    icon: 'AlertTriangle',
    score: -1.0,
    description: 'Apoyo urgente',
    bgModal: '#180808',
  },
  {
    id: 'undetermined',
    name: 'Indeterminado',
    color: '#94A3B8',
    icon: 'HelpCircle',
    score: 0,
    description: 'Sentimiento ambiguo',
    bgModal: '#1E293B',
  },
];

export const THEMES = {
  light: {
    background: 'bg-[#F8FAFC]',
    card: 'bg-white/70 backdrop-blur-xl border-white/40 shadow-xl shadow-slate-200/50',
    text: 'text-slate-900',
    accent: 'from-indigo-600 to-violet-600',
  },
  dark: {
    background: 'bg-[#020617]',
    card: 'bg-slate-900/60 backdrop-blur-xl border-slate-800/50 shadow-2xl shadow-black/20',
    text: 'text-white',
    accent: 'from-indigo-400 to-fuchsia-400',
  },
};
