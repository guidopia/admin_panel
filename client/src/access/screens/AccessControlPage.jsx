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
import {
  ADMINS as INITIAL_ADMINS,
  ANALYTICS,
  COUNSELORS as INITIAL_COUNSELORS,
  ORGANIZATIONS as INITIAL_ORGANIZATIONS,
  ROLES,
  STUDENTS as INITIAL_STUDENTS,
  generateReferralCode,
  orgName,
} from '../mockData.js';
import { AccessTabs } from '../ui/AccessTabs.jsx';
import { AdminsPanel } from '../ui/AdminsPanel.jsx';
import { AddCounselorModal } from '../ui/AddCounselorModal.jsx';
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

const DEMO_ORG_ID = 'org_1';

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
        <button type="button" className="btn-ghost h-9 px-3 text-[12px]" disabled title="Backend integration pending">
          Export CSV
        </button>
        <button type="button" className="btn-primary h-9 px-3 text-[12px]" disabled title="Backend integration pending">
          Export PDF
        </button>
      </div>
    </div>
  );
}

function countAssignedStudents(counselorId, studentList) {
  return studentList.filter((s) => s.assignedCounselorId === counselorId).length;
}

function syncOrganizationCounts(orgs, counselorList, studentList) {
  return orgs.map((org) => ({
    ...org,
    counselorCount: counselorList.filter((c) => c.organizationId === org.id).length,
    studentCount: studentList.filter((s) => s.organizationId === org.id).length,
  }));
}

