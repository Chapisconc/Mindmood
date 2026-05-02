import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Brain, Loader2 } from "lucide-react";
import { Card } from "../components/Card";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useAuth } from "../components/AuthProvider";

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();

  // Si ya tiene sesión, redirigir al home
  if (user) {
    navigate("/home", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
      }
      navigate("/home");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="inline-flex p-4 rounded-full bg-gradient-to-br from-intelligent-indigo to-emotional-lavender mb-4"
          >
            <Brain className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">Bienvenido a MindMood</h1>
          <p className="text-muted-foreground">
            {isLogin ? "Inicia sesión para continuar tu viaje" : "Comienza tu viaje de bienestar emocional"}
          </p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-500"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <Input
                type="email"
                label="Correo electrónico"
                placeholder="tu@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
              />

              <Input
                type="password"
                label="Contraseña"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
              />
            </div>

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              fullWidth
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isLogin ? "Iniciando sesión..." : "Creando cuenta..."}
                </span>
              ) : (
                isLogin ? "Iniciar Sesión" : "Crear Cuenta"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(""); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin ? (
                  <>
                    ¿No tienes cuenta?{" "}
                    <span className="text-primary font-medium">Regístrate</span>
                  </>
                ) : (
                  <>
                    ¿Ya tienes cuenta?{" "}
                    <span className="text-primary font-medium">Inicia sesión</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8 leading-relaxed">
          Al continuar, aceptas los Términos de Servicio y la Política de Privacidad de MindMood.
          Tus datos están encriptados y son privados.
        </p>
      </motion.div>
    </div>
  );
}
