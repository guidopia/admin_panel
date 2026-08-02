import { api } from '../../lib/api.js';

/** Extract a human-readable message from an axios error. */
export function accessApiError(err, fallback = 'Something went wrong') {
  return err?.response?.data?.message || err?.message || fallback;
}

export const accessApi = {
  // ── Auth ──────────────────────────────────────────────────────────────
  login(email, password) {
    return api.post('/api/access/auth/login', { email, password }).then((r) => r.data);
  },
  me() {
    return api.get('/api/access/auth/me').then((r) => r.data.user);
  },

  // ── Analytics ─────────────────────────────────────────────────────────
  getAnalytics(organizationId) {
    return api
      .get('/api/access/analytics', {
        params: organizationId ? { organizationId } : {},
      })
      .then((r) => r.data.analytics);
  },

  // ── Organizations ─────────────────────────────────────────────────────
  listOrganizations() {
    return api.get('/api/access/organizations').then((r) => r.data.organizations);
  },
  getCurrentOrganization() {
    return api.get('/api/access/organizations/current').then((r) => r.data.organization);
  },
  createOrganization(payload) {
    return api.post('/api/access/organizations', payload).then((r) => r.data.organization);
  },
  updateOrganization(id, payload) {
    return api.patch(`/api/access/organizations/${id}`, payload).then((r) => r.data.organization);
  },
  toggleOrganizationStatus(id) {
    return api.patch(`/api/access/organizations/${id}/status`).then((r) => r.data.organization);
  },
  deleteOrganization(id) {
    return api.delete(`/api/access/organizations/${id}`).then((r) => r.data);
  },

  // ── Admins ────────────────────────────────────────────────────────────
  listAdmins(organizationId) {
    return api
      .get('/api/access/admins', { params: organizationId ? { organizationId } : {} })
      .then((r) => r.data.admins);
  },
  createAdmin(payload) {
    return api.post('/api/access/admins', payload).then((r) => r.data);
  },
  updateAdmin(id, payload) {
    return api.patch(`/api/access/admins/${id}`, payload).then((r) => r.data.admin);
  },
  deleteAdmin(id) {
    return api.delete(`/api/access/admins/${id}`).then((r) => r.data);
  },

  // ── Counselors ────────────────────────────────────────────────────────
  listCounselors(params = {}) {
    return api.get('/api/access/counselors', { params }).then((r) => r.data.counselors);
  },
  createCounselor(payload) {
    return api.post('/api/access/counselors', payload).then((r) => r.data);
  },
  updateCounselor(id, payload) {
    return api.patch(`/api/access/counselors/${id}`, payload).then((r) => r.data.counselor);
  },
  deleteCounselor(id) {
    return api.delete(`/api/access/counselors/${id}`).then((r) => r.data);
  },
  regenerateReferralCode(id) {
    return api.post(`/api/access/counselors/${id}/referral-code`).then((r) => r.data.counselor);
  },

  // ── Students ──────────────────────────────────────────────────────────
  listStudents(params = {}) {
    return api
      .get('/api/access/students', { params: { limit: 200, ...params } })
      .then((r) => r.data.students || []);
  },
  assignStudent(id, counselorId) {
    return api
      .patch(`/api/access/students/${id}/assign`, { counselorId: counselorId || null })
      .then((r) => r.data.student);
  },
  addStudentNote(id, text) {
    return api.post(`/api/access/students/${id}/notes`, { text }).then((r) => r.data.student);
  },
};
