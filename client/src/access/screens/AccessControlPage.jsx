import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '../../state/auth/AuthContext.jsx';
import {
  accessRoleLabel,
  getAccessCounselorId,
  getAccessOrganizationId,
  getAccessRole,
  isCounselor,
  isOrgAdmin,
  isSuperAdmin,
} from '../lib/accessSession.js';
import { ROLES, orgName } from '../lib/accessConstants.js';
import { accessApi, accessApiError } from '../lib/accessApi.js';
import { AccessTabs } from '../ui/AccessTabs.jsx';
import { AdminsPanel } from '../ui/AdminsPanel.jsx';
import { AddCounselorModal } from '../ui/AddCounselorModal.jsx';
import { AddAdminModal, CredentialsModal } from '../ui/AdminModals.jsx';
import { AnalyticsPanel, StatCards } from '../ui/AnalyticsPanel.jsx';
import { AssignCounselorModal } from '../ui/AssignCounselorModal.jsx';
import { CounselorsPanel } from '../ui/CounselorsPanel.jsx';
import {
  CounselorDetailDrawer,
  OrganizationDetailDrawer,
  StudentDetailDrawer,
} from '../ui/DetailDrawers.jsx';
import {
  DeactivateOrganizationModal,
  DeleteCounselorModal,
  EditCounselorModal,
  OrganizationFormModal,
} from '../ui/FormModals.jsx';
import { OrganizationAnalyticsPanel } from '../ui/OrganizationAnalyticsPanel.jsx';
import { OrganizationProfilePanel, ReferralSystemPanel } from '../ui/OrganizationProfilePanel.jsx';
import { OrganizationsPanel } from '../ui/OrganizationsPanel.jsx';
import { ReferralCodeSuccessModal, RegenerateReferralModal } from '../ui/ReferralModals.jsx';
import { StudentsPanel } from '../ui/StudentsPanel.jsx';

const SUPER_ADMIN_TABS = [
  { id: 'organizations', label: 'Organizations' },
  { id: 'admins', label: 'Admins' },
  { id: 'counselors', label: 'Counselors' },
  { id: 'students', label: 'Students' },
  { id: 'referrals', label: 'Referral system' },
  { id: 'analytics', label: 'Analytics' },
];

const WL_ADMIN_TABS = [
  { id: 'profile', label: 'Organization' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'counselors', label: 'Counselors' },
  { id: 'students', label: 'Students' },
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'reports', label: 'Reports' },
];

const COUNSELOR_TABS = [
  { id: 'my-students', label: 'My Students' },
  { id: 'reports', label: 'Reports' },
];

function initialTabForRole(role) {
  if (role === ROLES.SUPER_ADMIN) return 'students';
  if (role === ROLES.WL_ADMIN) return 'counselors';
  return 'my-students';
}

