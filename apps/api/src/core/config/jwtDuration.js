/**
 * Parse JWT/cookie maxAge strings like `24h`, `7d`, `30m`, `3600s`.
 * @param {string} expiresIn
 */
export function jwtExpiresInToMs(expiresIn) {
  const s = String(expiresIn).trim();
  const m = s.match(/^(\d+)([smhd])$/i);
  if (!m) return 24 * 60 * 60 * 1000;
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  const map = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * (map[u] || 3_600_000);
}
