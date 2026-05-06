const youtubeIdPattern = /^[A-Za-z0-9_-]{6,}$/;

export const extractYouTubeVideoId = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.replace(/^www\./, '').toLowerCase();
    const pathParts = url.pathname.split('/').filter(Boolean);
    const videoId =
      hostname === 'youtu.be'
        ? pathParts[0]
        : hostname === 'youtube.com' || hostname === 'm.youtube.com'
          ? url.pathname === '/watch'
            ? url.searchParams.get('v')
            : pathParts[0] === 'shorts' || pathParts[0] === 'embed'
              ? pathParts[1]
              : null
          : null;

    return videoId && youtubeIdPattern.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
};

export const normalizeYouTubeUrl = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const videoId = extractYouTubeVideoId(trimmed);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : trimmed;
};
