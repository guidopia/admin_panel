import { Router } from 'express';
import { bulkSetPremium, getUserDetail, listUsers, setUserPremium } from '../controllers/userController.js';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/', listUsers);
router.patch('/premium/bulk', bulkSetPremium);
router.get('/:id', getUserDetail);
router.patch('/:id/premium', setUserPremium);

export default router;