export function AccessControlPage() {
  const { user } = useAuth();
  const accessRole = getAccessRole(user);
  const organizationId = getAccessOrganizationId(user) || DEMO_ORG_ID;
  const counselorId = getAccessCounselorId(user);

  const [activeTab, setActiveTab] = useState(() => initialTabForRole(accessRole));

  const [organizations, setOrganizations] = useState(INITIAL_ORGANIZATIONS);
  const [admins] = useState(INITIAL_ADMINS);
  const [counselors, setCounselors] = useState(INITIAL_COUNSELORS);
  const [students, setStudents] = useState(INITIAL_STUDENTS);

  const [orgQuery, setOrgQuery] = useState('');
  const [adminQuery, setAdminQuery] = useState('');
  const [counselorQuery, setCounselorQuery] = useState('');
  const [studentQuery, setStudentQuery] = useState('');
  const [unassignedQuery, setUnassignedQuery] = useState('');

  const [addCounselorOpen, setAddCounselorOpen] = useState(false);
  const [createdCounselor, setCreatedCounselor] = useState(null);
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

  const demoOrganization = useMemo(
    () => organizations.find((o) => o.id === organizationId) || organizations[0],
    [organizations, organizationId]
  );

  const scopedCounselors = useMemo(() => {
    if (isSuperAdmin(user)) return counselors;
    if (isOrgAdmin(user)) return counselors.filter((c) => c.organizationId === organizationId);
    return [];
  }, [counselors, user, organizationId]);

  const scopedStudents = useMemo(() => {
    if (isSuperAdmin(user)) return students;
    if (isOrgAdmin(user)) return students.filter((s) => s.organizationId === organizationId);
    const myCode = counselors.find((c) => c.id === counselorId)?.referralCode;
    if (counselorId) {
      return students.filter(
        (s) => s.assignedCounselorId === counselorId || (myCode && s.referralCodeEntered === myCode)
      );
    }
    return [];
  }, [students, user, organizationId, counselorId, counselors]);

  const tabs = useMemo(() => {
    if (isSuperAdmin(user)) {
      return SUPER_ADMIN_TABS.map((tab) => {
        if (tab.id === 'organizations') return { ...tab, count: organizations.length };
        if (tab.id === 'admins') return { ...tab, count: admins.length };
        if (tab.id === 'counselors') return { ...tab, count: counselors.length };
        if (tab.id === 'students') return { ...tab, count: students.length };
        return tab;
      });
    }
    if (isOrgAdmin(user)) {
      const orgStudents = students.filter((s) => s.organizationId === organizationId);
      return WL_ADMIN_TABS.map((tab) => {
        if (tab.id === 'counselors') return { ...tab, count: scopedCounselors.length };
        if (tab.id === 'students') return { ...tab, count: orgStudents.length };
        if (tab.id === 'unassigned') {
          return { ...tab, count: orgStudents.filter((s) => !s.assignedCounselorId).length };
        }
        return tab;
      });
    }
    return COUNSELOR_TABS.map((tab) =>
      tab.id === 'my-students' ? { ...tab, count: scopedStudents.length } : tab
    );
  }, [user, organizations, admins, counselors, students, scopedCounselors, scopedStudents, organizationId]);

  const syncCounselorCounts = useCallback((nextStudents) => {
    setCounselors((prev) => {
      const nextCounselors = prev.map((c) => ({
        ...c,
        studentCount: countAssignedStudents(c.id, nextStudents),
      }));
      setOrganizations((orgs) => syncOrganizationCounts(orgs, nextCounselors, nextStudents));
      return nextCounselors;
    });
  }, []);

  const syncCounselorOrgCounts = useCallback(
    (nextCounselors, studentList = students) => {
      setOrganizations((orgs) => syncOrganizationCounts(orgs, nextCounselors, studentList));
    },
    [students]
  );

  const handleAddCounselor = useCallback(
    (form) => {
      const referralCode = generateReferralCode(form.name);
      const newCounselor = {
        id: `csl_${Date.now()}`,
        organizationId: organizationId,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        referralCode,
        status: 'active',
        studentCount: 0,
        createdAt: new Date().toISOString(),
      };
      setCounselors((prev) => {
        const next = [newCounselor, ...prev];
        syncCounselorOrgCounts(next);
        return next;
      });
      setCreatedCounselor(newCounselor);
    },
    [organizationId, syncCounselorOrgCounts]
  );

  const handleEditCounselor = useCallback((id, form) => {
    setCounselors((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              name: form.name.trim(),
              email: form.email.trim().toLowerCase(),
              phone: form.phone.trim(),
              status: form.status,
            }
          : c
      )
    );
    setDetailCounselor((prev) => (prev?.id === id ? { ...prev, ...form } : prev));
    toast.success('Counselor updated');
  }, []);

  const handleDeleteCounselor = useCallback((counselor) => {
    setStudents((prev) => {
      const nextStudents = prev.map((s) =>
        s.assignedCounselorId === counselor.id
          ? { ...s, assignedCounselorId: null, referralCodeEntered: s.referralCodeEntered }
          : s
      );
      setCounselors((prevCounselors) => {
        const nextCounselors = prevCounselors
          .filter((c) => c.id !== counselor.id)
          .map((c) => ({ ...c, studentCount: countAssignedStudents(c.id, nextStudents) }));
        setOrganizations((orgs) => syncOrganizationCounts(orgs, nextCounselors, nextStudents));
        return nextCounselors;
      });
      return nextStudents;
    });
    setDeleteCounselor(null);
    setDetailCounselor(null);
    toast.success(`${counselor.name} deleted · assigned students are now unassigned`);
  }, []);

  const handleRegenerateCode = useCallback((counselor) => {
    const newCode = generateReferralCode(counselor.name);
    setCounselors((prev) =>
      prev.map((c) => (c.id === counselor.id ? { ...c, referralCode: newCode } : c))
    );
    setDetailCounselor((prev) => (prev?.id === counselor.id ? { ...prev, referralCode: newCode } : prev));
    setRegenerateCounselor(null);
    toast.success(`New referral code: ${newCode}`);
  }, []);

  const handleAssignCounselor = useCallback(
    (studentId, counselorIdValue) => {
      const counselor = counselors.find((c) => c.id === counselorIdValue);
      setStudents((prev) => {
        const next = prev.map((s) =>
          s.id === studentId
            ? {
                ...s,
                assignedCounselorId: counselorIdValue,
                referralCodeEntered: s.referralCodeEntered || counselor?.referralCode || null,
                registrationType: s.registrationType || 'referral',
              }
            : s
        );
        syncCounselorCounts(next);
        return next;
      });
      setDetailStudent((prev) =>
        prev?.id === studentId
          ? {
              ...prev,
              assignedCounselorId: counselorIdValue,
              referralCodeEntered: prev.referralCodeEntered || counselor?.referralCode || null,
            }
          : prev
      );
      toast.success(`Student assigned to ${counselor?.name || 'counselor'}`);
    },
    [counselors, syncCounselorCounts]
  );

  const handleSaveOrganization = useCallback(
    (form) => {
      if (orgForm.mode === 'edit' && orgForm.organization) {
        setOrganizations((prev) =>
          prev.map((o) =>
            o.id === orgForm.organization.id
              ? {
                  ...o,
                  name: form.name.trim(),
                  branding: form.branding.trim(),
                  primaryColor: form.primaryColor,
                  logoUrl: form.logoUrl.trim(),
                  status: form.status,
                }
              : o
          )
        );
        toast.success('Organization updated');
      } else {
        const newOrg = {
          id: `org_${Date.now()}`,
          name: form.name.trim(),
          branding: form.branding.trim(),
          primaryColor: form.primaryColor,
          logoUrl: form.logoUrl.trim(),
          status: 'active',
          adminCount: 0,
          counselorCount: 0,
          studentCount: 0,
          createdAt: new Date().toISOString(),
        };
        setOrganizations((prev) => [newOrg, ...prev]);
        toast.success('Organization created');
      }
    },
    [orgForm]
  );

  const handleToggleOrganization = useCallback((organization) => {
    const nextStatus = organization.status === 'active' ? 'inactive' : 'active';
    setOrganizations((prev) =>
      prev.map((o) => (o.id === organization.id ? { ...o, status: nextStatus } : o))
    );
    setToggleOrg(null);
    setDetailOrganization(null);
    toast.success(`Organization ${nextStatus === 'active' ? 'activated' : 'deactivated'}`);
  }, []);

  const canManageOrganizations = isSuperAdmin(user);
  const canManageCounselors = isOrgAdmin(user);
  const canAssignStudents = isOrgAdmin(user);
  const isCounselorView = isCounselor(user);
  const showOrgColumn = isSuperAdmin(user);
  const showCounselorsTab = isSuperAdmin(user) || isOrgAdmin(user);

  return (
    <div className="space-y-5 pb-10">
      <header className="space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[20px] font-semibold tracking-tight text-neutral-900">Access Control</h1>
            <span className="chip-outline">{accessRoleLabel(accessRole)}</span>
            <span className="chip bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200/80">
              UI skeleton
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-neutral-500">
            {isSuperAdmin(user)
              ? 'Platform-wide view. See all organizations, counselors, and students. Creating counselors is handled by Organization Admins only.'
              : null}
            {isOrgAdmin(user)
              ? `Organization Admin for ${demoOrganization?.name}. Create counselors with referral codes and manage your students.`
              : null}
            {isCounselorView
              ? 'Counselor view. You only see students who onboarded with your referral code.'
              : null}
          </p>
        </div>

        {isSuperAdmin(user) ? <StatCards stats={ANALYTICS} /> : null}

        {!isSuperAdmin(user) ? (
          <div className="surface-flat px-4 py-3 text-[12.5px] text-neutral-600">
            Signed in as <span className="font-medium text-neutral-900">{user?.name || user?.email}</span>
            {isOrgAdmin(user) ? (
              <> · <span className="font-medium text-neutral-900">{demoOrganization?.name}</span></>
            ) : null}
          </div>
        ) : null}

        <AccessTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
      </header>

      {activeTab === 'organizations' && isSuperAdmin(user) ? (
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

      {activeTab === 'admins' && isSuperAdmin(user) ? (
        <AdminsPanel admins={admins} organizations={organizations} query={adminQuery} onQueryChange={setAdminQuery} />
      ) : null}

      {activeTab === 'profile' && isOrgAdmin(user) ? (
        <OrganizationProfilePanel
          organization={demoOrganization}
          onEdit={() => setOrgForm({ open: true, mode: 'edit', organization: demoOrganization })}
          analytics={
            <OrganizationAnalyticsPanel
              organization={demoOrganization}
              students={students}
              counselors={counselors}
            />
          }
        />
      ) : null}

      {activeTab === 'analytics' && isOrgAdmin(user) ? (
        <OrganizationAnalyticsPanel
          organization={demoOrganization}
          students={students}
          counselors={counselors}
        />
      ) : null}

      {activeTab === 'counselors' && showCounselorsTab ? (
        <CounselorsPanel
          counselors={scopedCounselors}
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

      {(activeTab === 'students' || activeTab === 'my-students') && (
        <StudentsPanel
          students={scopedStudents}
          counselors={counselors}
          organizations={organizations}
          query={studentQuery}
          onQueryChange={setStudentQuery}
          onSelectStudent={setDetailStudent}
          onAssignStudent={canAssignStudents ? setAssignStudent : undefined}
          showOrgColumn={showOrgColumn}
          showAssignActions={canAssignStudents}
        />
      )}

      {activeTab === 'unassigned' && isOrgAdmin(user) ? (
        <StudentsPanel
          students={scopedStudents}
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

      {activeTab === 'referrals' && isSuperAdmin(user) ? <ReferralSystemPanel /> : null}

      {activeTab === 'analytics' && isSuperAdmin(user) ? <AnalyticsPanel stats={ANALYTICS} /> : null}

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

      <AddCounselorModal
        open={addCounselorOpen}
        onClose={() => setAddCounselorOpen(false)}
        organizations={organizations.filter((o) => o.id === organizationId)}
        onSubmit={handleAddCounselor}
        hideOrganizationSelect
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
        assignedStudentCount={deleteCounselor ? countAssignedStudents(deleteCounselor.id, students) : 0}
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
