export function createLocalStorageCache(prefix = 'translator') {
  return {
    async get(key) {
      try {
        const value = localStorage.getItem(`${prefix}:${key}`);
        return value ? JSON.parse(value) : null;
      } catch {
        return null;
      }
    },

    async set(key, value) {
      try {
        localStorage.setItem(`${prefix}:${key}`, JSON.stringify(value));
      } catch {
        // ignore quota issues
      }
    },

    async remove(key) {
      try {
        localStorage.removeItem(`${prefix}:${key}`);
      } catch {
        // ignore failures
      }
    }
  };
}
