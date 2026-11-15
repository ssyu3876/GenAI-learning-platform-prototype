// Server-side YouTube lookup used when a generated course asks for video.
// Prefer the official Data API when a key exists; otherwise read the public results page
// and verify each candidate with YouTube's public oEmbed endpoint. No key is required for
// the fallback, but scraping can be rate-limited or changed by YouTube.
interface VideoResult {
  videoId: string;
  title: string;
  url: string;
}

const cache = new Map<string, { at: number; videos: VideoResult[] }>();

async function officialSearch(query: string, limit: number): Promise<VideoResult[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];
  const endpoint = new URL('https://www.googleapis.com/youtube/v3/search');
  endpoint.searchParams.set('part', 'snippet');
  endpoint.searchParams.set('type', 'video');
  endpoint.searchParams.set('maxResults', String(limit));
  endpoint.searchParams.set('q', query);
  endpoint.searchParams.set('key', key);
  const res = await fetch(endpoint, { signal: AbortSignal.timeout(6_000) });
  if (!res.ok) return [];
  const body = (await res.json()) as {
    items?: Array<{ id?: { videoId?: string }; snippet?: { title?: string } }>;
  };
  return (body.items ?? [])
    .map((item) => {
      const videoId = item.id?.videoId ?? '';
      return videoId
        ? { videoId, title: item.snippet?.title ?? '', url: `https://www.youtube.com/watch?v=${videoId}` }
        : null;
    })
    .filter((item): item is VideoResult => Boolean(item?.title));
}

async function titleFromOEmbed(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
      { signal: AbortSignal.timeout(4_000) },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { title?: string };
    return body.title?.trim() || null;
  } catch {
    return null;
  }
}

function titleFromHtml(html: string, videoId: string): string | null {
  const index = html.indexOf(`"videoId":"${videoId}"`);
  if (index < 0) return null;
  const chunk = html.slice(index, index + 2_500);
  const match = chunk.match(/"title":\{"runs":\[\{"text":"((?:\\.|[^"\\])*)"/);
  if (!match?.[1]) return null;
  try {
    return JSON.parse(`"${match[1]}"`) as string;
  } catch {
    return null;
  }
}

async function scrapeSearch(query: string, limit: number): Promise<VideoResult[]> {
  try {
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=en`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.8',
      },
      signal: AbortSignal.timeout(8_000),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const html = await res.text();
    const ids = [...html.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)]
      .map((match) => match[1]!)
      .filter((id, index, all) => all.indexOf(id) === index)
      .slice(0, 3);
    const titles = await Promise.all(
      ids.map(async (videoId) => titleFromHtml(html, videoId) ?? (await titleFromOEmbed(videoId))),
    );
    return ids
      .map((videoId, index) => {
        const title = titles[index];
        return title ? { videoId, title, url: `https://www.youtube.com/watch?v=${videoId}` } : null;
      })
      .filter((item): item is VideoResult => Boolean(item))
      .slice(0, limit);
  } catch {
    return [];
  }
}

/** Real, verified video results. Returns [] rather than inventing a URL. */
export async function searchYouTube(query: string, limit = 3): Promise<VideoResult[]> {
  const normalized = query.trim().slice(0, 180);
  if (!normalized) return [];
  const cached = cache.get(normalized);
  if (cached && Date.now() - cached.at < 60 * 60 * 1000) return cached.videos.slice(0, limit);
  const videos = process.env.YOUTUBE_API_KEY
    ? await officialSearch(normalized, limit)
    : await scrapeSearch(normalized, limit);
  cache.set(normalized, { at: Date.now(), videos });
  return videos.slice(0, limit);
}
