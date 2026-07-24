import * as analyticsService from '../services/analyticsService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAnalytics = asyncHandler(async (req, res) => {
  const organizationId = req.query.organizationId || null;
  const analytics = await analyticsService.getAnalytics(req.accessUser, organizationId);
  res.json({ analytics });
});
