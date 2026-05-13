/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { Sidebar, BottomNav, MobileHeader } from './components/Navigation.tsx';
import HomePage from './pages/HomePage.tsx';
import NewEntryPage from './pages/NewEntryPage.tsx';
import HistoryPage from './pages/HistoryPage.tsx';
import StatsPage from './pages/StatsPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import InboxPage from './pages/InboxPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils.ts';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
      />
    </div>
  );
  
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return <>{children}</>;
}

function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  
  const isAdminPanel = location.pathname === '/admin-dashboard';

  return (
    <div className={cn(
      "flex min-h-screen transition-colors duration-700",
      isAdminPanel ? "bg-slate-950" : "bg-[#F8FAFC] dark:bg-slate-950"
    )}>
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Universal Ambient Gradients for non-admin pages */}
        {!isAdminPanel && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
             <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
             <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
        )}

        <MobileHeader />
        
        <div className={cn(
          "flex-1 p-4 lg:p-12 w-full relative z-10",
          isAdminPanel ? "lg:max-w-[1600px] mx-auto" : "lg:max-w-7xl lg:mx-auto"
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, type: 'spring', damping: 25 }}
            >
              <Routes>
                <Route path="/home" element={<HomePage />} />
                <Route path="/new-entry" element={<NewEntryPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/inbox" element={<InboxPage />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>

        <BottomNav />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<LoginPage />} /> {/* Mirroring for demo */}
          <Route path="/*" element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
