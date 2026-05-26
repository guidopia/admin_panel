import { Router } from 'express';
import {
  bulkSetPremium,
  exportAllUsersData,
  exportUserData,
  getUserDetail,
  listUsers,
  setUserPremium,
} from '../controllers/userController.js';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/', listUsers);
router.get('/export/all', exportAllUsersData);
router.patch('/premium/bulk', bulkSetPremium);
router.get('/:id/export', exportUserData);
router.get('/:id', getUserDetail);
router.patch('/:id/premium', setUserPremium);

export default router;

