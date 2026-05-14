import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../services/supabase";
import { useAuth } from "./useAuth";
import { EMOTIONS_MAP, getEmotionByName } from "../theme/emotions";

export const useStats = () => {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (authLoading || fetched.current) return;
    fetched.current = true;

    if (!user) {
      setError(new Error("No user logged in"));
      setLoading(false);
      setEntries([]);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const { data, error: dbError } = await supabase
          .from("entries")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", lastWeek.toISOString())
          .order("created_at", { ascending: true });

        if (dbError) throw dbError;
        setEntries(data || []);
      } catch (err) {
        setError(err);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, authLoading]);

  const processedStats = useMemo(() => {
    if (entries.length === 0) return null;

    const totalCount = entries.length;
    const lineData = entries.map((e) => {
      const d = new Date(e.created_at);
      const emotion = getEmotionByName(e.mood);
      const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      return {
        value: e.score,
        label: days[d.getDay()],
        dataPointColor: emotion.color,
        dataPointText: e.mood,
        mood: e.mood,
      };
    });

    const counts = {};
    entries.forEach((e) => (counts[e.mood] = (counts[e.mood] || 0) + 1));

    const pieData = EMOTIONS_MAP.map((emo) => {
      const count = counts[emo.name] || 0;
      if (count === 0) return null;
      return {
        value: count,
        color: emo.color,
        text: "",
        emotionName: emo.name,
        valueCount: count,
      };
    }).filter(Boolean);

    const dominantName =
      Object.values(counts).length > 0
        ? Object.entries(counts).reduce((a, b) => (b[1] > a[1] ? b : a))[0]
        : "Neutral";
    const dominant = getEmotionByName(dominantName);

    const radarData = EMOTIONS_MAP.map((emo) => ({
      label: emo.name,
      value: counts[emo.name] || 0,
      icon: emo.icon,
    }));

    const maxCount = Math.max(...radarData.map((d) => d.value), 1);

    return { totalCount, lineData, pieData, radarData, maxCount, dominant };
  }, [entries]);

  const refresh = async () => {
    if (!user || authLoading) return;

    setLoading(true);
    try {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const { data, error: dbError } = await supabase
        .from("entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", lastWeek.toISOString())
        .order("created_at", { ascending: true });

      if (dbError) throw dbError;
      setEntries(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    entries,
    loading: loading || authLoading,
    error,
    stats: processedStats,
    refresh,
  };
};