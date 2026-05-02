import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { SplashScreen } from "./screens/SplashScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { AuthScreen } from "./screens/AuthScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { WriteEntryScreen } from "./screens/WriteEntryScreen";
import { InsightScreen } from "./screens/InsightScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { StatisticsScreen } from "./screens/StatisticsScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { AdminDashboard } from "./screens/AdminDashboard";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setRole(data?.role || "user");
          setChecking(false);
        })
        .catch(() => {
          setRole("user");
          setChecking(false);
        });
    } else {
      setChecking(false);
    }
  }, [user]);

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (role !== "admin") return <Navigate to="/home" replace />;

  return <>{children}</>;
}

function SmartHome() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setRole(data?.role || "user");
          setChecking(false);
        })
        .catch(() => {
          setRole("user");
          setChecking(false);
        });
    }
  }, [user]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (role === "admin") return <AdminDashboard />;
  return <HomeScreen />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="size-full">
            <Routes>
              <Route path="/" element={<SplashScreen />} />
              <Route path="/onboarding" element={<OnboardingScreen />} />
              <Route path="/auth" element={<AuthScreen />} />
              <Route path="/home" element={<ProtectedRoute><SmartHome /></ProtectedRoute>} />
              <Route path="/write" element={<ProtectedRoute><WriteEntryScreen /></ProtectedRoute>} />
              <Route path="/insight" element={<ProtectedRoute><InsightScreen /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><HistoryScreen /></ProtectedRoute>} />
              <Route path="/statistics" element={<ProtectedRoute><StatisticsScreen /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}