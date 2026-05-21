export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function genId(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function extOf(file: File): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
  };
  return map[file.type] || (file.name.split('.').pop() || 'img').toLowerCase();
}

export function relativeTime(ts: number): string {
  const diff = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function parseUrl(
  url: string,
): { scheme: string; host: string; path: string } | null {
  try {
    const u = new URL(url);
    return {
      scheme: `${u.protocol}//`,
      host: `${u.host}/`,
      path: u.pathname.replace(/^\//, ''),
    };
  } catch {
    return null;
  }
}
