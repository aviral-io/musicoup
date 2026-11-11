import yts from 'yt-search';

// Extract YouTube Video ID from various link formats
export function extractYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export async function searchYouTube(query) {
  try {
    if (!query || !query.trim()) return [];

    const trimmed = query.trim();
    const directId = extractYouTubeId(trimmed);

    if (directId) {
      try {
        const video = await yts({ videoId: directId });
        if (video) {
          return [{
            id: video.videoId,
            title: video.title,
            artist: video.author?.name || 'YouTube',
            thumbnail: video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`,
            duration: video.seconds || 0,
            durationFormatted: video.timestamp || '0:00',
            url: video.url || `https://www.youtube.com/watch?v=${video.videoId}`
          }];
        }
      } catch (err) {
        // Fallback for direct ID if metadata fetch fails
        return [{
          id: directId,
          title: 'YouTube Track',
          artist: 'YouTube',
          thumbnail: `https://img.youtube.com/vi/${directId}/hqdefault.jpg`,
          duration: 0,
          durationFormatted: 'Live / Audio',
          url: `https://www.youtube.com/watch?v=${directId}`
        }];
      }
    }

    // Keyword search
    const r = await yts(trimmed);
    const videos = (r.videos || []).slice(0, 10);

    return videos.map(v => ({
      id: v.videoId,
      title: v.title,
      artist: v.author?.name || 'YouTube Artist',
      thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`,
      duration: v.seconds || 0,
      durationFormatted: v.timestamp || '0:00',
      url: v.url
    }));
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return [];
  }
}

