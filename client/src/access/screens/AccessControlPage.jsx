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
import {
  AddAdminModal,
  CredentialsModal,
  DeleteAdminModal,
  EditAdminModal,
} from '../ui/AdminModals.jsx';
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
  DeleteOrganizationModal,
  EditCounselorModal,
  OrganizationFormModal,
} from '../ui/FormModals.jsx';
import { OrganizationAnalyticsPanel } from '../ui/OrganizationAnalyticsPanel.jsx';
import { OrganizationProfilePanel } from '../ui/OrganizationProfilePanel.jsx';
import { OrganizationsPanel } from '../ui/OrganizationsPanel.jsx';
import { ReferralCodeSuccessModal, RegenerateReferralModal } from '../ui/ReferralModals.jsx';
import { ReferralSystemPanel } from '../ui/ReferralSystemPanel.jsx';
import { StudentsPanel } from '../ui/StudentsPanel.jsx';

const SUPER_ADMIN_TABS = [
  { id: 'organizations', label: 'Organizations' },
  { id: 'admins', label: 'Admins' },
  { id: 'counselors', label: 'Counselors' },
  { id: 'students', label: 'Students' },
  { id: 'unassigned', label: 'Unassigned' },
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
  const [editAdmin, setEditAdmin] = useState(null);
  const [deleteAdmin, setDeleteAdmin] = useState(null);
  const [assignStudent, setAssignStudent] = useState(null);
  const [detailStudent, setDetailStudent] = useState(null);
  const [detailOrganization, setDetailOrganization] = useState(null);
  const [detailCounselor, setDetailCounselor] = useState(null);

  const [orgForm, setOrgForm] = useState({ open: false, mode: 'create', organization: null });
  const [editCounselor, setEditCounselor] = useState(null);
  const [deleteCounselor, setDeleteCounselor] = useState(null);
  const [regenerateCounselor, setRegenerateCounselor] = useState(null);
  const [toggleOrg, setToggleOrg] = useState(null);
  const [deleteOrg, setDeleteOrg] = useState(null);

  useEffect(() => {
    setActiveTab(initialTabForRole(accessRole));
  }, [accessRole]);

  const load = useCallback(async ({ silent = false, withAnalytics = true } = {}) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }
    try {
      if (isSuper) {
        const requests = [
          accessApi.listOrganizations(),
          accessApi.listAdmins(),
          accessApi.listCounselors(),
          accessApi.listStudents(),
        ];
        if (withAnalytics) requests.unshift(accessApi.getAnalytics());
        const results = await Promise.all(requests);
        if (withAnalytics) {
          const [analyticsData, orgs, adminList, counselorList, studentList] = results;
          setAnalytics(analyticsData);
          setOrganizations(orgs);
          setAdmins(adminList);
          setCounselors(counselorList);
          setStudents(studentList);
        } else {
          const [orgs, adminList, counselorList, studentList] = results;
          setOrganizations(orgs);
          setAdmins(adminList);
          setCounselors(counselorList);
          setStudents(studentList);
        }
      } else if (isWL) {
        const requests = [
          accessApi.getCurrentOrganization(),
          accessApi.listCounselors(),
          accessApi.listStudents(),
        ];
        if (withAnalytics) requests.unshift(accessApi.getAnalytics());
        const results = await Promise.all(requests);
        if (withAnalytics) {
          const [analyticsData, org, counselorList, studentList] = results;
          setAnalytics(analyticsData);
          setOrganizations(org ? [org] : []);
          setCounselors(counselorList);
          setStudents(studentList);
        } else {
          const [org, counselorList, studentList] = results;
          setOrganizations(org ? [org] : []);
          setCounselors(counselorList);
          setStudents(studentList);
        }
      } else {
        const requests = [accessApi.listCounselors(), accessApi.listStudents()];
        if (withAnalytics) requests.unshift(accessApi.getAnalytics());
        const results = await Promise.all(requests);
        if (withAnalytics) {
          const [analyticsData, counselorList, studentList] = results;
          setAnalytics(analyticsData);
          setCounselors(counselorList);
          setStudents(studentList);
        } else {
          const [counselorList, studentList] = results;
          setCounselors(counselorList);
          setStudents(studentList);
        }
      }
    } catch (err) {
      if (!silent) setError(accessApiError(err, 'Failed to load access control data'));
      else toast.error(accessApiError(err, 'Refresh failed'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isSuper, isWL]);

  useEffect(() => {
    load({ silent: false, withAnalytics: true });
  }, [load]);

  const bumpOrgCount = useCallback((orgId, field, delta) => {
    if (!orgId || !delta) return;
    setOrganizations((prev) =>
      prev.map((o) =>
        o.id === orgId
          ? { ...o, [field]: Math.max(0, (Number(o[field]) || 0) + delta) }
          : o
      )
    );
  }, []);

  const bumpCounselorStudentCount = useCallback((counselorIdValue, delta) => {
    if (!counselorIdValue || !delta) return;
    setCounselors((prev) =>
      prev.map((c) =>
        c.id === counselorIdValue
          ? { ...c, studentCount: Math.max(0, (Number(c.studentCount) || 0) + delta) }
          : c
      )
    );
  }, []);

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
        if (tab.id === 'unassigned') {
          return { ...tab, count: students.filter((s) => !s.assignedCounselorId).length };
        }
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
        setAddCounselorOpen(false);
        setCreatedCounselor({ ...res.counselor, temporaryPassword: res.temporaryPassword });
        if (res.counselor) {
          setCounselors((prev) => [res.counselor, ...prev]);
          bumpOrgCount(res.counselor.organizationId, 'counselorCount', 1);
          setAnalytics((prev) =>
            prev
              ? {
                  ...prev,
                  totalCounselors: (prev.totalCounselors || 0) + 1,
                }
              : prev
          );
        }
        toast.success('Counselor created');
      } catch (err) {
        toast.error(accessApiError(err));
      }
    },
    [organizationId, bumpOrgCount]
  );

  const handleAddAdmin = useCallback(
    async (form) => {
      try {
        const res = await accessApi.createAdmin(form);
        setAddAdminOpen(false);
        setCreatedAdmin({ ...res.admin, temporaryPassword: res.temporaryPassword });
        if (res.admin) {
          setAdmins((prev) => [res.admin, ...prev]);
          bumpOrgCount(res.admin.organizationId, 'adminCount', 1);
        }
        toast.success('Admin created');
      } catch (err) {
        toast.error(accessApiError(err));
      }
    },
    [bumpOrgCount]
  );

  const handleEditAdmin = useCallback(async (id, form) => {
    try {
      const updated = await accessApi.updateAdmin(id, form);
      setAdmins((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setEditAdmin(null);
      toast.success('Admin updated');
    } catch (err) {
      toast.error(accessApiError(err));
    }
  }, []);

  const handleDeleteAdmin = useCallback(
    async (admin) => {
      try {
        await accessApi.deleteAdmin(admin.id);
        setDeleteAdmin(null);
        setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
        bumpOrgCount(admin.organizationId, 'adminCount', -1);
        toast.success(`${admin.name} deleted`);
      } catch (err) {
        toast.error(accessApiError(err));
      }
    },
    [bumpOrgCount]
  );

  const handleEditCounselor = useCallback(async (id, form) => {
    try {
      const updated = await accessApi.updateCounselor(id, form);
      setDetailCounselor((prev) => (prev?.id === id ? updated : prev));
      setCounselors((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditCounselor(null);
      toast.success('Counselor updated');
    } catch (err) {
      toast.error(accessApiError(err));
    }
  }, []);

  const handleDeleteCounselor = useCallback(
    async (counselor) => {
      try {
        await accessApi.deleteCounselor(counselor.id);
        setDeleteCounselor(null);
        setDetailCounselor(null);
        setCounselors((prev) => prev.filter((c) => c.id !== counselor.id));
        setStudents((prev) =>
          prev.map((s) =>
            s.assignedCounselorId === counselor.id ? { ...s, assignedCounselorId: null } : s
          )
        );
        bumpOrgCount(counselor.organizationId, 'counselorCount', -1);
        setAnalytics((prev) => {
          if (!prev) return prev;
          const freed = Number(counselor.studentCount) || 0;
          return {
            ...prev,
            totalCounselors: Math.max(0, (prev.totalCounselors || 0) - 1),
            unassignedStudents: (prev.unassignedStudents || 0) + freed,
          };
        });
        toast.success(`${counselor.name} deleted · assigned students are now unassigned`);
      } catch (err) {
        toast.error(accessApiError(err));
      }
    },
    [bumpOrgCount]
  );

  const handleRegenerateCode = useCallback(async (counselor) => {
    try {
      const updated = await accessApi.regenerateReferralCode(counselor.id);
      setDetailCounselor((prev) => (prev?.id === counselor.id ? updated : prev));
      setCounselors((prev) => prev.map((c) => (c.id === counselor.id ? updated : c)));
      setRegenerateCounselor(null);
      toast.success('Referral code regenerated');
    } catch (err) {
      toast.error(accessApiError(err));
    }
  }, []);

  const handleAssignCounselor = useCallback(
    async (studentId, counselorIdValue) => {
      try {
        const previous = students.find((s) => s.id === studentId);
        const prevCounselorId = previous?.assignedCounselorId || null;
        const updated = await accessApi.assignStudent(studentId, counselorIdValue);
        setAssignStudent(null);
        setDetailStudent((prev) => (prev?.id === studentId ? updated : prev));
        setStudents((prev) => prev.map((s) => (s.id === studentId ? updated : s)));
        if (prevCounselorId !== counselorIdValue) {
          bumpCounselorStudentCount(prevCounselorId, -1);
          bumpCounselorStudentCount(counselorIdValue, 1);
          setAnalytics((prev) => {
            if (!prev) return prev;
            let unassigned = prev.unassignedStudents || 0;
            if (!prevCounselorId && counselorIdValue) unassigned = Math.max(0, unassigned - 1);
            if (prevCounselorId && !counselorIdValue) unassigned += 1;
            return { ...prev, unassignedStudents: unassigned };
          });
        }
        const name = counselors.find((c) => c.id === counselorIdValue)?.name;
        toast.success(
          counselorIdValue ? `Student assigned to ${name || 'counselor'}` : 'Student unassigned'
        );
      } catch (err) {
        toast.error(accessApiError(err));
      }
    },
    [counselors, students, bumpCounselorStudentCount]
  );

  const handleAddNote = useCallback(async (studentId, text) => {
    try {
      const updated = await accessApi.addStudentNote(studentId, text);
      setDetailStudent((prev) => (prev?.id === studentId ? updated : prev));
      setStudents((prev) => prev.map((s) => (s.id === studentId ? updated : s)));
      toast.success('Note added');
    } catch (err) {
      toast.error(accessApiError(err));
    }
  }, []);

  const handleSaveOrganization = useCallback(
    async (form) => {
      try {
        if (orgForm.mode === 'edit' && orgForm.organization) {
          const updated = await accessApi.updateOrganization(orgForm.organization.id, {
            name: form.name.trim(),
            branding: form.branding.trim(),
            primaryColor: form.primaryColor,
            logoUrl: form.logoUrl.trim(),
            status: form.status,
          });
          setOrganizations((prev) =>
            prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
          );
          setDetailOrganization((prev) =>
            prev?.id === updated.id ? { ...prev, ...updated } : prev
          );
          setOrgForm({ open: false, mode: 'create', organization: null });
          toast.success('Organization updated');
        } else {
          const created = await accessApi.createOrganization({
            name: form.name.trim(),
            branding: form.branding.trim(),
            primaryColor: form.primaryColor,
            logoUrl: form.logoUrl.trim(),
          });
          setOrganizations((prev) => [created, ...prev]);
          setOrgForm({ open: false, mode: 'create', organization: null });
          setAnalytics((prev) =>
            prev
              ? {
                  ...prev,
                  totalOrganizations: (prev.totalOrganizations || 0) + 1,
                  activeOrganizations: (prev.activeOrganizations || 0) + 1,
                }
              : prev
          );
          toast.success('Organization created');
        }
      } catch (err) {
        toast.error(accessApiError(err));
      }
    },
    [orgForm]
  );

  const handleToggleOrganization = useCallback(async (organization) => {
    try {
      const updated = await accessApi.toggleOrganizationStatus(organization.id);
      const nextStatus = updated.status;
      setOrganizations((prev) =>
        prev.map((o) => (o.id === organization.id ? { ...o, status: nextStatus } : o))
      );
      setDetailOrganization((prev) =>
        prev?.id === organization.id ? { ...prev, status: nextStatus } : prev
      );
      setToggleOrg(null);
      setAnalytics((prev) => {
        if (!prev) return prev;
        const wasActive = organization.status === 'active';
        return {
          ...prev,
          activeOrganizations: Math.max(
            0,
            (prev.activeOrganizations || 0) + (wasActive ? -1 : 1)
          ),
        };
      });
      toast.success(`Organization ${organization.status === 'active' ? 'deactivated' : 'activated'}`);
    } catch (err) {
      toast.error(accessApiError(err));
    }
  }, []);

  const handleDeleteOrganization = useCallback(async (organization) => {
    try {
      const result = await accessApi.deleteOrganization(organization.id);
      setDeleteOrg(null);
      setDetailOrganization(null);
      setOrganizations((prev) => prev.filter((o) => o.id !== organization.id));
      setAdmins((prev) => prev.filter((a) => a.organizationId !== organization.id));
      setCounselors((prev) => prev.filter((c) => c.organizationId !== organization.id));
      setStudents((prev) => prev.filter((s) => s.organizationId !== organization.id));
      setAnalytics((prev) => {
        if (!prev) return prev;
        const removedCounselors = result?.removed?.counselors ?? organization.counselorCount ?? 0;
        const removedStudents = result?.removed?.students ?? organization.studentCount ?? 0;
        return {
          ...prev,
          totalOrganizations: Math.max(0, (prev.totalOrganizations || 0) - 1),
          activeOrganizations:
            organization.status === 'active'
              ? Math.max(0, (prev.activeOrganizations || 0) - 1)
              : prev.activeOrganizations,
          totalCounselors: Math.max(0, (prev.totalCounselors || 0) - removedCounselors),
          totalStudents: Math.max(0, (prev.totalStudents || 0) - removedStudents),
        };
      });
      toast.success(`${organization.name} deleted`);
    } catch (err) {
      toast.error(accessApiError(err));
    }
  }, []);

  const canManageOrganizations = isSuper;
  const canManageCounselors = isSuper || isWL;
  const canManageAdmins = isSuper;
  const canAssignStudents = isSuper || isWL;
  const canAddStudentNotes = isSuper || isWL || isCsl;
  const isCounselorView = isCsl;
  const showOrgColumn = isSuper;
  const showCounselorsTab = isSuper || isWL;
  const showUnassignedTab = isSuper || isWL;

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
              ? 'Manage organizations, admins, counselors, referral codes, and students across the platform.'
              : null}
            {isWL
              ? `Manage counselors, referral codes, and students${currentOrganization ? ` for ${currentOrganization.name}` : ''}.`
              : null}
            {isCounselorView
              ? 'View and support students assigned to you.'
              : null}
          </p>
        </div>

        {isSuper && analytics ? <StatCards stats={analytics} /> : null}

        {!isSuper && (user?.name || currentOrganization) ? (
          <div className="surface-flat px-4 py-3 text-[12.5px] text-neutral-600">
            {user?.name ? (
              <>
                Signed in as <span className="font-medium text-neutral-900">{user.name}</span>
              </>
            ) : null}
            {isWL && currentOrganization ? (
              <>
                {user?.name ? ' · ' : null}
                <span className="font-medium text-neutral-900">{currentOrganization.name}</span>
              </>
            ) : null}
          </div>
        ) : null}

        <AccessTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
      </header>

      {error ? (
        <ErrorState message={error} onRetry={() => load({ silent: false, withAnalytics: true })} />
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
              onDelete={setDeleteOrg}
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
              onEdit={setEditAdmin}
              onDelete={setDeleteAdmin}
              canManage={canManageAdmins}
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

          {activeTab === 'unassigned' && showUnassignedTab ? (
            <StudentsPanel
              students={students}
              counselors={counselors}
              organizations={organizations}
              query={unassignedQuery}
              onQueryChange={setUnassignedQuery}
              onSelectStudent={setDetailStudent}
              onAssignStudent={setAssignStudent}
              showOrgColumn={showOrgColumn}
              unassignedOnly
              title="Unassigned students"
              showAssignActions
            />
          ) : null}

          {activeTab === 'referrals' && isSuper ? (
            <ReferralSystemPanel
              counselors={counselors}
              students={students}
              organizations={organizations}
              onAddCounselor={() => setAddCounselorOpen(true)}
              onRegenerate={setRegenerateCounselor}
              canManage={canManageCounselors}
            />
          ) : null}

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

      <EditAdminModal
        open={Boolean(editAdmin)}
        onClose={() => setEditAdmin(null)}
        admin={editAdmin}
        organizations={organizations}
        onSubmit={handleEditAdmin}
      />

      <DeleteAdminModal
        open={Boolean(deleteAdmin)}
        onClose={() => setDeleteAdmin(null)}
        admin={deleteAdmin}
        onConfirm={handleDeleteAdmin}
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

      <DeleteOrganizationModal
        open={Boolean(deleteOrg)}
        onClose={() => setDeleteOrg(null)}
        organization={deleteOrg}
        onConfirm={handleDeleteOrganization}
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
        onAddNote={canAddStudentNotes ? handleAddNote : undefined}
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
        onDelete={setDeleteOrg}
        canManage={canManageOrganizations}
      />
    </div>
  );
}
