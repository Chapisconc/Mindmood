import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.ts';
import { mockBackend } from '../lib/mockData.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate auth check
    setTimeout(() => {
      setUser(mockBackend.getUser());
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (user?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.theme]);

  const logout = () => setUser(null);
  const toggleTheme = () => {
    if (!user) return;
    setUser({ ...user, theme: user.theme === 'light' ? 'dark' : 'light' });
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
