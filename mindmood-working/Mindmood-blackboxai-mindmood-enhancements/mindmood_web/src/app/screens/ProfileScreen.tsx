import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  User,
  ChevronRight,
  Bell,
  Lock,
  Heart,
  HelpCircle,
  LogOut,
  Shield,
  Settings,
  Loader2,
} from "lucide-react";
import { Card } from "../components/Card";
import { ThemeToggle } from "../components/ThemeToggle";
import { BottomNav } from "../components/BottomNav";
import { useAuth } from "../components/AuthProvider";
import { supabase } from "../../lib/supabase";

const settingsGroups = [
  {
    title: "Preferencias",
    items: [
      {
        icon: Bell,
        label: "Notificaciones",
        description: "Recordatorios diarios e insights",
        hasToggle: true,
      },
      {
        icon: Settings,
        label: "Apariencia",
        description: "Configuración de tema",
        component: "theme",
      },
    ],
  },
  {
    title: "Privacidad y Seguridad",
    items: [
      {
        icon: Lock,
        label: "Configuración de Privacidad",
        description: "Encriptación y almacenamiento",
      },
      {
        icon: Shield,
        label: "Seguridad",
        description: "Contraseña y autenticación",
      },
    ],
  },
  {
    title: "Soporte",
    items: [
      {
        icon: HelpCircle,
        label: "Ayuda y Soporte",
        description: "Preguntas frecuentes y contacto",
      },
      {
        icon: Heart,
        label: "Acerca de MindMood",
        description: "Versión 1.0.0",
      },
    ],
  },
];

export function ProfileScreen() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [totalEntries, setTotalEntries] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      // Perfil
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      setProfile(profileData);

      // Contar entradas y promedio
      const { data: entries } = await supabase
        .from("entries")
        .select("score")
        .eq("user_id", user!.id);

      if (entries) {
        setTotalEntries(entries.length);
        if (entries.length > 0) {
          const avg = entries.reduce((sum, e) => sum + e.score, 0) / entries.length;
          setAvgScore(Math.round(((avg + 1) / 2) * 100)); // Convertir a %
        }
      }
    } catch (e) {
      console.error("Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-6 py-8 space-y-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-intelligent-indigo to-emotional-lavender rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-1">
            {profile?.display_name || user?.email?.split("@")[0] || "Usuario"}
          </h2>
          <p className="text-muted-foreground">{user?.email}</p>
        </motion.div>

        <Card padding="lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{totalEntries}</p>
              <p className="text-xs text-muted-foreground mt-1">Entradas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-calm-teal">{profile?.streak || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Días de Racha</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warm-coral">{avgScore}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                Puntuación
              </p>
            </div>
          </div>
        </Card>

        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-3">
            <h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">
              {group.title}
            </h3>
            <Card padding="none">
              {group.items.map((item, itemIndex) => {
                const Icon = item.icon;
                const isLast = itemIndex === group.items.length - 1;

                return (
                  <motion.button
                    key={itemIndex}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full px-6 py-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors ${
                      !isLast ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-secondary">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    {item.component === "theme" ? (
                      <ThemeToggle />
                    ) : item.hasToggle ? (
                      <div className="w-12 h-6 bg-primary rounded-full p-1 flex items-center">
                        <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                      </div>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </motion.button>
                );
              })}
            </Card>
          </div>
        ))}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSignOut}
          className="w-full"
        >
          <Card padding="md">
            <div className="flex items-center justify-center gap-2 text-warm-coral">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Cerrar Sesión</span>
            </div>
          </Card>
        </motion.button>

        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tus datos están encriptados de extremo a extremo.
            <br />
            Tu privacidad es nuestra prioridad.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
