// Relative-time formatter shared by leaderboard surfaces.
// Bands: <1m → "just now", <1h → "Xm ago", <1d → "Xh ago", else "Xd ago".

export function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
