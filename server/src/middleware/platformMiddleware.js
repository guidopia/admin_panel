import { ApiError } from '../utils/apiError.js';
import {
  DEFAULT_PLATFORM,
  isValidPlatform,
  listPlatformMeta,
  parsePlatform,
} from '../config/platforms.js';
import { getModelsForPlatform, isCareerBeaconConfigured } from '../db/platformModels.js';

export function resolveRequestPlatform(req) {
  const raw = req.query?.platform ?? req.headers['x-platform'] ?? DEFAULT_PLATFORM;
  const platform = parsePlatform(raw);
  if (!platform) throw new ApiError(400, 'Invalid platform');
  return platform;
}

export function platformMiddleware(req, _res, next) {
  try {
    const platform = resolveRequestPlatform(req);
    if (!isValidPlatform(platform)) throw new ApiError(400, 'Invalid platform');
    req.platform = platform;
    req.models = getModelsForPlatform(platform);
    next();
  } catch (err) {
    next(err);
  }
}

export function listPlatforms(_req, res) {
  res.json({
    platforms: listPlatformMeta({ careerBeaconConfigured: isCareerBeaconConfigured() }),
    defaultPlatform: DEFAULT_PLATFORM,
  });
}
