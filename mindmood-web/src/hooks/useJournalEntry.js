// ============================================================
// Hook personalizado de entradas del diario (useJournalEntry)
// Proyecto: MindMood - Diario Inteligente
// Autor: RAMIREZ RUIZ, CRISTOPHER SAID
// Propósito: Abstraer las operaciones CRUD sobre la tabla
//   "entries" de Supabase, incluyendo guardado de nuevas
//   entradas, consulta del historial, y actualización de
//   la racha (streak) de días consecutivos.
// ============================================================

// --- Importaciones de React ---
import { useState, useCallback } from "react";
// --- Cliente Supabase para operaciones de BD ---
import { supabase } from "../services/supabase";
// --- Hook de autenticación (necesitamos el user actual) ---
import { useAuth } from "./useAuth";

// ================================================================
// useJournalEntry
// Hook que expone funciones para crear y leer entradas del diario,
// más el manejo automático de la racha de días consecutivos.
// Retorna: { saveEntry, getEntries, updateStreak, loading, error }
// ================================================================
export const useJournalEntry = () => {
  // Obtener el usuario actual desde el hook de autenticación
  const { user } = useAuth();
  // Estado de carga: true mientras hay una operación en curso
  const [loading, setLoading] = useState(false);
  // Estado de error: almacena el último error ocurrido (o null)
  const [error, setError] = useState(null);

  // ==============================================================
  // saveEntry
  // Guarda una nueva entrada en el diario del usuario y actualiza
  // automáticamente la racha de días consecutivos.
  // Parámetros:
  //   entryData — Objeto con { text, mood, score, requires_help? }
  // Retorna:  { data, error }
  // Efectos:  INSERT en tabla "entries", UPDATE en "profiles" (streak)
  // ==============================================================
  const saveEntry = useCallback(
    async (entryData) => {
      // Validar que el usuario esté autenticado
      if (!user) {
        setError(new Error("No user logged in"));
        return { data: null, error: new Error("No user logged in") };
      }

      setLoading(true);  // Activar indicador de carga
      setError(null);    // Limpiar errores previos

      try {
        // Insertar la nueva entrada en la tabla "entries"
        const { data, error: dbError } = await supabase
          .from("entries")
          .insert([
            {
              user_id: user.id,                // Relacionar con el usuario
              text: entryData.text,             // Contenido textual de la entrada
              mood: entryData.mood,             // Estado de ánimo (ej: "happy", "sad")
              score: entryData.score,           // Puntuación numérica (0-100)
              requires_help: entryData.requires_help || false, // Solicitud de ayuda (default false)
            },
          ]);

        if (dbError) throw dbError;

        // Después de guardar, actualizar la racha del usuario
        await updateStreak(user.id);

        return { data, error: null };
      } catch (err) {
        setError(err);
        return { data: null, error: err };
      } finally {
        setLoading(false); // Desactivar indicador de carga siempre
      }
    },
    [user] // Solo se recrea si cambia el usuario
  );

  // ==============================================================
  // getEntries
  // Consulta las entradas del diario con filtros opcionales.
  // Parámetros:
  //   options — Objeto con filtros:
  //     limit     — Número máximo de resultados (number)
  //     startDate — Fecha ISO desde (string)
  //     endDate   — Fecha ISO hasta (string)
  //     orderBy   — Campo para ordenar (string, ej: "created_at")
  //     ascending — Booleano para orden ascendente (default false)
  // Retorna:  { data: Entry[], error }
  // Efectos:  SELECT en tabla "entries" con filtros dinámicos
  // ==============================================================
  const getEntries = useCallback(
    async (options = {}) => {
      // Validar autenticación
      if (!user) {
        setError(new Error("No user logged in"));
        return { data: [], error: new Error("No user logged in") };
      }

      setLoading(true);
      setError(null);

      try {
        // Construir la consulta base: todas las entradas del usuario
        let query = supabase
          .from("entries")
          .select("*")                    // Todas las columnas
          .eq("user_id", user.id);        // Solo del usuario actual

        // Aplicar filtros opcionales si están presentes
        if (options.limit) query = query.limit(options.limit);              // Limitar resultados
        if (options.startDate) query = query.gte("created_at", options.startDate); // Desde fecha
        if (options.endDate) query = query.lte("created_at", options.endDate);     // Hasta fecha
        if (options.orderBy)
          query = query.order(options.orderBy, {                           // Ordenar por campo
            ascending: options.ascending !== false,  // Ascendente por defecto (true)
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

  // ==============================================================
  // updateStreak
  // Calcula y actualiza la racha de días consecutivos del usuario.
  // Lógica:
  //   - Si la última entrada fue ayer → streak + 1
  //   - Si la última entrada fue hoy   → mantener streak
  //   - Si la última entrada fue antes  → reiniciar a 1
  // Parámetros:
  //   userId — UUID del usuario a actualizar
  // Retorna:  void (falla silenciosamente en desarrollo)
  // Efectos:  SELECT + UPDATE en tabla "profiles"
  // ==============================================================
  const updateStreak = useCallback(async (userId) => {
    try {
      // Obtener la racha actual y la fecha de la última entrada
      const { data: profile } = await supabase
        .from("profiles")
        .select("streak, last_entry_at")   // Solo estas columnas
        .eq("id", userId)                  // Perfil del usuario
        .single();                         // Un solo resultado (o null)

      const now = new Date();
      // Normalizar a medianoche para comparar solo fechas (sin hora)
      const today = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).getTime();
      let newStreak = 1; // Por defecto, racha de 1 (primera entrada o reinicio)

      if (profile?.last_entry_at) {
        // Si hay una fecha previa, calcular diferencia en días
        const lastDate = new Date(profile.last_entry_at);
        const lastTime = new Date(
          lastDate.getFullYear(),
          lastDate.getMonth(),
          lastDate.getDate()
        ).getTime();
        const diffDays = Math.round((today - lastTime) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) newStreak = (profile.streak || 0) + 1; // Día consecutivo
        else if (diffDays === 0) newStreak = profile.streak || 1;  // Mismo día, mantener
        // Si diffDays > 1, newStreak queda en 1 (racha rota)
      }

      // Actualizar la racha y la fecha de última entrada
      await supabase
        .from("profiles")
        .update({ streak: newStreak, last_entry_at: now.toISOString() })
        .eq("id", userId);
    } catch (error) {
      // Solo mostrar error en desarrollo para no molestar al usuario
      if (import.meta.env.DEV) console.error("Error actualizando racha:", error);
    }
  }, []); // Sin dependencias: función pura, recibe userId por parámetro

  // === API pública del hook ===
  return {
    saveEntry,     // Función para crear una nueva entrada
    getEntries,    // Función para consultar entradas con filtros
    updateStreak,  // Función para forzar actualización de racha
    loading,       // Booleano: true durante operaciones de BD
    error,         // Último error (o null)
  };
};
