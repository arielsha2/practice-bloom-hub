export type VideoSource = 'file' | 'youtube' | 'vimeo' | 'zoom';

interface VideoInfo {
  isValid: boolean;
  source: VideoSource;
  videoId: string | null;
  embedUrl: string | null;
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    // Standard watch URL: youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]{11})/,
    // Short URL: youtu.be/VIDEO_ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // Embed URL: youtube.com/embed/VIDEO_ID
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // Shorts URL: youtube.com/shorts/VIDEO_ID
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    // Live URL: youtube.com/live/VIDEO_ID
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Extract Vimeo video ID from various URL formats
 */
export function extractVimeoId(url: string): string | null {
  const patterns = [
    // Standard URL: vimeo.com/VIDEO_ID
    /vimeo\.com\/(\d+)/,
    // Player URL: player.vimeo.com/video/VIDEO_ID
    /player\.vimeo\.com\/video\/(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Validate and parse a video URL
 */
export function parseVideoUrl(url: string): VideoInfo {
  const trimmedUrl = url.trim();

  // Check YouTube
  const youtubeId = extractYouTubeId(trimmedUrl);
  if (youtubeId) {
    return {
      isValid: true,
      source: 'youtube',
      videoId: youtubeId,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
    };
  }

  // Check Vimeo
  const vimeoId = extractVimeoId(trimmedUrl);
  if (vimeoId) {
    return {
      isValid: true,
      source: 'vimeo',
      videoId: vimeoId,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
    };
  }

  // Check Zoom
  if (trimmedUrl.includes('zoom.us')) {
    return {
      isValid: true,
      source: 'zoom',
      videoId: null,
      embedUrl: null, // Zoom doesn't support embed
    };
  }

  return {
    isValid: false,
    source: 'file',
    videoId: null,
    embedUrl: null,
  };
}

/**
 * Get embed URL for a video based on source and URL
 */
export function getVideoEmbedUrl(url: string, source: VideoSource): string | null {
  if (source === 'youtube') {
    const videoId = extractYouTubeId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  if (source === 'vimeo') {
    const videoId = extractVimeoId(url);
    return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
  }

  return null;
}

/**
 * Validate URL format for a specific source
 */
export function validateVideoUrl(url: string, source: VideoSource): boolean {
  if (!url.trim()) return false;

  switch (source) {
    case 'youtube':
      return extractYouTubeId(url) !== null;
    case 'vimeo':
      return extractVimeoId(url) !== null;
    case 'zoom':
      return url.includes('zoom.us');
    default:
      return false;
  }
}
