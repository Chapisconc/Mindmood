import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../services/supabase";

let globalUser = null;
let globalProfile = null;
let fetchPromise = null;
const sessionListeners = new Set();

export const subscribeToSession = (callback) => {
  sessionListeners.add(callback);
  return () => sessionListeners.delete(callback);
};

const notifyListeners = (user, profile) => {
  globalUser = user;
  globalProfile = profile;
  sessionListeners.forEach((cb) => cb(user, profile));
};

async function fetchProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      notifyListeners(user, profile || null);
    } else {
      notifyListeners(null, null);
    }
  } catch {
    notifyListeners(null, null);
  }
}

export const useAuth = () => {
  const [user, setUser] = useState(globalUser);
  const [profile, setProfile] = useState(globalProfile);
  const [loading, setLoading] = useState(true);
  const initRef = useRef(false);

  const fetchUserData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && globalUser && globalProfile) {
      setUser(globalUser);
      setProfile(globalProfile);
      setLoading(false);
      return;
    }
    if (!fetchPromise) {
      fetchPromise = fetchProfile();
    }
    try {
      await fetchPromise;
    } finally {
      fetchPromise = null;
      setUser(globalUser);
      setProfile(globalProfile);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "INITIAL_SESSION") {
        if (session?.user) {
          setUser(session.user);
          fetchUserData(true);
        } else {
          notifyListeners(null, null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } else {
        fetchUserData(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
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
