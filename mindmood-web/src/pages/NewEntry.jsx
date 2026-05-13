import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, ArrowLeft, Loader2, Sparkles, Sun, HeartHandshake, Zap, Waves, Flame, Wind, Ghost, CloudRain, Frown, AlertTriangle, HelpCircle } from "lucide-react";
import { supabase } from "../services/supabase";
import { useTheme } from "../theme/ThemeContext";
import { useJournalEntry } from "../hooks/useJournalEntry";
import EmotionModal from "../components/EmotionModal";

const MAX_CHARS = 2000;
const MOODS = [
  { id: "excelente", name: "Excelente", color: "#10B981", icon: Sparkles },
  { id: "feliz", name: "Feliz", color: "#F472B6", icon: Sun },
  { id: "agradecido", name: "Agradecido", color: "#FBBF24", icon: HeartHandshake },
  { id: "sorpresa", name: "Sorpresa", color: "#22D3EE", icon: Zap },
  { id: "neutral", name: "Neutral", color: "#818CF8", icon: Waves },
  { id: "enojo", name: "Enojo", color: "#FB923C", icon: Flame },
  { id: "ansiedad", name: "Ansiedad", color: "#A78BFA", icon: Wind },
  { id: "miedo", name: "Miedo", color: "#C084FC", icon: Ghost },
  { id: "triste", name: "Triste", color: "#FB7185", icon: CloudRain },
  { id: "asco", name: "Asco", color: "#A3E635", icon: Frown },
  { id: "crisis", name: "Crisis", color: "#F87171", icon: AlertTriangle },
];

const ICON_MAP = { Sparkles, Sun, HeartHandshake, Zap, Waves, Flame, Wind, Ghost, CloudRain, Frown, AlertTriangle, HelpCircle };

