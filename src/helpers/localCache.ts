type CacheEnvelope<T> = {
  value: T;
  expiresAt: number;
};

const isBrowser = () => typeof window !== 'undefined' && !!window.localStorage;

export const readLocalCache = <T>(key: string): T | null => {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.expiresAt !== 'number') {
      window.localStorage.removeItem(key);
      return null;
    }

    if (parsed.expiresAt <= Date.now()) {
      window.localStorage.removeItem(key);
      return null;
    }

    return parsed.value;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
};

export const writeLocalCache = <T>(key: string, value: T, ttlSeconds: number) => {
  if (!isBrowser() || ttlSeconds <= 0) {
    return;
  }

  const payload: CacheEnvelope<T> = {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  };

  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore localStorage quota and serialization failures.
  }
};
