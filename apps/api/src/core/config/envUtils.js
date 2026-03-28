/**
 * Normalize .env values (handles spaces around `=` and optional wrapping quotes).
 * @param {string | undefined} value
 */
export function trimEnvValue(value) {
  if (value == null) return undefined;
  let s = String(value).trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1);
  }
  return s;
}
