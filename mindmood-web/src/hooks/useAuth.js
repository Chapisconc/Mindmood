// ============================================================
// Hook personalizado de autenticación (useAuth)
// Proyecto: MindMood - Diario Inteligente
// Autor: RAMIREZ RUIZ, CRISTOPHER SAID
// Propósito: Gestionar el estado de autenticación del usuario,
//   incluyendo sesión, perfil, carga inicial y cierre de sesión.
//   Implementa un patrón singleton a nivel de módulo para que
//   múltiples componentes compartan la misma sesión sin llamadas
//   redundantes a Supabase.
// ============================================================

// --- Importaciones de React ---
import { useState, useEffect, useCallback, useRef } from "react";
// --- Importar el cliente Supabase (instancia única) ---
import { supabase } from "../services/supabase";

// === Variables de módulo (singleton) ===
// Almacenan la sesión globalmente para que todos los hooks
// compartan el mismo estado sin props drilling ni context.
let globalUser = null;      // Objeto User de Supabase (o null)
let globalProfile = null;   // Perfil desde tabla "profiles" (o null)
let fetchPromise = null;    // Promesa única para evitar múltiples fetch simultáneos
const sessionListeners = new Set(); // Conjunto de callbacks para notificar cambios de sesión

// ================================================================
// subscribeToSession (exportada)
// Permite a componentes externos suscribirse a cambios de sesión.
// Parámetros:
//   callback — función (user, profile) => void
// Retorna:   función cleanup para desuscribirse
// Se exporta para que componentes fuera del hook (e.g. App.jsx)
// puedan reaccionar a cambios de autenticación.
// ================================================================
export const subscribeToSession = (callback) => {
  sessionListeners.add(callback);       // Agregar al set de listeners
  return () => sessionListeners.delete(callback); // Devolver función de limpieza
};

// ================================================================
// notifyListeners (privada)
// Actualiza las variables globales y notifica a todos los
// suscriptores registrados con subscribeToSession.
// Parámetros:
//   user    — Objeto user de Supabase o null
//   profile — Perfil del usuario desde "profiles" o null
// Efectos:  Recorre el Set de listeners y los invoca a todos
// ================================================================
const notifyListeners = (user, profile) => {
  globalUser = user;
  globalProfile = profile;
  sessionListeners.forEach((cb) => cb(user, profile));
};

// ================================================================
// fetchProfile (privada)
// Obtiene el usuario autenticado desde Supabase Auth y luego
// consulta su perfil en la tabla "profiles".
// Se asegura de llamar a notifyListeners en todos los casos
// (usuario logueado con perfil, logueado sin perfil, o no logueado).
// Efectos:  Llamadas a Supabase Auth + BD
// ================================================================
async function fetchProfile() {
  let user = null;
  // 1. Obtener el usuario desde el token de sesión
  try {
    const res = await supabase.auth.getUser();
    user = res.data?.user ?? null; // Extraer user o null si no hay sesión
  } catch {} // Ignorar errores de red

  if (user) {
    // 2. Si hay usuario, buscar su perfil en la tabla "profiles"
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")               // Todas las columnas del perfil
        .eq("id", user.id)         // Coincidir por UUID (id = user.id)
        .maybeSingle();            // maybeSingle: 0 o 1 resultado (no error si 0)
      notifyListeners(user, profile || null);
    } catch {
      // Si falla la consulta del perfil, notificar con profile = null
      notifyListeners(user, null);
    }
  } else {
    // 3. No hay sesión activa, notificar con todo null
    notifyListeners(null, null);
  }
}

