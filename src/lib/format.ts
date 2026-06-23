/** Human-readable byte size, e.g. "2.3 GB", "540 MB", "12 KB". */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 MB';
  const kb = bytes / 1000;
  if (kb < 1000) return `${Math.max(1, Math.round(kb))} KB`;
  const mb = kb / 1000;
  if (mb < 1000) return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
  const gb = mb / 1000;
  return `${gb < 10 ? gb.toFixed(1) : Math.round(gb)} GB`;
}
