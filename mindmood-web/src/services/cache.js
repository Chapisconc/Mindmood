const CACHE_VERSION = "v1";

export const cacheKeys = {
  homeData: (userId) => `home_data_${CACHE_VERSION}_${userId}`,
  historyEntries: (userId) => `history_entries_${CACHE_VERSION}_${userId}`,
  lastMood: (userId) => `last_mood_${CACHE_VERSION}_${userId}`,
};

export async function getCachedData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function setCachedData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export async function clearUserCache(userId) {
  try {
    const keys = [
      cacheKeys.homeData(userId),
      cacheKeys.historyEntries(userId),
      cacheKeys.lastMood(userId),
    ];
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
}
