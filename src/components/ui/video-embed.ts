// Turns a YouTube or Bilibili link into a player URL, so a lesson can show a video where the
// author put the link. Only these two hosts are recognised; anything else stays a plain link.
// Pure function: no React, safe on server and client, unit tested.

export interface VideoEmbed {
  provider: 'youtube' | 'bilibili';
  id: string;
  /** URL for the iframe `src` */
  embedUrl: string;
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const BILIBILI_ID = /^BV[0-9A-Za-z]{10}$/;

/** "90", "90s", "1m30s", "1h2m3s" → seconds; anything else → 0. */
export function parseStartSeconds(value: string | null): number {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return Number(value);
  const m = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!m || !value) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

export function parseVideoUrl(raw: string): VideoEmbed | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.replace(/^(www|m)\./, '');
  const start = parseStartSeconds(url.searchParams.get('t') ?? url.searchParams.get('start'));

  let youtubeId: string | null = null;
  if (host === 'youtu.be') {
    youtubeId = url.pathname.split('/')[1] ?? null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') youtubeId = url.searchParams.get('v');
    else youtubeId = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] ?? null;
  }
  if (youtubeId && YOUTUBE_ID.test(youtubeId)) {
    const query = new URLSearchParams({ rel: '0' });
    if (start > 0) query.set('start', String(start));
    return { provider: 'youtube', id: youtubeId, embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?${query}` };
  }

  if (host === 'bilibili.com') {
    const bvid = url.pathname.match(/^\/video\/([^/]+)/)?.[1];
    if (bvid && BILIBILI_ID.test(bvid)) {
      const page = Number(url.searchParams.get('p'));
      const query = new URLSearchParams({ bvid, page: String(page > 0 ? Math.floor(page) : 1), autoplay: '0' });
      if (start > 0) query.set('t', String(start));
      return { provider: 'bilibili', id: bvid, embedUrl: `https://player.bilibili.com/player.html?${query}` };
    }
  }
  return null;
}
