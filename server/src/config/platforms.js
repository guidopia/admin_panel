export const PLATFORMS = {
  PRODIGY_AI: 'prodigy-ai',
  CAREER_BEACON: 'career-beacon',
};

export const DEFAULT_PLATFORM = PLATFORMS.PRODIGY_AI;

const PLATFORM_META = {
  [PLATFORMS.PRODIGY_AI]: { id: PLATFORMS.PRODIGY_AI, label: 'Prodigy AI' },
  [PLATFORMS.CAREER_BEACON]: { id: PLATFORMS.CAREER_BEACON, label: 'Career Beacon' },
};

export function isValidPlatform(platform) {
  return platform === PLATFORMS.PRODIGY_AI || platform === PLATFORMS.CAREER_BEACON;
}

export function parsePlatform(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw || raw === PLATFORMS.PRODIGY_AI) return PLATFORMS.PRODIGY_AI;
  if (raw === PLATFORMS.CAREER_BEACON || raw === 'careerbeacon' || raw === 'career_beacon') {
    return PLATFORMS.CAREER_BEACON;
  }
  return null;
}

export function listPlatformMeta({ careerBeaconConfigured }) {
  return Object.values(PLATFORM_META).map((meta) => ({
    ...meta,
    configured: meta.id === PLATFORMS.PRODIGY_AI ? true : Boolean(careerBeaconConfigured),
  }));
}
