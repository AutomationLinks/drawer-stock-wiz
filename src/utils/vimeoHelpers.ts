// Extract Vimeo video ID from various URL formats
export const extractVimeoId = (url: string): string | null => {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
    /^(\d+)$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Generate Vimeo embed URL
export const getVimeoEmbedUrl = (videoId: string): string => {
  return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`;
};

// Generate Vimeo thumbnail URL
export const getVimeoThumbnail = (videoId: string): string => {
  return `https://vumbnail.com/${videoId}.jpg`;
};

// Validate Vimeo URL
export const isValidVimeoUrl = (url: string): boolean => {
  return extractVimeoId(url) !== null;
};
