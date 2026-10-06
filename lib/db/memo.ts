type Entry<T> = { value: T; expires: number };
const globalStore = globalThis as unknown as { __memoStore?: Map<string, Entry<unknown>> };
globalStore.__memoStore ??= new Map<string, Entry<unknown>>();
const store = globalStore.__memoStore;

export async function memo<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await fn();
  store.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

export function bust(prefix: string) {
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
}
