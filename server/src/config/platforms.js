export const PLATFORMS = {
  PRODIGY_AI: 'prodigy-ai',
  CAREER_BEACON: 'career-beacon',
  VIDHYASAARTHI: 'vidhyasaarthi',
  CLICKTOCOLLEGE: 'clicktocollege',
};

export const DEFAULT_PLATFORM = PLATFORMS.PRODIGY_AI;

const PLATFORM_META = {
  [PLATFORMS.PRODIGY_AI]: { id: PLATFORMS.PRODIGY_AI, label: 'Prodigy AI' },
  [PLATFORMS.CAREER_BEACON]: { id: PLATFORMS.CAREER_BEACON, label: 'Career Beacon' },
  [PLATFORMS.VIDHYASAARTHI]: { id: PLATFORMS.VIDHYASAARTHI, label: 'Vidhyasaarthi' },
  [PLATFORMS.CLICKTOCOLLEGE]: { id: PLATFORMS.CLICKTOCOLLEGE, label: 'Click To College' },
};

export function isValidPlatform(platform) {
  return Object.values(PLATFORMS).includes(platform);
}

export function parsePlatform(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw || raw === PLATFORMS.PRODIGY_AI) return PLATFORMS.PRODIGY_AI;
  if (raw === PLATFORMS.CAREER_BEACON || raw === 'careerbeacon' || raw === 'career_beacon') {
    return PLATFORMS.CAREER_BEACON;
  }
  if (
    raw === PLATFORMS.VIDHYASAARTHI ||
    raw === 'vidhyasarthi' ||
    raw === 'vidhya_saarthi' ||
    raw === 'vidhya-saarthi'
  ) {
    return PLATFORMS.VIDHYASAARTHI;
  }
  if (
    raw === PLATFORMS.CLICKTOCOLLEGE ||
    raw === 'clicktocollege' ||
    raw === 'click-to-college' ||
    raw === 'click_to_college'
  ) {
    return PLATFORMS.CLICKTOCOLLEGE;
  }
  return null;
}

export function listPlatformMeta({
  careerBeaconConfigured,
  vidhyasaarthiConfigured,
  clickToCollegeConfigured,
}) {
  return Object.values(PLATFORM_META).map((meta) => {
    let configured = true;
    if (meta.id === PLATFORMS.CAREER_BEACON) configured = Boolean(careerBeaconConfigured);
    if (meta.id === PLATFORMS.VIDHYASAARTHI) configured = Boolean(vidhyasaarthiConfigured);
    if (meta.id === PLATFORMS.CLICKTOCOLLEGE) configured = Boolean(clickToCollegeConfigured);
    return { ...meta, configured };
  });
}

