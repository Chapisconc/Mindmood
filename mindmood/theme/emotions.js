export const EMOTIONS_MAP = [
  { name: 'Excelente', color: '#10B981', icon: 'star', desc: 'Plenitud total.', value: 1 },
  { name: 'Feliz', color: '#6366F1', icon: 'happy', desc: 'Bienestar y paz.', value: 0.7 },
  { name: 'Sorpresa', color: '#06B6D4', icon: 'flash', desc: 'Asombro positivo.', value: 0.4 },
  { name: 'Neutral', color: '#94A3B8', icon: 'remove-circle', desc: 'Calma estable.', value: 0 },
  { name: 'Enojo', color: '#F97316', icon: 'flame', desc: 'Frustración.', value: -0.4 },
  { name: 'Miedo', color: '#4B5563', icon: 'eye-off', desc: 'Inseguridad.', value: -0.7 },
  { name: 'Triste', color: '#F87171', icon: 'rainy', desc: 'Melancolía.', value: -0.8 },
  { name: 'Asco', color: '#84CC16', icon: 'sad', desc: 'Rechazo.', value: -0.9 },
  { name: 'Crisis', color: '#EF4444', icon: 'alert-circle', desc: 'Apoyo urgente.', value: -1 },
  { name: 'Indeterminado', color: '#64748B', icon: 'help-circle', desc: 'Sentimiento ambiguo.', value: 0 },
];

export const getEmotionByName = (name) => EMOTIONS_MAP.find(e => e.name === name) || EMOTIONS_MAP[3];
export const getEmotionColor = (name) => getEmotionByName(name).color;
