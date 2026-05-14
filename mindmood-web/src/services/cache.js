// ============================================================
// Servicio de caché local para datos del usuario
// Proyecto: MindMood - Diario Inteligente
// Autor: RAMIREZ RUIZ, CRISTOPHER SAID
// Propósito: Almacenar en localStorage datos frecuentes
//   (último humor, entradas recientes) para evitar llamadas
//   innecesarias a Supabase y mejorar la experiencia offline.
// ============================================================

// === Versión del caché ===
// Incrementar este número invalida TODAS las claves previas,
// forzando una recarga desde el servidor. Útil cuando cambia
// la estructura de los datos almacenados.
const CACHE_VERSION = "v1";

// === Claves de caché ===
// Se exporta un objeto con funciones generadoras de claves.
// Cada clave incluye la versión y el userId para evitar
// colisiones entre distintos usuarios en el mismo dispositivo.
// Formato: <tipo_dato>_<version>_<userId>
// Ejemplo: home_data_v1_a1b2c3d4-...
export const cacheKeys = {
  // Datos de la pantalla de inicio (estadísticas semanales, etc.)
  homeData: (userId) => `home_data_${CACHE_VERSION}_${userId}`,
  // Lista de entradas del historial del diario
  historyEntries: (userId) => `history_entries_${CACHE_VERSION}_${userId}`,
  // Último estado de ánimo registrado (para vista rápida)
  lastMood: (userId) => `last_mood_${CACHE_VERSION}_${userId}`,
};

// ================================================================
// getCachedData
// Recupera un valor previamente almacenado en localStorage y lo
// deserializa de JSON a objeto JavaScript.
// Parámetros:
//   key — String con la clave de caché (generada por cacheKeys)
// Retorna:  El objeto parseado, o null si no existe / hay error
// Efectos:  Acceso síncrono a localStorage (envuelto en async por API)
// ================================================================
export async function getCachedData(key) {
  try {
    const data = localStorage.getItem(key);
    // Si existe, convertir JSON → objeto; si no, devolver null
    return data ? JSON.parse(data) : null;
  } catch {
    return null; // Parse error o localStorage no disponible
  }
}

// ================================================================
// setCachedData
// Almacena un valor en localStorage serializándolo a JSON.
// Parámetros:
//   key  — String con la clave de caché
//   data — Cualquier valor serializable (objeto, arreglo, etc.)
// Retorna:  void
// Efectos:  Escribe en localStorage (puede lanzar error por cuota)
// ================================================================
export async function setCachedData(key, data) {
  try {
    // Serializar a JSON antes de guardar (localStorage solo acepta strings)
    localStorage.setItem(key, JSON.stringify(data));
  } catch {} // Ignorar errores de cuota excedida silenciosamente
}

// ================================================================
// clearUserCache
// Elimina TODAS las claves de caché asociadas a un usuario.
// Útil al cerrar sesión o al forzar una recarga completa.
// Parámetros:
//   userId — UUID del usuario cuyo caché se limpiará
// Retorna:  void
// Efectos:  Elimina múltiples entradas de localStorage
// ================================================================
export async function clearUserCache(userId) {
  try {
    // Lista de todas las claves que pueden existir para este usuario
    const keys = [
      cacheKeys.homeData(userId),
      cacheKeys.historyEntries(userId),
      cacheKeys.lastMood(userId),
    ];
    // Iterar y eliminar cada una
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {} // Ignorar errores de acceso a localStorage
}
