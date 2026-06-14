/** Project / module identity colors (for at-a-glance recognition only). */
export const PROJECT_COLORS = [
  '#3FB984',
  '#A06BF0',
  '#34BE9A',
  '#4C8DFF',
  '#E8A33D',
  '#6E8BFF',
  '#E06CA8',
  '#F0685E',
  '#6B86A3',
] as const;

/** Derive a project-key suggestion from a name: "Aurora API" → "AUR". */
export function suggestKey(name: string): string {
  const cleaned = name.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
  const words = cleaned.split(/\s+/).filter(Boolean);
  let key = '';
  if (words.length >= 2) key = words.map((w) => w[0]).join('');
  else key = (words[0] ?? '').slice(0, 4);
  key = key.replace(/[^A-Z0-9]/g, '').slice(0, 10);
  if (key.length < 2) key = (key + 'XX').slice(0, 2);
  if (/^[0-9]/.test(key)) key = `P${key}`.slice(0, 10);
  return key;
}