function ReportsPlaceholder({ title, description }) {
  return (
    <div className="surface p-8 text-center">
      <div className="text-[15px] font-semibold text-neutral-900">{title}</div>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-neutral-500">{description}</p>
      <div className="mt-5 inline-flex gap-2">
        <button type="button" className="btn-ghost h-9 px-3 text-[12px]" disabled title="Report export coming soon">
          Export CSV
        </button>
        <button type="button" className="btn-primary h-9 px-3 text-[12px]" disabled title="Report export coming soon">
          Export PDF
        </button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="surface grid place-items-center p-12 text-[13px] text-neutral-500">
      <div className="flex items-center gap-2.5">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
        Loading access control…
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="surface p-5 text-[13px]">
      <div className="font-semibold text-neutral-900">Couldn’t load access control</div>
      <div className="mt-1 text-neutral-500">{message}</div>
      <button type="button" className="btn-ghost mt-3 h-8 px-2.5 text-[12px]" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

export function AccessControlPage() {
  const { user } = useAuth();
  const accessRole = getAccessRole(user);
  const organizationId = getAccessOrganizationId(user);
  const counselorId = getAccessCounselorId(user);

  const isSuper = isSuperAdmin(user);
  const isWL = isOrgAdmin(user);
  const isCsl = isCounselor(user);

  const [activeTab, setActiveTab] = useState(() => initialTabForRole(accessRole));

  const [analytics, setAnalytics] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [orgQuery, setOrgQuery] = useState('');
  const [adminQuery, setAdminQuery] = useState('');
  const [counselorQuery, setCounselorQuery] = useState('');
  const [studentQuery, setStudentQuery] = useState('');
  const [unassignedQuery, setUnassignedQuery] = useState('');

  const [addCounselorOpen, setAddCounselorOpen] = useState(false);
  const [createdCounselor, setCreatedCounselor] = useState(null);
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [createdAdmin, setCreatedAdmin] = useState(null);
  const [assignStudent, setAssignStudent] = useState(null);
  const [detailStudent, setDetailStudent] = useState(null);
  const [detailOrganization, setDetailOrganization] = useState(null);
  const [detailCounselor, setDetailCounselor] = useState(null);

  const [orgForm, setOrgForm] = useState({ open: false, mode: 'create', organization: null });
  const [editCounselor, setEditCounselor] = useState(null);
  const [deleteCounselor, setDeleteCounselor] = useState(null);
  const [regenerateCounselor, setRegenerateCounselor] = useState(null);
  const [toggleOrg, setToggleOrg] = useState(null);

  useEffect(() => {
    setActiveTab(initialTabForRole(accessRole));
  }, [accessRole]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (isSuper) {
        const [analyticsData, orgs, adminList, counselorList, studentList] = await Promise.all([
          accessApi.getAnalytics(),
          accessApi.listOrganizations(),
          accessApi.listAdmins(),
          accessApi.listCounselors(),
          accessApi.listStudents(),
        ]);
        setAnalytics(analyticsData);
        setOrganizations(orgs);
        setAdmins(adminList);
        setCounselors(counselorList);
        setStudents(studentList);
      } else if (isWL) {
        const [analyticsData, org, counselorList, studentList] = await Promise.all([
          accessApi.getAnalytics(),
          accessApi.getCurrentOrganization(),
          accessApi.listCounselors(),
          accessApi.listStudents(),
        ]);
        setAnalytics(analyticsData);
        setOrganizations(org ? [org] : []);
        setCounselors(counselorList);
        setStudents(studentList);
      } else {
        const [analyticsData, counselorList, studentList] = await Promise.all([
          accessApi.getAnalytics(),
          accessApi.listCounselors(),
          accessApi.listStudents(),
        ]);
        setAnalytics(analyticsData);
        setCounselors(counselorList);
        setStudents(studentList);
      }
    } catch (err) {
      setError(accessApiError(err, 'Failed to load access control data'));
    } finally {
      setLoading(false);
    }
  }, [isSuper, isWL]);

  useEffect(() => {
    load();
  }, [load]);

  const currentOrganization = useMemo(() => {
    if (isSuper) return organizations.find((o) => o.id === organizationId) || null;
    return organizations[0] || null;
  }, [organizations, organizationId, isSuper]);

  const tabs = useMemo(() => {
    if (isSuper) {
      return SUPER_ADMIN_TABS.map((tab) => {
        if (tab.id === 'organizations') return { ...tab, count: organizations.length };
        if (tab.id === 'admins') return { ...tab, count: admins.length };
        if (tab.id === 'counselors') return { ...tab, count: counselors.length };
        if (tab.id === 'students') return { ...tab, count: students.length };
        return tab;
      });
    }
    if (isWL) {
      return WL_ADMIN_TABS.map((tab) => {
        if (tab.id === 'counselors') return { ...tab, count: counselors.length };
        if (tab.id === 'students') return { ...tab, count: students.length };
        if (tab.id === 'unassigned') {
          return { ...tab, count: students.filter((s) => !s.assignedCounselorId).length };
        }
        return tab;
      });
    }
    return COUNSELOR_TABS.map((tab) =>
      tab.id === 'my-students' ? { ...tab, count: students.length } : tab
    );
  }, [isSuper, isWL, organizations, admins, counselors, students]);

  const handleAddCounselor = useCallback(
    async (form) => {
      try {
        const res = await accessApi.createCounselor({
          organizationId: form.organizationId || organizationId || undefined,
          name: form.name,
          email: form.email,
          phone: form.phone,
        });
        setCreatedCounselor({ ...res.counselor, temporaryPassword: res.temporaryPassword });
        await load();
      } catch (err) {
        toast.error(accessApiError(err));
      }
    },
    [load, organizationId]
  );

  const handleAddAdmin = useCallback(
    async (form) => {
      try {
        const res = await accessApi.createAdmin(form);
        setCreatedAdmin({ ...res.admin, temporaryPassword: res.temporaryPassword });
        await load();
      } catch (err) {
        toast.error(accessApiError(err));
      }
    },
    [load]
  );

  const handleEditCounselor = useCallback(
    async (id, form) => {
      try {
        const updated = await accessApi.updateCounselor(id, form);
        setDetailCounselor((prev) => (prev?.id === id ? updated : prev));
        toast.success('Counselor updated');
        await load();
      } catch (err) {
        toast.error(accessApiError(err));
      }
    },
    [load]
  );

  const handleDeleteCounselor = useCallback(
    async (counselor) => {
      try {
        await accessApi.deleteCounselor(counselor.id);
        setDeleteCounselor(null);
        setDetailCounselor(null);
        toast.success(`${counselor.name} deleted · assigned students are now unassigned`);
        await load();
      } catch (err) {
        toast.error(accessApiError(err));
      }
    },
    [load]
  );

  const handleRegenerateCode = useCallback(
    async (counselor) => {
      try {
        const updated = await accessApi.regenerateReferralCode(counselor.id);
        setDetailCounselor((prev) => (prev?.id === counselor.id ? updated : prev));
        setRegenerateCounselor(null);
        toast.success(`New referral code: ${updated.referralCode}`);
        await load();
      } catch (err) {
        toast.error(accessApiError(err));
      }
    },
    [load]
  );

  const handleAssignCounselor = useCallback(
    async (studentId, counselorIdValue) => {
      try {
        const updated = await accessApi.assignStudent(studentId, counselorIdValue);
        setDetailStudent((prev) => (prev?.id === studentId ? updated : prev));
        const name = counselors.find((c) => c.id === counselorIdValue)?.name;
        toast.success(`Student assigned to ${name || 'counselor'}`);
        await load();
      } catch (err) {
        toast.error(accessApiError(err));
      }
    },
    [load, counselors]
  );

  const handleAddNote = useCallback(
    async (studentId, text) => {
      try {
        const updated = await accessApi.addStudentNote(studentId, text);
        setDetailStudent((prev) => (prev?.id === studentId ? updated : prev));
        toast.success('Note added');
        await load();
      } catch (err) {
        toast.error(accessApiError(err));
      }
    },
    [load]
  );

  const handleSaveOrganization = useCallback(
    async (form) => {
      try {
        if (orgForm.mode === 'edit' && orgForm.organization) {
          await accessApi.updateOrganization(orgForm.organization.id, {
            name: form.name.trim(),
            branding: form.branding.trim(),
            primaryColor: form.primaryColor,
            logoUrl: form.logoUrl.trim(),
            status: form.status,
          });
          toast.success('Organization updated');
        } else {
          await accessApi.createOrganization({
            name: form.name.trim(),
            branding: form.branding.trim(),
            primaryColor: form.primaryColor,
            logoUrl: form.logoUrl.trim(),
          });
          toast.success('Organization created');
        }
        await load();
      } catch (err) {
        toast.error(accessApiError(err));
      }
    },
    [orgForm, load]
  );

  const handleToggleOrganization = useCallback(
    async (organization) => {
      try {
        await accessApi.toggleOrganizationStatus(organization.id);
        setToggleOrg(null);
        setDetailOrganization(null);
        toast.success(
          `Organization ${organization.status === 'active' ? 'deactivated' : 'activated'}`
        );
        await load();
      } catch (err) {
        toast.error(accessApiError(err));
      }
    },
    [load]
  );

  const canManageOrganizations = isSuper;
  const canManageCounselors = isSuper || isWL;
  const canAssignStudents = isWL;
  const isCounselorView = isCsl;
  const showOrgColumn = isSuper;
  const showCounselorsTab = isSuper || isWL;

  const booting = loading && analytics === null;

  return (
    <div className="space-y-5 pb-10">
      <header className="space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[20px] font-semibold tracking-tight text-neutral-900">Access Control</h1>
            <span className="chip-outline">{accessRoleLabel(accessRole)}</span>
          </div>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-neutral-500">
            {isSuper
              ? 'Platform-wide view. Create organization admins, counselors (auto referral codes), and manage all organizations and students.'
              : null}
            {isWL
              ? `Organization Admin${currentOrganization ? ` for ${currentOrganization.name}` : ''}. Create counselors with referral codes and manage your students.`
              : null}
            {isCounselorView
              ? 'Counselor view. You only see students who onboarded with your referral code.'
              : null}
          </p>
        </div>

        {isSuper && analytics ? <StatCards stats={analytics} /> : null}

        {!isSuper ? (
          <div className="surface-flat px-4 py-3 text-[12.5px] text-neutral-600">
            Signed in as <span className="font-medium text-neutral-900">{user?.name || user?.email}</span>
            {isWL && currentOrganization ? (
              <> · <span className="font-medium text-neutral-900">{currentOrganization.name}</span></>
            ) : null}
          </div>
        ) : null}

        <AccessTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
      </header>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : booting ? (
        <LoadingState />
      ) : (
        <>
          {activeTab === 'organizations' && isSuper ? (
            <OrganizationsPanel
              organizations={organizations}
              query={orgQuery}
              onQueryChange={setOrgQuery}
              onSelect={setDetailOrganization}
              onAdd={() => setOrgForm({ open: true, mode: 'create', organization: null })}
              onEdit={(org) => setOrgForm({ open: true, mode: 'edit', organization: org })}
              onToggleStatus={setToggleOrg}
              canManage={canManageOrganizations}
            />
          ) : null}

          {activeTab === 'admins' && isSuper ? (
            <AdminsPanel
              admins={admins}
              organizations={organizations}
              query={adminQuery}
              onQueryChange={setAdminQuery}
              onAdd={() => setAddAdminOpen(true)}
            />
          ) : null}

          {activeTab === 'profile' && isWL ? (
            <OrganizationProfilePanel
              organization={currentOrganization}
              onEdit={() => setOrgForm({ open: true, mode: 'edit', organization: currentOrganization })}
              analytics={
                <OrganizationAnalyticsPanel
                  organization={currentOrganization}
                  students={students}
                  counselors={counselors}
                />
              }
            />
          ) : null}

          {activeTab === 'analytics' && isWL ? (
            <OrganizationAnalyticsPanel
              organization={currentOrganization}
              students={students}
              counselors={counselors}
            />
          ) : null}

          {activeTab === 'counselors' && showCounselorsTab ? (
            <CounselorsPanel
              counselors={counselors}
              organizations={organizations}
              query={counselorQuery}
              onQueryChange={setCounselorQuery}
              onAddCounselor={() => setAddCounselorOpen(true)}
              onViewCounselor={setDetailCounselor}
              onEditCounselor={setEditCounselor}
              onDeleteCounselor={setDeleteCounselor}
              onRegenerateCode={setRegenerateCounselor}
              showOrgColumn={showOrgColumn}
              canManage={canManageCounselors}
            />
          ) : null}

          {activeTab === 'students' || activeTab === 'my-students' ? (
            <StudentsPanel
              students={students}
              counselors={counselors}
              organizations={organizations}
              query={studentQuery}
              onQueryChange={setStudentQuery}
              onSelectStudent={setDetailStudent}
              onAssignStudent={canAssignStudents ? setAssignStudent : undefined}
              showOrgColumn={showOrgColumn}
              showAssignActions={canAssignStudents}
            />
          ) : null}

          {activeTab === 'unassigned' && isWL ? (
            <StudentsPanel
              students={students}
              counselors={counselors}
              organizations={organizations}
              query={unassignedQuery}
              onQueryChange={setUnassignedQuery}
              onSelectStudent={setDetailStudent}
              onAssignStudent={setAssignStudent}
              showOrgColumn={false}
              unassignedOnly
              title="Unassigned students"
              showAssignActions
            />
          ) : null}

          {activeTab === 'referrals' && isSuper ? <ReferralSystemPanel /> : null}

          {activeTab === 'analytics' && isSuper && analytics ? <AnalyticsPanel stats={analytics} /> : null}

          {activeTab === 'reports' ? (
            <ReportsPlaceholder
              title={isCounselorView ? 'My student reports' : 'Organization reports'}
              description={
                isCounselorView
                  ? 'Counselors can export reports for their assigned students only.'
                  : 'Organization admins can export organization-level student and counselor reports.'
              }
            />
          ) : null}
        </>
      )}

      <AddCounselorModal
        open={addCounselorOpen}
        onClose={() => setAddCounselorOpen(false)}
        organizations={
          isSuper ? organizations : organizations.filter((o) => o.id === organizationId)
        }
        onSubmit={handleAddCounselor}
        hideOrganizationSelect={!isSuper}
      />

      <AddAdminModal
        open={addAdminOpen}
        onClose={() => setAddAdminOpen(false)}
        organizations={organizations}
        onSubmit={handleAddAdmin}
      />

      <CredentialsModal
        open={Boolean(createdAdmin)}
        onClose={() => setCreatedAdmin(null)}
        title="Organization admin created"
        credential={createdAdmin}
      />

      <ReferralCodeSuccessModal
        open={Boolean(createdCounselor)}
        onClose={() => setCreatedCounselor(null)}
        counselor={createdCounselor}
      />

      <RegenerateReferralModal
        open={Boolean(regenerateCounselor)}
        onClose={() => setRegenerateCounselor(null)}
        counselor={regenerateCounselor}
        onConfirm={handleRegenerateCode}
      />

      <EditCounselorModal
        open={Boolean(editCounselor)}
        onClose={() => setEditCounselor(null)}
        counselor={editCounselor}
        onSubmit={handleEditCounselor}
      />

      <DeleteCounselorModal
        open={Boolean(deleteCounselor)}
        onClose={() => setDeleteCounselor(null)}
        counselor={deleteCounselor}
        assignedStudentCount={deleteCounselor?.studentCount ?? 0}
        onConfirm={handleDeleteCounselor}
      />

      <OrganizationFormModal
        open={orgForm.open}
        onClose={() => setOrgForm({ open: false, mode: 'create', organization: null })}
        mode={orgForm.mode}
        organization={orgForm.organization}
        onSubmit={handleSaveOrganization}
      />

      <DeactivateOrganizationModal
        open={Boolean(toggleOrg)}
        onClose={() => setToggleOrg(null)}
        organization={toggleOrg}
        onConfirm={handleToggleOrganization}
      />

      <AssignCounselorModal
        open={Boolean(assignStudent)}
        onClose={() => setAssignStudent(null)}
        student={assignStudent}
        counselors={counselors}
        onSubmit={handleAssignCounselor}
      />

      <StudentDetailDrawer
        open={Boolean(detailStudent)}
        onClose={() => setDetailStudent(null)}
        student={detailStudent}
        counselors={counselors}
        organizationName={detailStudent ? orgName(detailStudent.organizationId, organizations) : '—'}
        onAssign={(student) => {
          setDetailStudent(null);
          setAssignStudent(student);
        }}
        onAddNote={isCounselorView ? handleAddNote : undefined}
        viewerRole={isCounselorView ? 'counselor' : 'admin'}
        canAssign={canAssignStudents}
      />

      <CounselorDetailDrawer
        open={Boolean(detailCounselor)}
        onClose={() => setDetailCounselor(null)}
        counselor={detailCounselor}
        organizationName={detailCounselor ? orgName(detailCounselor.organizationId, organizations) : '—'}
        assignedStudents={
          detailCounselor ? students.filter((s) => s.assignedCounselorId === detailCounselor.id) : []
        }
        onEdit={setEditCounselor}
        onRegenerate={setRegenerateCounselor}
        onDelete={setDeleteCounselor}
        canManage={canManageCounselors}
      />

      <OrganizationDetailDrawer
        open={Boolean(detailOrganization)}
        onClose={() => setDetailOrganization(null)}
        organization={detailOrganization}
        onEdit={(org) => setOrgForm({ open: true, mode: 'edit', organization: org })}
        onToggleStatus={setToggleOrg}
        canManage={canManageOrganizations}
      />
    </div>
  );
}
