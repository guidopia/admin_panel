import React, { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

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

const ROLE_OPTIONS = [
  { value: ROLES.SUPER_ADMIN, label: 'Super Admin (Guidopia)' },
  { value: ROLES.WL_ADMIN, label: 'White-label Admin' },
  { value: ROLES.COUNSELOR, label: 'Counselor' },
];

const DEMO_ORG_ID = 'org_1';
const DEMO_COUNSELOR_ID = 'csl_1';

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

function roleLabel(role) {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label || role;
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
  const [previewRole, setPreviewRole] = useState(ROLES.SUPER_ADMIN);
  const [activeTab, setActiveTab] = useState('organizations');

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

  const demoOrganization = useMemo(
    () => organizations.find((o) => o.id === DEMO_ORG_ID) || organizations[0],
    [organizations]
  );

  const scopedCounselors = useMemo(() => {
    if (previewRole === ROLES.SUPER_ADMIN) return counselors;
    return counselors.filter((c) => c.organizationId === DEMO_ORG_ID);
  }, [counselors, previewRole]);

  const scopedStudents = useMemo(() => {
    if (previewRole === ROLES.SUPER_ADMIN) return students;
    if (previewRole === ROLES.WL_ADMIN) return students.filter((s) => s.organizationId === DEMO_ORG_ID);
    return students.filter((s) => s.assignedCounselorId === DEMO_COUNSELOR_ID);
  }, [students, previewRole]);

  const tabs = useMemo(() => {
    if (previewRole === ROLES.SUPER_ADMIN) {
      return SUPER_ADMIN_TABS.map((tab) => {
        if (tab.id === 'organizations') return { ...tab, count: organizations.length };
        if (tab.id === 'admins') return { ...tab, count: admins.length };
        if (tab.id === 'counselors') return { ...tab, count: counselors.length };
        if (tab.id === 'students') return { ...tab, count: students.length };
        return tab;
      });
    }
    if (previewRole === ROLES.WL_ADMIN) {
      const orgStudents = students.filter((s) => s.organizationId === DEMO_ORG_ID);
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
  }, [previewRole, organizations, admins, counselors, students, scopedCounselors, scopedStudents]);

  const handleRoleChange = useCallback((role) => {
    setPreviewRole(role);
    if (role === ROLES.SUPER_ADMIN) setActiveTab('organizations');
    else if (role === ROLES.WL_ADMIN) setActiveTab('profile');
    else setActiveTab('my-students');
    setDetailStudent(null);
    setDetailOrganization(null);
    setDetailCounselor(null);
    setAssignStudent(null);
  }, []);

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

  const syncCounselorOrgCounts = useCallback((nextCounselors, studentList = students) => {
    setOrganizations((orgs) => syncOrganizationCounts(orgs, nextCounselors, studentList));
  }, [students]);

  const handleAddCounselor = useCallback((form) => {
    const referralCode = generateReferralCode(form.name);
    const newCounselor = {
      id: `csl_${Date.now()}`,
      organizationId: form.organizationId,
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
  }, [syncCounselorOrgCounts]);

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
    (studentId, counselorId) => {
      const counselor = counselors.find((c) => c.id === counselorId);
      setStudents((prev) => {
        const next = prev.map((s) =>
          s.id === studentId
            ? {
                ...s,
                assignedCounselorId: counselorId,
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
              assignedCounselorId: counselorId,
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

  const showOrgColumn = previewRole === ROLES.SUPER_ADMIN;
  const canManageCounselors = previewRole !== ROLES.COUNSELOR;
  const canAssignStudents = previewRole !== ROLES.COUNSELOR;
  const isCounselorView = previewRole === ROLES.COUNSELOR;

  return (
    <div className="space-y-5 pb-10">
      <header className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[20px] font-semibold tracking-tight text-neutral-900">Access Control</h1>
              <span className="chip-outline">RBAC + Referrals</span>
              <span className="chip bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200/80">
                UI skeleton
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-neutral-500">
              Full spec coverage: organizations, admins, counselors, referral codes, student assignment flows,
              role-based views. Mock data only — backend integration pending.
            </p>
          </div>

          <div className="surface-flat min-w-[240px] p-3">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
              Preview role
            </label>
            <select
              className="input h-9 text-[13px]"
              value={previewRole}
              onChange={(e) => handleRoleChange(e.target.value)}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {previewRole === ROLES.SUPER_ADMIN ? <StatCards stats={ANALYTICS} /> : null}

        {previewRole !== ROLES.SUPER_ADMIN ? (
          <div className="surface-flat px-4 py-3 text-[12.5px] text-neutral-600">
            Viewing as <span className="font-medium text-neutral-900">{roleLabel(previewRole)}</span>
            {previewRole === ROLES.WL_ADMIN ? (
              <> for <span className="font-medium text-neutral-900">{demoOrganization?.name}</span></>
            ) : null}
            {previewRole === ROLES.COUNSELOR ? <> · Rahul Sharma · assigned students only</> : null}
          </div>
        ) : null}

        <AccessTabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
      </header>

      {activeTab === 'organizations' && previewRole === ROLES.SUPER_ADMIN ? (
        <OrganizationsPanel
          organizations={organizations}
          query={orgQuery}
          onQueryChange={setOrgQuery}
          onSelect={setDetailOrganization}
          onAdd={() => setOrgForm({ open: true, mode: 'create', organization: null })}
          onEdit={(org) => setOrgForm({ open: true, mode: 'edit', organization: org })}
          onToggleStatus={setToggleOrg}
        />
      ) : null}

      {activeTab === 'admins' && previewRole === ROLES.SUPER_ADMIN ? (
        <AdminsPanel admins={admins} organizations={organizations} query={adminQuery} onQueryChange={setAdminQuery} />
      ) : null}

      {activeTab === 'profile' && previewRole === ROLES.WL_ADMIN ? (
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

      {activeTab === 'analytics' && previewRole === ROLES.WL_ADMIN ? (
        <OrganizationAnalyticsPanel
          organization={demoOrganization}
          students={students}
          counselors={counselors}
        />
      ) : null}

      {activeTab === 'counselors' && canManageCounselors ? (
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
          canManage
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

      {activeTab === 'unassigned' && previewRole === ROLES.WL_ADMIN ? (
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

      {activeTab === 'referrals' && previewRole === ROLES.SUPER_ADMIN ? <ReferralSystemPanel /> : null}

      {activeTab === 'analytics' && previewRole === ROLES.SUPER_ADMIN ? <AnalyticsPanel stats={ANALYTICS} /> : null}

      {activeTab === 'reports' ? (
        <ReportsPlaceholder
          title={isCounselorView ? 'My student reports' : 'Organization reports'}
          description={
            isCounselorView
              ? 'Counselors can export reports for their assigned students only.'
              : 'White-label admins can export organization-level student and counselor reports.'
          }
        />
      ) : null}

      <AddCounselorModal
        open={addCounselorOpen}
        onClose={() => setAddCounselorOpen(false)}
        organizations={
          previewRole === ROLES.SUPER_ADMIN
            ? organizations
            : organizations.filter((o) => o.id === DEMO_ORG_ID)
        }
        onSubmit={handleAddCounselor}
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
          detailCounselor
            ? students.filter((s) => s.assignedCounselorId === detailCounselor.id)
            : []
        }
        onEdit={setEditCounselor}
        onRegenerate={setRegenerateCounselor}
        onDelete={setDeleteCounselor}
      />

      <OrganizationDetailDrawer
        open={Boolean(detailOrganization)}
        onClose={() => setDetailOrganization(null)}
        organization={detailOrganization}
        onEdit={(org) => setOrgForm({ open: true, mode: 'edit', organization: org })}
        onToggleStatus={setToggleOrg}
      />
    </div>
  );
}
