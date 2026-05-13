import { X } from "lucide-react";
import Icon from "./Icon";
import { useTheme } from "../theme/ThemeContext";

const MOOD_COLORS = {
  Excelente: "#10B981", Feliz: "#EC4899", Agradecido: "#FBBF24",
  Sorpresa: "#06B6D4", Neutral: "#A78BFA", Enojo: "#F97316",
  Ansiedad: "#8B5CF6", Miedo: "#7C3AED", Triste: "#F43F5E",
  Asco: "#84CC16", Crisis: "#EF4444", Indeterminado: "#64748B",
};

const PHRASES = {
  Excelente: ["Hoy el universo conspiró a tu favor y brillaste con luz propia.", "Tu energía positiva es contagiosa — sigue siendo esa chispa que ilumina a los demás.", "Has tocado la cima con la punta de los dedos. Disfruta el paisaje.", "La alegría que sientes hoy es el eco de todo el bien que has sembrado."],
  Feliz: ["La felicidad no es una meta, es el combustible del viaje. Hoy lo demostraste.", "Tu sonrisa es el recordatorio de que la vida sabe a miel cuando la miras con amor.", "Capturaste un instante de luz en medio del caos. Eso es poder puro.", "Ser feliz es un acto de rebeldía. Sigue siendo revolucionario."],
  Agradecido: ["La gratitud es el imán que atrae más razones para sonreír. Sigue agradeciendo.", "Reconocer lo bueno es el primer paso para multiplicarlo. Hoy sembraste abundancia.", "Tu corazón agradecido es un faro que guía bendiciones hacia tu vida.", "Cada 'gracias' sincero es una semilla que florece en momentos de luz."],
  Sorpresa: ["La vida te lanzó una curva inesperada y la atrapaste con asombro y valentía.", "La sorpresa es el susurro del universo recordándote que nada está escrito.", "Lo inesperado llegó para sacudir tu rutina y regalarte una nueva perspectiva.", "El asombro es la puerta de entrada a la creatividad. La abriste de par en par."],
  Neutral: ["No todos los días son tormentosos ni soleados. La calma también es un regalo.", "La quietud no es vacío, es el espacio donde las respuestas encuentran eco.", "Hoy observaste sin juzgar. Ese silencio interior es sabiduría en estado puro.", "La neutralidad no es indiferencia, es el lienzo en blanco donde pintarás mañana."],
  Enojo: ["El volcán que hoy rugió está forjando tierra fértil para tu próxima primavera.", "Tu enojo es un mensajero que te dice dónde están tus límites. Escúchalo.", "La ira bien canalizada es el motor más poderoso del cambio. Úsala con sabiduría.", "Hoy ardiste, pero incluso del fuego más intenso renace el fénix renovado."],
  Ansiedad: ["El futuro es un océano incierto, pero tú has navegado tormentas y sigues a flote.", "Tu mente galopa al futuro, pero tu cuerpo anhela el presente. Vuelve a casa.", "La ansiedad es el precio de tener un corazón que siente demasiado. Respira.", "Cada ola de inquietud viene y se va. Tú eres el océano, no la ola."],
  Miedo: ["El miedo es la sombra de tu grandeza — cuanto más grande la luz, más larga la sombra.", "Detrás de cada miedo se esconde una versión de ti más fuerte y más sabia.", "Temblar no es caer. Y caer no es quedarse en el suelo. Levántate.", "Lo que hoy te asusta mañana será una anécdota de lo valiente que fuiste."],
  Triste: ["La tristeza es la lluvia necesaria para que florezca tu jardín interior.", "Está bien no estar bien. La noche es larga, pero siempre llega el amanecer.", "Tu tristeza no es un error, es una prueba de que amas profundamente.", "Las lágrimas riegan las raíces del alma. Permítete sentir para sanar."],
  Asco: ["A veces lo que rechazamos es un espejo que nos muestra lo que no queremos ver.", "El asco es una brújula que señala lo que no resuena con tu esencia. Agradece.", "Alejar lo que te daña no es debilidad, es el acto más puro de amor propio.", "Tu incomodidad te está diciendo que mereces algo mejor. Escucha esa voz."],
  Crisis: ["En la oscuridad más profunda es donde mejor se ven las estrellas. No estás solo.", "Las crisis son el parto de una nueva versión de ti. Duele, pero nacerás de nuevo.", "Has sobrevivido al 100% de tus días difíciles hasta hoy. Este también pasará.", "No tienes que caminar solo. Pedir ayuda es el acto más valiente del mundo."],
};

function getPhrase(mood) {
  const list = PHRASES[mood] || PHRASES.Neutral;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return list[dayOfYear % list.length];
}

