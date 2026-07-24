import { Router } from 'express';

import { accessLogin, accessMe } from '../controllers/accessAuthController.js';
import * as organizationController from '../controllers/organizationController.js';
import * as adminController from '../controllers/adminController.js';
import * as counselorController from '../controllers/counselorController.js';
import * as studentController from '../controllers/studentController.js';
import * as analyticsController from '../controllers/analyticsController.js';
import {
  requireAccessAuth,
  requireAccessRoles,
  requireAnyAccessRole,
  requireOrgAdminOrSuper,
  requireSuperAdmin,
} from '../middleware/accessAuthMiddleware.js';
import { ACCESS_ROLES } from '../constants/roles.js';

const router = Router();

// ── Auth ──────────────────────────────────────────────────────────────
router.post('/auth/login', accessLogin);
router.get('/auth/me', requireAccessAuth, accessMe);

// ── Public student registration (referral-aware) ─────────────────────
router.post('/students/register', studentController.registerStudent);

// All routes below require Access JWT
router.use(requireAccessAuth);

// ── Organizations (Super Admin) ───────────────────────────────────────
router.get(
  '/organizations',
  requireSuperAdmin,
  organizationController.listOrganizations
);
router.post(
  '/organizations',
  requireSuperAdmin,
  organizationController.createOrganization
);
// Org Admin (or Super) fetches the caller's own organization. Must precede "/:id".
router.get(
  '/organizations/current',
  requireOrgAdminOrSuper,
  organizationController.getCurrentOrganization
);
router.get(
  '/organizations/:id',
  requireSuperAdmin,
  organizationController.getOrganization
);
router.patch(
  '/organizations/:id',
  requireSuperAdmin,
  organizationController.updateOrganization
);
router.patch(
  '/organizations/:id/status',
  requireSuperAdmin,
  organizationController.toggleOrganizationStatus
);

// ── White-label Admins (Super Admin create/list; org admin can list own) ─
router.get(
  '/admins',
  requireAccessRoles(ACCESS_ROLES.SUPER_ADMIN, ACCESS_ROLES.WL_ADMIN),
  adminController.listAdmins
);
router.post('/admins', requireSuperAdmin, adminController.createAdmin);
router.get(
  '/admins/:id',
  requireAccessRoles(ACCESS_ROLES.SUPER_ADMIN, ACCESS_ROLES.WL_ADMIN),
  adminController.getAdmin
);
router.patch('/admins/:id', requireSuperAdmin, adminController.updateAdmin);

// ── Counselors ────────────────────────────────────────────────────────
router.get('/counselors', requireAnyAccessRole, counselorController.listCounselors);
router.post('/counselors', requireOrgAdminOrSuper, counselorController.createCounselor);
router.get('/counselors/:id', requireAnyAccessRole, counselorController.getCounselor);
router.patch('/counselors/:id', requireOrgAdminOrSuper, counselorController.updateCounselor);
router.delete('/counselors/:id', requireOrgAdminOrSuper, counselorController.deleteCounselor);
router.post(
  '/counselors/:id/referral-code',
  requireOrgAdminOrSuper,
  counselorController.regenerateReferralCode
);

// ── Students ──────────────────────────────────────────────────────────
router.get('/students', requireAnyAccessRole, studentController.listStudents);
router.get(
  '/students/unassigned',
  requireOrgAdminOrSuper,
  studentController.listUnassignedStudents
);
router.get('/students/:id', requireAnyAccessRole, studentController.getStudent);
router.patch(
  '/students/:id/assign',
  requireOrgAdminOrSuper,
  studentController.assignStudent
);
router.post('/students/:id/notes', requireAnyAccessRole, studentController.addStudentNote);

// ── Analytics / Reports ───────────────────────────────────────────────
router.get('/analytics', requireAnyAccessRole, analyticsController.getAnalytics);

export default router;