export default function NewEntry() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { themeStyles } = useTheme();
  const { updateStreak } = useJournalEntry();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({ type: "normal", summary: "", distribution: null });
  const [apiStatus, setApiStatus] = useState("connecting");
  const [selectedMoods, setSelectedMoods] = useState([]);
  const initialMood = searchParams.get("mood") || null;
  const [selectedMoodIds, setSelectedMoodIds] = useState(initialMood ? [initialMood] : []);

  const TUNNEL_URL = (import.meta.env.VITE_API_TUNNEL_URL || import.meta.env.VITE_API_NGROK_URL || "") + "/analyze";
  const LOCAL_URL = import.meta.env.VITE_API_LOCAL_URL ? `${import.meta.env.VITE_API_LOCAL_URL}/analyze` : "http://127.0.0.1:8000/analyze";

  const getApiUrls = () => {
    const urls = [LOCAL_URL];
    if (TUNNEL_URL) urls.push(TUNNEL_URL);
    return urls;
  };

  const checkApiStatusOnce = async () => {
    const urls = getApiUrls();
    for (const url of urls) {
      const isTunnel = url.includes("trycloudflare") || url.includes("ngrok");
      const timeout = isTunnel ? 5000 : 2000;
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const headers = url.includes("ngrok") ? { "ngrok-skip-browser-warning": "true" } : {};
        const res = await fetch(url, { signal: controller.signal, headers });
        clearTimeout(id);
        if (res.ok || res.status === 404) { setApiStatus("local"); return; }
      } catch (_e) {}
    }
    setApiStatus("offline");
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    const draft = localStorage.getItem("entry_draft");
    if (draft) setText(draft);
    checkApiStatusOnce();
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const saveDraft = (val) => {
    if (val.length <= MAX_CHARS) { setText(val); localStorage.setItem("entry_draft", val); }
  };

  const handleSave = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const moodIdToName = { excelente: "Excelente", feliz: "Feliz", agradecido: "Agradecido", sorpresa: "Sorpresa", neutral: "Neutral", enojo: "Enojo", ansiedad: "Ansiedad", miedo: "Miedo", triste: "Triste", asco: "Asco", crisis: "Crisis" };
      let aiData = { mood: "Neutral", score: 0, requires_help: false, summary: "", emotions_distribution: null };

      if (!isOffline) {
        const urls = getApiUrls();
        let connected = false;
        for (const url of urls) {
          if (connected) break;
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), url.includes("render.com") ? 30000 : 5000);
            const response = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json", ...(url.includes("ngrok") ? { "ngrok-skip-browser-warning": "true" } : {}), ...(url.includes("trycloudflare") ? { "cf-access-token": "" } : {}) },
              body: JSON.stringify({ text, selected_moods: selectedMoodIds.map(id => moodIdToName[id] || id) }),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (response.ok) { aiData = await response.json(); connected = true; setApiStatus(url.includes("render.com") ? "cloud" : "local"); }
          } catch (_err) {}
        }
        if (!connected) setApiStatus("offline");
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { mood, score, requires_help, summary, emotions_distribution } = aiData;
      const finalSelectedMoods = aiData.selected_moods || selectedMoodIds.map(id => moodIdToName[id] || id);

      let { error: entryError } = await supabase.from("entries").insert([
        { user_id: user.id, text, mood, score, distribution: emotions_distribution, selected_moods: finalSelectedMoods },
      ]);

      if (entryError && entryError.message?.includes("distribution")) {
        const fallback = await supabase.from("entries").insert([{ user_id: user.id, text, mood, score, selected_moods: finalSelectedMoods }]);
        entryError = fallback.error;
      }
      if (entryError) throw entryError;

      await updateStreak(user.id);
      localStorage.removeItem("entry_draft");

      setModalData({
        type: requires_help ? "crisis" : "normal",
        summary: isOffline ? "Guardado localmente (Modo Offline)" : summary,
        distribution: emotions_distribution,
        primaryMood: mood,
        selectedMoods: aiData.selected_moods || finalSelectedMoods,
      });
      setModalVisible(true);
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  const toggleMood = (id) => {
    setSelectedMoodIds(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };
  const selectedMoodObjs = selectedMoodIds.map(id => MOODS.find(m => m.id === id)).filter(Boolean);

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto pb-24 relative px-4 lg:px-0">
      <header className="flex items-center gap-8 mb-12">
        <button onClick={() => navigate(-1)} className="w-14 h-14 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 dark:border-slate-800 shadow-xl hover:scale-110 transition-transform dark:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">Diario de Almas</p>
          <h1 className="text-5xl font-black tracking-tight dark:text-white leading-none">Nueva Entrada</h1>
        </div>
      </header>

      <section className="mb-12">
        <div className="flex gap-4 overflow-x-auto pb-8 px-2 snap-x">
          {MOODS.map((mood) => {
            const Icon = ICON_MAP[mood.icon.name] || HelpCircle;
            const isSelected = selectedMoodIds.includes(mood.id);
            return (
              <button
                key={mood.id}
                onClick={() => toggleMood(mood.id)}
                className={`flex-shrink-0 snap-center flex flex-col items-center gap-4 p-6 rounded-[2.5rem] border-2 transition-all duration-500 group overflow-hidden w-28 h-40 ${isSelected ? "bg-slate-950 border-indigo-500 scale-110 shadow-2xl" : "bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-transparent shadow-xl"}`}
              >
                <div className={`absolute -top-10 -right-10 w-20 h-20 blur-3xl opacity-0 group-hover:opacity-30 transition-opacity ${isSelected ? "opacity-40" : ""}`} style={{ backgroundColor: mood.color }} />
                <div className="w-12 h-12 rounded-[1.2rem] flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:rotate-12" style={{ backgroundColor: mood.color }}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-wider text-center ${isSelected ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>
                  {mood.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="space-y-8">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-500 rounded-[3.5rem] blur opacity-10 group-focus-within:opacity-30 transition-opacity" />
          <textarea
            value={text}
            onChange={(e) => saveDraft(e.target.value)}
            placeholder="¿Qué frecuencias estás captando hoy?..."
            maxLength={MAX_CHARS}
            className="relative w-full h-[32rem] p-12 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] border border-white/20 dark:border-slate-800 outline-none text-2xl font-medium tracking-tight text-slate-800 dark:text-white resize-none shadow-2xl transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
          />
          <div className="absolute bottom-10 right-10 flex items-center gap-3 py-3 px-5 bg-white dark:bg-slate-950 rounded-full shadow-lg border border-slate-100 dark:border-slate-800 pointer-events-none">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">IA Activa</span>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading || !text.trim()}
          className="group relative w-full h-24 bg-slate-950 dark:bg-white disabled:opacity-50 disabled:cursor-not-allowed rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(255,255,255,0.05)] transition-all active:scale-95 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-fuchsia-500 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity" />
          {loading ? (
            <div className="flex items-center justify-center gap-4 relative z-10">
              <Loader2 className="w-8 h-8 text-white dark:text-slate-950 animate-spin" />
              <span className="text-white dark:text-slate-950 font-black text-2xl tracking-tighter uppercase font-mono">Decodificando...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4 relative z-10">
              <span className="text-white dark:text-slate-950 font-black text-2xl tracking-tighter uppercase font-mono">Consolidar Frecuencia</span>
              <Send className="w-6 h-6 text-white dark:text-slate-950 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
            </div>
          )}
        </button>
      </div>

      <EmotionModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); navigate("/home"); }}
        type={modalData.type}
        summary={modalData.summary}
        distribution={modalData.distribution}
        primaryMood={modalData.primaryMood}
        selectedMoods={modalData.selectedMoods}
      />
    </motion.div>
  );
}
