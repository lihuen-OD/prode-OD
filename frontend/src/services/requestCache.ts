type Entry<T> = { promise: Promise<T> | null; data?: T; expiresAt: number };

const store = new Map<string, Entry<any>>();

export function withCache<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const entry = store.get(key);

  if (entry?.promise) {
    return entry.promise;
  }

  if (entry && entry.expiresAt > now && entry.data !== undefined) {
    return Promise.resolve(entry.data);
  }

  const promise = fetcher()
    .then(data => {
      store.set(key, { promise: null, data, expiresAt: Date.now() + ttlMs });
      return data;
    })
    .catch(err => {
      store.delete(key);
      throw err;
    });

  store.set(key, { promise, expiresAt: 0 });
  return promise;
}

export function invalidateCache(key: string): void {
  store.delete(key);
}

export function clearCache(): void {
  store.clear();
}
