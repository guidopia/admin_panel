export const PLATFORMS = [
  { id: 'prodigy-ai', label: 'Prodigy AI' },
  { id: 'career-beacon', label: 'Career Beacon' },
  { id: 'vidhyasaarthi', label: 'Vidhyasaarthi' },
];

export const DEFAULT_PLATFORM = 'prodigy-ai';

export function platformLabel(platformId) {
  return PLATFORMS.find((p) => p.id === platformId)?.label || platformId;
}

export function withPlatformParams(params, platform) {
  return { ...params, platform: platform || DEFAULT_PLATFORM };
}

export function withPlatformQuery(path, platform) {
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}platform=${encodeURIComponent(platform || DEFAULT_PLATFORM)}`;
}
