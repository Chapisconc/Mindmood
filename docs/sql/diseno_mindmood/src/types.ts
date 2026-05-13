/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LucideIcon } from 'lucide-react';

export type Role = 'user' | 'admin';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  avatarUrl?: string;
  theme: 'light' | 'dark';
}

export interface Mood {
  id: string;
  name: string;
  color: string;
  icon: string; // Lucide icon name
  score: number;
  description: string;
  bgModal: string;
}

export type AlarmStatus = 'Pendiente' | 'En Proceso' | 'Resuelto';

export interface Entry {
  id: string;
  userId: string;
  moodId: string;
  text: string;
  aiAnalysis: string;
  timestamp: number;
  isCrisis: boolean;
  alarmStatus?: AlarmStatus;
  contacted?: boolean;
}

export interface ContactRequest {
  id: string;
  adminId: string;
  userId: string;
  entryId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

export interface Stats {
  totalEntries: number;
  streak: number;
  moodDistribution: Record<string, number>;
  moodHistory: { date: string; score: number }[];
}