// ================================================================
// useAuth (hook principal exportado)
// Hook que expone el estado de autenticación a los componentes.
// Retorna: { user, profile, loading, signOut, updateProfile, refresh }
// ================================================================
export const useAuth = () => {
  // --- Estado local sincronizado con variables globales ---
  const [user, setUser] = useState(globalUser);       // Objeto User actual
  const [profile, setProfile] = useState(globalProfile); // Perfil del usuario
  const [loading, setLoading] = useState(true);        // Indicador de carga inicial
  const initRef = useRef(false);                       // Evita doble inicialización en StrictMode

  // ==============================================================
  // fetchUserData
  // Carga los datos del usuario (autenticación + perfil) con
  // soporte para fuerza de recarga y deduplicación de promesas.
  // Parámetros:
  //   forceRefresh — Si true, ignora el caché global y va al servidor
  // Efectos:  Consulta a Supabase Auth + BD
  // ==============================================================
  const fetchUserData = useCallback(async (forceRefresh = false) => {
    // Si no se fuerza recarga y ya tenemos datos globales, usarlos
    if (!forceRefresh && globalUser && globalProfile) {
      setUser(globalUser);
      setProfile(globalProfile);
      setLoading(false);
      return;
    }
    // Si se fuerza o no hay promesa en curso, iniciar fetch
    if (forceRefresh || !fetchPromise) {
      fetchPromise = fetchProfile();
    }
    try {
      await fetchPromise; // Esperar a que termine la promesa global
    } finally {
      fetchPromise = null; // Liberar la promesa para futuras llamadas
      // Sincronizar estado local con las variables globales actualizadas
      setUser(globalUser);
      setProfile(globalProfile);
      setLoading(false);
    }
  }, []); // Sin dependencias: usa las variables globales del módulo

  // ==============================================================
  // Efecto de inicialización (solo se ejecuta UNA vez)
  // Suscribe el hook al evento onAuthStateChange de Supabase
  // para reaccionar a: INITIAL_SESSION, SIGNED_IN, SIGNED_OUT,
  // TOKEN_REFRESHED, USER_UPDATED.
  // Efectos:  Suscripción a Supabase Auth (se limpia al desmontar)
  // ==============================================================
  useEffect(() => {
    if (initRef.current) return; // Ya inicializado, salir
    initRef.current = true;       // Marcar como inicializado

    // Suscribirse a cambios de estado de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "INITIAL_SESSION") {
        // Evento inicial: se dispara al cargar la app
        if (session?.user) {
          setUser(session.user);
          fetchUserData(true); // Forzar la carga del perfil
        } else {
          // No hay sesión guardada
          notifyListeners(null, null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } else {
        // Cualquier otro evento (sign in, sign out, token refresh)
        fetchUserData(true);
      }
    });

    // Función de limpieza: desuscribirse al desmontar el componente
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]); // Solo depende de fetchUserData (estable)

  // ==============================================================
  // signOut
  // Cierra la sesión en Supabase y limpia el estado local.
  // Retorna:  void
  // Efectos:  Llama a supabase.auth.signOut(), limpia estado
  // ==============================================================
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut(); // Cerrar sesión en Supabase
    } catch {} // Ignorar errores de red
    // Limpiar estado local inmediatamente (no esperar respuesta)
    setUser(null);
    setProfile(null);
  }, []); // Sin dependencias: siempre estable

  // ==============================================================
  // updateProfile
  // Actualiza el perfil del usuario en la BD y sincroniza el estado.
  // Parámetros:
  //   updates — Objeto parcial con campos a actualizar (ej: nombre)
  // Retorna:  { data, error }
  // Efectos:  UPDATE en tabla "profiles" de Supabase, setProfile local
  // ==============================================================
  const updateProfile = useCallback(
    async (updates) => {
      try {
        if (!user) throw new Error("No user logged in");

        // Actualizar en la base de datos
        const { data, error } = await supabase
          .from("profiles")
          .update(updates)       // Campos a modificar
          .eq("id", user.id);    // Filtro por UUID del usuario

        if (error) throw error;

        // Fusión optimista: combinar perfil anterior con los nuevos campos
        setProfile((prev) => ({ ...prev, ...updates }));
        return { data, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    [user] // Solo cambia cuando cambia el usuario
  );

  // === API pública del hook ===
  return {
    user,           // Objeto User de Supabase o null
    profile,        // Perfil desde tabla "profiles" o null
    loading,        // Booleano: true mientras se carga la sesión inicial
    signOut,        // Función para cerrar sesión
    updateProfile,  // Función para actualizar el perfil
    refresh: () => fetchUserData(true), // Forzar recarga manual
  };
};
