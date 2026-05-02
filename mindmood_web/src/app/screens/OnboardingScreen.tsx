import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Brain, Heart, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "../components/Button";

const slides = [
  {
    icon: Brain,
    title: "Entiende Tu Mente",
    description: "Registra tu viaje emocional con insights impulsados por IA que te ayudan a comprender patrones en tu estado mental.",
    gradient: "from-intelligent-indigo to-emotional-lavender",
  },
  {
    icon: Heart,
    title: "Exprésate Libremente",
    description: "Escribe en un espacio seguro, libre de juicios. Tus pensamientos son privados y están encriptados.",
    gradient: "from-emotional-lavender to-warm-coral",
  },
  {
    icon: Sparkles,
    title: "Crece con Insights",
    description: "Recibe análisis emocional personalizado e insights accionables para mejorar tu bienestar mental.",
    gradient: "from-calm-teal to-soft-sky",
  },
];

export function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate("/auth");
    }
  };

  const skipOnboarding = () => {
    navigate("/auth");
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <button
          onClick={skipOnboarding}
          className="absolute top-8 right-8 text-muted-foreground hover:text-foreground transition-colors"
        >
          Omitir
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center max-w-md"
          >
            <motion.div
              className={`p-8 rounded-full bg-gradient-to-br ${slide.gradient} mb-8`}
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Icon className="w-16 h-16 text-white" />
            </motion.div>

            <h2 className="text-3xl font-bold mb-4 text-foreground">
              {slide.title}
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2 mt-12">
          {slides.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-primary w-8"
                  : "bg-muted w-2"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-6 pb-8">
        <Button
          variant="gradient"
          size="lg"
          fullWidth
          onClick={nextSlide}
        >
          {currentSlide < slides.length - 1 ? (
            <span className="flex items-center justify-center gap-2">
              Siguiente
              <ChevronRight className="w-5 h-5" />
            </span>
          ) : (
            "Comenzar"
          )}
        </Button>
      </div>
    </div>
  );
}
