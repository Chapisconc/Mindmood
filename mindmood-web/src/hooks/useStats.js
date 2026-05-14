// ============================================================
// Hook personalizado de estadísticas (useStats)
// Proyecto: MindMood - Diario Inteligente
// Autor: RAMIREZ RUIZ, CRISTOPHER SAID
// Propósito: Obtener las entradas de los últimos 7 días y
//   procesarlas en formatos listos para gráficas (línea, pastel,
//   radar), incluyendo cálculo de emoción dominante y conteos.
// ============================================================

// --- Importaciones de React ---
import { useState, useEffect, useMemo } from "react";
// --- Cliente Supabase para consultas ---
import { supabase } from "../services/supabase";
// --- Hook de autenticación ---
import { useAuth } from "./useAuth";
// --- Mapa de emociones (colores, iconos, nombres) ---
import { EMOTIONS_MAP, getEmotionByName } from "../theme/emotions";

// ================================================================
// useStats
// Hook que expone las entradas semanales y estadísticas procesadas
// para las visualizaciones del panel de inicio.
// Retorna: { entries, loading, error, stats, refresh }
// ================================================================
export const useStats = () => {
  // Obtener usuario y estado de carga de autenticación
  const { user, loading: authLoading } = useAuth();
  // Arreglo de entradas del diario (últimos 7 días)
  const [entries, setEntries] = useState([]);
  // Indicador de carga de datos
  const [loading, setLoading] = useState(true);
  // Último error ocurrido (o null)
  const [error, setError] = useState(null);

  // ==============================================================
  // Efecto principal: cargar entradas al montar o al cambiar usuario
  // Dependencias: [user, authLoading]
  // Efectos:  SELECT en Supabase (tabla "entries", últimos 7 días)
  // ==============================================================
  useEffect(() => {
    // Esperar a que termine la carga de autenticación
    if (authLoading) return;

    // Si no hay usuario autenticado, marcar error
    if (!user) {
      setError(new Error("No user logged in"));
      setLoading(false);
      setEntries([]);
      return;
    }

    // Función interna para cargar el historial
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        // Calcular fecha: hace 7 días desde ahora
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        // Consultar entradas del usuario desde esa fecha
        const { data, error: dbError } = await supabase
          .from("entries")
          .select("*")                             // Todas las columnas
          .eq("user_id", user.id)                  // Solo del usuario actual
          .gte("created_at", lastWeek.toISOString()) // Desde hace 7 días
          .order("created_at", { ascending: true }); // Orden cronológico

        if (dbError) throw dbError;
        setEntries(data || []); // Guardar en estado (o arreglo vacío)
      } catch (err) {
        setError(err);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, authLoading]); // Se re-ejecuta si cambia user o authLoading

  // ==============================================================
  // processedStats (memorizado)
  // Procesa las entradas sin procesar en estructuras de datos
  // listas para gráficas. Solo se recalcula cuando cambia 'entries'.
  // Retorna: { totalCount, lineData, pieData, radarData, maxCount, dominant }
  //          o null si no hay entradas.
  // ==============================================================
  const processedStats = useMemo(() => {
    if (entries.length === 0) return null; // Sin datos, sin estadísticas

    // --- Conteo total de entradas ---
    const totalCount = entries.length;

    // --- Datos para gráfica de línea (evolución diaria) ---
    // Mapea cada entrada a un punto { valor, etiqueta del día, color, texto }
    const lineData = entries.map((e) => {
      const d = new Date(e.created_at);                 // Fecha de la entrada
      const emotion = getEmotionByName(e.mood);         // Objeto emoción asociada
      const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      return {
        value: e.score,                                 // Puntaje numérico en eje Y
        label: days[d.getDay()],                        // Día de la semana abreviado (eje X)
        dataPointColor: emotion.color,                  // Color del punto en gráfica
        dataPointText: e.mood,                          // Texto descriptivo al hacer hover
        mood: e.mood,                                   // Nombre de la emoción
      };
    });

    // --- Conteo de frecuencias por emoción ---
    // { "happy": 3, "sad": 1, ... }
    const counts = {};
    entries.forEach((e) => (counts[e.mood] = (counts[e.mood] || 0) + 1));

    // --- Datos para gráfica de pastel (distribución de emociones) ---
    // Filtra emociones con count > 0, asigna color y nombre
    const pieData = EMOTIONS_MAP.map((emo) => {
      const count = counts[emo.name] || 0;
      if (count === 0) return null; // Emociones sin ocurrencias se excluyen
      return {
        value: count,            // Cantidad de veces que apareció
        color: emo.color,        // Color asignado a esta emoción
        text: "",                // Texto vacío (se muestra emotionName)
        emotionName: emo.name,   // Nombre visible
        valueCount: count,       // Repetido para compatibilidad con gráficas
      };
    }).filter(Boolean); // Eliminar entradas null (emociones sin datos)

    // --- Emoción dominante (la que más aparece) ---
    // Si hay datos, encontrar el nombre con el conteo más alto
    const dominantName =
      Object.values(counts).length > 0
        ? Object.entries(counts).reduce((a, b) => (b[1] > a[1] ? b : a))[0]
        : "Neutral"; // Fallback si no hay entradas
    const dominant = getEmotionByName(dominantName); // Objeto emoción completa

    // --- Datos para gráfica de radar (comparativa por emoción) ---
    const radarData = EMOTIONS_MAP.map((emo) => ({
      label: emo.name,       // Nombre de la emoción
      value: counts[emo.name] || 0, // Frecuencia (0 si no aparece)
      icon: emo.icon,        // Icono representativo
    }));

    // Valor máximo en radarData (para escalar el gráfico, mínimo 1)
    const maxCount = Math.max(...radarData.map((d) => d.value), 1);

    return { totalCount, lineData, pieData, radarData, maxCount, dominant };
  }, [entries]); // Solo se recalcula si cambia el arreglo de entradas

  // ==============================================================
  // refresh
  // Fuerza una recarga manual de las entradas desde Supabase.
  // Útil después de crear una nueva entrada para actualizar stats.
  // Efectos:  SELECT en Supabase, actualiza estado entries
  // ==============================================================
  const refresh = async () => {
    if (!user || authLoading) return; // No recargar si no hay usuario

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

  // === API pública del hook ===
  return {
    entries,                     // Arreglo de entradas en bruto (últimos 7 días)
    loading: loading || authLoading, // Combinar carga de stats + auth
    error,                       // Último error (o null)
    stats: processedStats,       // Datos procesados para gráficas (o null)
    refresh,                     // Función para recargar datos manualmente
  };
};