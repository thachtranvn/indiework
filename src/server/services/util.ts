/** Keep only keys whose value is not `undefined` (a `null` is kept → clears the field). */
export function definedKeys<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}
