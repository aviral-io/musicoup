import yts from 'yt-search';

// In-memory caches to make searches and suggestions lightning fast (< 5ms for repeated queries)
const searchCache = new Map();
const suggestCache = new Map();

// Extract YouTube Video ID from various link formats (including Shorts, youtu.be, embed, etc.)
export function extractYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Lightning-fast YouTube search suggestions using public endpoint (< 100ms)
export async function getYouTubeSuggestions(query) {
  if (!query || !query.trim()) return [];
  const trimmed = query.trim().toLowerCase();

  const cached = suggestCache.get(trimmed);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) return [];
    const data = await res.json();
    const suggestions = (data && Array.isArray(data[1])) ? data[1].slice(0, 7) : [];

    // Cache for 1 hour
    suggestCache.set(trimmed, {
      data: suggestions,
      expiresAt: Date.now() + 1000 * 60 * 60
    });

    return suggestions;
  } catch (err) {
    console.error('Error fetching suggestions:', err);
    return [];
  }
}

// Fast Search with Caching & Direct Link Optimization
export async function searchYouTube(query) {
  try {
    if (!query || !query.trim()) return [];

    const trimmed = query.trim();
    const cacheKey = trimmed.toLowerCase();

    // Check in-memory cache
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const directId = extractYouTubeId(trimmed);

    // Fast path for direct YouTube links
    if (directId) {
      try {
        // Fast title lookup via noembed (takes ~50ms instead of full page scrape)
        const noembedRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${directId}`);
        if (noembedRes.ok) {
          const info = await noembedRes.json();
          if (info && info.title) {
            const result = [{
              id: directId,
              title: info.title,
              artist: info.author_name || 'YouTube',
              thumbnail: `https://img.youtube.com/vi/${directId}/hqdefault.jpg`,
              duration: 0,
              durationFormatted: 'YouTube Track',
              url: `https://www.youtube.com/watch?v=${directId}`
            }];
            searchCache.set(cacheKey, { data: result, expiresAt: Date.now() + 1000 * 60 * 60 });
            return result;
          }
        }
      } catch (e) {
        // fallback
      }

      const fallbackResult = [{
        id: directId,
        title: 'YouTube Track',
        artist: 'YouTube',
        thumbnail: `https://img.youtube.com/vi/${directId}/hqdefault.jpg`,
        duration: 0,
        durationFormatted: 'Direct Video',
        url: `https://www.youtube.com/watch?v=${directId}`
      }];
      return fallbackResult;
    }

    // Keyword search with yt-search
    const r = await yts({ query: trimmed, page: 1 });
    const videos = (r.videos || []).slice(0, 8);

    const results = videos.map(v => ({
      id: v.videoId,
      title: v.title,
      artist: v.author?.name || 'YouTube Artist',
      thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`,
      duration: v.seconds || 0,
      durationFormatted: v.timestamp || '0:00',
      url: v.url
    }));

    // Cache search results for 30 minutes
    searchCache.set(cacheKey, {
      data: results,
      expiresAt: Date.now() + 1000 * 60 * 30
    });

    return results;
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return [];
  }
}
