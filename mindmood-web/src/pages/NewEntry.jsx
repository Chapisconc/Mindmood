import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CloudOff } from "lucide-react";
import { supabase } from "../services/supabase";
import { useTheme } from "../theme/ThemeContext";
import Icon from "../components/Icon";
import EmotionModal from "../components/EmotionModal";
import AppButton from "../components/AppButton";

const MAX_CHARS = 2000;

export default function NewEntry() {
  const navigate = useNavigate();
  const { themeStyles } = useTheme();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({ type: "normal", summary: "", distribution: null });
  const [apiStatus, setApiStatus] = useState("connecting");

  const TUNNEL_URL = (import.meta.env.VITE_API_TUNNEL_URL || import.meta.env.VITE_API_NGROK_URL || "") + "/analyze";
  const LOCAL_URL = import.meta.env.VITE_API_LOCAL_URL
    ? `${import.meta.env.VITE_API_LOCAL_URL}/analyze`
    : "http://127.0.0.1:8000/analyze";

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
        if (res.ok || res.status === 404) {
          setApiStatus("local");
          return;
        }
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
    if (val.length <= MAX_CHARS) {
      setText(val);
      localStorage.setItem("entry_draft", val);
    }
  };

  const updateStreak = async (userId) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("streak, last_entry_at")
      .eq("id", userId)
      .single();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let newStreak = 1;
    if (profile?.last_entry_at) {
      const lastDate = new Date(profile.last_entry_at);
      const lastTime = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
      const diffDays = (today - lastTime) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) newStreak = (profile.streak || 0) + 1;
      else if (diffDays === 0) newStreak = profile.streak || 1;
    }
    await supabase.from("profiles").update({ streak: newStreak, last_entry_at: now.toISOString() }).eq("id", userId);
  };

  const handleSave = async () => {
    if (!text.trim()) return;

    setLoading(true);
    try {
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
              headers: {
                "Content-Type": "application/json",
                ...(url.includes("ngrok") ? { "ngrok-skip-browser-warning": "true" } : {}),
                ...(url.includes("trycloudflare") ? { "cf-access-token": "" } : {}),
              },
              body: JSON.stringify({ text }),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (response.ok) {
              aiData = await response.json();
              connected = true;
              setApiStatus(url.includes("render.com") ? "cloud" : "local");
            }
          } catch (_err) {}
        }
        if (!connected) setApiStatus("offline");
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { mood, score, requires_help, summary, emotions_distribution } = aiData;

      let { error: entryError } = await supabase.from("entries").insert([
        { user_id: user.id, text, mood, score, distribution: emotions_distribution },
      ]);

      if (entryError && entryError.message?.includes("distribution")) {
        const fallback = await supabase.from("entries").insert([{ user_id: user.id, text, mood, score }]);
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
      });
      setModalVisible(true);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const charProgress = text.length / MAX_CHARS;
  const charColor = charProgress > 0.9 ? "#EF4444" : charProgress > 0.7 ? "#F59E0B" : "#8B5CF6";

  const getStatusColor = () => {
    switch (apiStatus) {
      case "local": return "#10B981";
      case "connecting": return "#F59E0B";
      default: return "#EF4444";
    }
  };

  const getStatusLabel = () => {
    switch (apiStatus) {
      case "local": return "⚡ Local";
      case "connecting": return "⏳ Conectando";
      default: return "⛔ Offline";
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: themeStyles.background }}>
      <div className="max-w-lg mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/home")}
                className="bg-transparent border-none cursor-pointer"
              >
                <ArrowLeft size={28} color={themeStyles.secondaryText} />
              </button>
              <h1
                className="text-[30px] font-black tracking-tight"
                style={{ color: themeStyles.text }}
              >
                Reflexión del Día
              </h1>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
              style={{
                backgroundColor: themeStyles.card,
                borderColor: themeStyles.border,
                boxShadow: `0 4px 10px ${themeStyles.shadow}`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: getStatusColor() }}
              />
              <span
                className="text-[11px] font-extrabold uppercase tracking-[0.5px]"
                style={{ color: themeStyles.secondaryText }}
              >
                {getStatusLabel()}
              </span>
            </div>
          </div>

          <p
            className="text-base mb-6 leading-6 font-medium"
            style={{ color: themeStyles.secondaryText }}
          >
            Escribe libremente. Tu diario es un espacio seguro para descargar tu mente.
          </p>

          {isOffline && (
            <div
              className="flex items-center p-4 rounded-xl border mb-5"
              style={{
                backgroundColor: themeStyles.error + "15",
                borderColor: themeStyles.error + "30",
              }}
            >
              <CloudOff size={20} color="#EF4444" />
              <p
                className="text-sm font-semibold ml-3"
                style={{ color: themeStyles.error }}
              >
                Sin conexión — se guardará localmente.
              </p>
            </div>
          )}

          <div className="mb-2">
            <textarea
              className="w-full rounded-3xl p-6 text-[17px] leading-7 border-[1.5px] outline-none resize-none"
              style={{
                backgroundColor: themeStyles.card,
                color: themeStyles.text,
                borderColor: themeStyles.border,
                minHeight: 340,
                boxShadow: `0 8px 20px ${themeStyles.shadow}`,
              }}
              placeholder="Hoy mi mente se siente..."
              value={text}
              onChange={(e) => saveDraft(e.target.value)}
              maxLength={MAX_CHARS}
            />
            <div className="flex items-center justify-between px-2 mt-3">
              <span
                className="text-[13px] font-extrabold"
                style={{ color: charColor }}
              >
                {text.length}/{MAX_CHARS}
              </span>
              <div
                className="flex-1 h-1 rounded ml-4"
                style={{ backgroundColor: themeStyles.border }}
              >
                <div
                  className="h-1 rounded transition-all duration-300"
                  style={{
                    width: `${Math.min(charProgress * 100, 100)}%`,
                    backgroundColor: charColor,
                  }}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 flex flex-col items-center">
              <div
                className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
                style={{ borderColor: `${themeStyles.accent}40`, borderTopColor: themeStyles.accent }}
              />
              <p
                className="mt-3 text-[15px] font-bold"
                style={{ color: themeStyles.secondaryText }}
              >
                Analizando emociones...
              </p>
            </div>
          ) : (
            <div className="mt-7">
              <AppButton
                title="✦ Guardar en la Bóveda"
                onClick={handleSave}
                loading={false}
              />
            </div>
          )}
        </motion.div>
      </div>

      <EmotionModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          navigate("/home");
        }}
        type={modalData.type}
        summary={modalData.summary}
        distribution={modalData.distribution}
        primaryMood={modalData.primaryMood}
      />
    </div>
  );
}