export default function EmotionModal({ visible, onClose, type, summary, distribution, primaryMood, selectedMoods }) {
  const isCrisis = type === "crisis";
  const accent = MOOD_COLORS[primaryMood] || MOOD_COLORS.Neutral;

  if (!visible) return null;

  const distArray = distribution
    ? Object.entries(distribution).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    : [];

  const total = distArray.reduce((s, d) => s + d.value, 0);
  const phrase = getPhrase(primaryMood);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 flex flex-col items-center border"
        style={{
          backgroundColor: `${accent}15`,
          borderColor: `${accent}40`,
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 bg-transparent border-none cursor-pointer">
          <X size={24} className="text-white/60" />
        </button>

        <div
          className="w-[90px] h-[90px] rounded-full flex items-center justify-center mb-7"
          style={{ backgroundColor: accent, boxShadow: `0 12px 24px ${accent}80` }}
        >
          <Icon name={isCrisis ? "heart-outline" : "auto-fix"} size={40} color="#FFF" />
        </div>

        <p className="text-[28px] font-black text-center mb-2 text-white">
          {isCrisis ? "No estás solo" : primaryMood || "Análisis Mental"}
        </p>

        <p className="text-sm text-center leading-[24px] font-semibold mb-6 px-1 text-white/60">{phrase}</p>

        {selectedMoods?.length > 0 && (
          <div className="w-full mb-4">
            <p className="text-xs font-black uppercase tracking-wider mb-2.5 text-white/50">Tus emociones</p>
            <div className="flex flex-wrap gap-2">
              {selectedMoods.map((m) => {
                const c = MOOD_COLORS[m] || accent;
                return (
                  <span key={m} className="px-3 py-1.5 rounded-full text-[12px] font-extrabold text-white"
                    style={{ backgroundColor: c }}>
                    {m}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {total > 0 ? (
          <div className="w-full mb-6 space-y-2.5">
            <p className="text-xs font-black uppercase tracking-wider mb-3 text-white/50">Distribución emocional</p>
            {distArray.map((d) => {
              const pct = Math.round((d.value / total) * 100);
              const c = MOOD_COLORS[d.name] || accent;
              return (
                <div key={d.name} className="flex items-center gap-2.5">
                  <span className="text-[11px] font-bold w-20 truncate text-white/70">{d.name}</span>
                  <div className="flex-1 h-3 rounded-full bg-white/10">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: c, boxShadow: `0 0 6px ${c}60` }} />
                  </div>
                  <span className="text-[11px] font-black w-8 text-right" style={{ color: c }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        ) : selectedMoods?.length > 0 ? (
          <div className="w-full mb-6">
            <p className="text-xs font-black uppercase tracking-wider mb-3 text-white/50">Emociones detectadas</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {selectedMoods.map((m) => {
                const c = MOOD_COLORS[m] || accent;
                return (
                  <span key={m} className="px-4 py-2 rounded-full text-[13px] font-extrabold text-white"
                    style={{ backgroundColor: c }}>
                    {m}
                  </span>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="w-[60px] h-1 rounded mb-6" style={{ backgroundColor: accent }} />

        <p className="text-base text-center leading-[26px] font-semibold mb-8 px-1 text-slate-200">
          {isCrisis
            ? "Hemos notado que estás pasando por un momento difícil. Por favor, considera hablar con alguien de confianza."
            : summary || "Tu reflexión ha sido guardada correctamente."}
        </p>

        {isCrisis && (
          <div className="w-full mb-7 flex flex-col gap-3">
            {[
              { name: "Linea Cero Suicidios", number: "075" },
              { name: "Linea de la Vida", number: "800-911-2000" },
              { name: "SAPTEL", number: "55-5603-0000" },
            ].map((h) => (
              <button key={h.number} onClick={() => window.open(`tel:${h.number}`, "_self")}
                className="w-full flex items-center p-5 rounded-3xl border cursor-pointer bg-red-500/15 border-red-500/30">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 bg-red-500 shadow-lg shadow-red-500/40">
                  <Icon name="phone-outline" size={22} color="#FFF" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white text-[17px] font-extrabold">{h.name}</p>
                  <p className="text-red-300 text-[15px] font-black mt-0.5">{h.number}</p>
                </div>
                <Icon name="chevron-right" size={22} color="#94A3B8" />
              </button>
            ))}
          </div>
        )}

        <button onClick={onClose}
          className="w-full py-[22px] rounded-3xl text-white text-lg font-black tracking-[0.8px] cursor-pointer border-none"
          style={{ backgroundColor: accent }}>
          {isCrisis ? "Entendido" : "Cerrar"}
        </button>
      </div>
    </div>
  );
}


