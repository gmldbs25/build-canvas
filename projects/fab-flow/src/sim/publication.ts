/**
 * Copies a plain JSON-compatible value for render publication without the
 * encode/decode pass used by persistence snapshots. Undefined object fields
 * are omitted and undefined array entries become null, matching JSON behavior.
 */
export function publicationCopy<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map(item => item === undefined ? null : publicationCopy(item)) as T;
  }
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    const item = (value as Record<string, unknown>)[key];
    if (item === undefined) continue;
    const copied = publicationCopy(item);
    if (key === '__proto__') Object.defineProperty(result, key, { value: copied, enumerable: true, writable: true, configurable: true });
    else result[key] = copied;
  }
  return result as T;
}
