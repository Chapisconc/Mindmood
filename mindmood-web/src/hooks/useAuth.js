import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../services/supabase";

let globalSession = null;
let globalProfile = null;
const sessionListeners = new Set();

export const subscribeToSession = (callback) => {
  sessionListeners.add(callback);
  return () => sessionListeners.delete(callback);
};

const notifyListeners = (session, profile) => {
  globalSession = session;
  globalProfile = profile;
  sessionListeners.forEach((cb) => cb(session, profile));
};

export const useAuth = () => {
  const [user, setUser] = useState(globalSession);
  const [profile, setProfile] = useState(globalProfile);
  const [loading, setLoading] = useState(!globalSession);
  const initRef = useRef(false);

  const fetchUserData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && globalSession) {
      setUser(globalSession);
      setProfile(globalProfile);
      setLoading(false);
      return;
    }
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        notifyListeners(user, profile || null);
        setUser(user);
        setProfile(profile || null);
      } else {
        notifyListeners(null, null);
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Auth fetch error:", error);
      notifyListeners(null, null);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    setLoading(true);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "INITIAL_SESSION") {
        if (session?.user) {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .single();
            notifyListeners(session.user, profile || null);
            setUser(session.user);
            setProfile(profile || null);
          } catch {
            notifyListeners(session.user, null);
            setUser(session.user);
            setProfile(null);
          }
        } else {
          notifyListeners(null, null);
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      } else {
        await fetchUserData(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Sign out error:", error);
    }
    setUser(null);
    setProfile(null);
  }, []);

  const updateProfile = useCallback(
    async (updates) => {
      try {
        if (!user) throw new Error("No user logged in");

        const { data, error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", user.id);

        if (error) throw error;

        setProfile((prev) => ({ ...prev, ...updates }));
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    [user]
  );

  return {
    user,
    profile,
    loading,
    signOut,
    updateProfile,
    refresh: () => fetchUserData(true),
  };
};
