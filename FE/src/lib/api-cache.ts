const store = new Map<string, { data: unknown; expires: number }>();
const inflight = new Map<string, Promise<unknown>>();

export function getCached<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit || hit.expires < Date.now()) {
    if (hit) store.delete(key);
    return null;
  }
  return hit.data as T;
}

export function setCached<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, expires: Date.now() + ttlMs });
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** Gộp request GET trùng nhau đang chạy song song */
export function dedupeRequest<T>(key: string, run: () => Promise<T>): Promise<T> {
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;
  const promise = run().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}
