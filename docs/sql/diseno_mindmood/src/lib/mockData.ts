import { Entry, Mood, User } from '../types.ts';
import { MOODS } from '../constants.ts';

// Mock DB for the first turn (can be replaced by Firebase later)
const MOCK_USER: User = {
  uid: 'user1',
  email: 'user@mindmood.app',
  displayName: 'Cris Ramirez',
  role: 'admin',
  theme: 'dark',
};

const MOCK_ENTRIES: Entry[] = [
  {
    id: 'e1',
    userId: 'user1',
    moodId: 'happy',
    text: 'Hoy fue un gran día, logré completar mis tareas y me siento en paz.',
    aiAnalysis: 'Tu reflejo muestra una alta satisfacción personal y un estado de flujo productivo. Es un momento ideal para consolidar hábitos positivos.',
    timestamp: Date.now() - 86400000 * 2,
    isCrisis: false,
  },
  {
    id: 'e2',
    userId: 'user1',
    moodId: 'anxious',
    text: 'Tengo mucha presión en el trabajo y no sé si podré terminar todo a tiempo.',
    aiAnalysis: 'Detecto rumiación sobre el futuro y fatiga cognitiva. Recomiendo pausas de 5 minutos centrándote en la respiración antes de retomar la tarea.',
    timestamp: Date.now() - 86400000,
    isCrisis: false,
  }
];

export const mockBackend = {
  getUser: () => MOCK_USER,
  getEntries: () => MOCK_ENTRIES.sort((a, b) => b.timestamp - a.timestamp),
  addEntry: (entry: Omit<Entry, 'id'>) => {
    const newEntry = { ...entry, id: Math.random().toString(36).substring(7) };
    MOCK_ENTRIES.push(newEntry);
    return newEntry;
  }
};
