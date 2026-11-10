// Tiny placeholder interpolation for dictionary strings: "{count} lessons".
// Kept dependency-free so both server and client components can use it.
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key];
    return value === undefined ? match : String(value);
  });
}

/** Picks the right English plural form; Chinese uses the singular key. */
export function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}
