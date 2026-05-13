import { useState, useCallback } from "react";
import { supabase } from "../services/supabase";
import { useAuth } from "./useAuth";

export const useJournalEntry = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveEntry = useCallback(
    async (entryData) => {
      if (!user) {
        setError(new Error("No user logged in"));
        return { data: null, error: new Error("No user logged in") };
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: dbError } = await supabase
          .from("entries")
          .insert([
            {
              user_id: user.id,
              text: entryData.text,
              mood: entryData.mood,
              score: entryData.score,
              distribution: entryData.distribution || null,
              requires_help: entryData.requires_help || false,
            },
          ]);

        if (dbError) throw dbError;

        await updateStreak(user.id);

        return { data, error: null };
      } catch (err) {
        setError(err);
        return { data: null, error: err };
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const getEntries = useCallback(
    async (options = {}) => {
      if (!user) {
        setError(new Error("No user logged in"));
        return { data: [], error: new Error("No user logged in") };
      }

      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from("entries")
          .select("*")
          .eq("user_id", user.id);

        if (options.limit) query = query.limit(options.limit);
        if (options.startDate) query = query.gte("created_at", options.startDate);
        if (options.endDate) query = query.lte("created_at", options.endDate);
        if (options.orderBy)
          query = query.order(options.orderBy, {
            ascending: options.ascending !== false,
          });

        const { data, error: dbError } = await query;

        if (dbError) throw dbError;

        return { data: data || [], error: null };
      } catch (err) {
        setError(err);
        return { data: [], error: err };
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const updateStreak = useCallback(async (userId) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("streak, last_entry_at")
        .eq("id", userId)
        .single();

      const now = new Date();
      const today = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).getTime();
      let newStreak = 1;

      if (profile?.last_entry_at) {
        const lastDate = new Date(profile.last_entry_at);
        const lastTime = new Date(
          lastDate.getFullYear(),
          lastDate.getMonth(),
          lastDate.getDate()
        ).getTime();
        const diffDays = (today - lastTime) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) newStreak = (profile.streak || 0) + 1;
        else if (diffDays === 0) newStreak = profile.streak || 1;
      }

      await supabase
        .from("profiles")
        .update({ streak: newStreak, last_entry_at: now.toISOString() })
        .eq("id", userId);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error updating streak:", error);
    }
  }, []);

  return {
    saveEntry,
    getEntries,
    updateStreak,
    loading,
    error,
  };
};
