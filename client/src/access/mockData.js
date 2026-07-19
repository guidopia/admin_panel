/** UI-only mock data — replace with API integration later. */

export const ROLES = {
  SUPER_ADMIN: 'super-admin',
  WL_ADMIN: 'white-label-admin',
  COUNSELOR: 'counselor',
};

export const ORGANIZATIONS = [
  {
    id: 'org_1',
    name: 'Bright Future Academy',
    branding: 'BFA',
    primaryColor: '#171717',
    logoUrl: '',
    status: 'active',
    adminCount: 2,
    counselorCount: 12,
    studentCount: 340,
    createdAt: '2025-08-12T10:00:00.000Z',
  },
  {
    id: 'org_2',
    name: 'Northstar Counseling',
    branding: 'NSC',
    primaryColor: '#2563eb',
    logoUrl: '',
    status: 'active',
    adminCount: 1,
    counselorCount: 8,
    studentCount: 156,
    createdAt: '2025-10-03T14:30:00.000Z',
  },
  {
    id: 'org_3',
    name: 'Horizon Prep School',
    branding: 'HPS',
    primaryColor: '#7c3aed',
    logoUrl: '',
    status: 'inactive',
    adminCount: 1,
    counselorCount: 4,
    studentCount: 89,
    createdAt: '2025-11-20T09:15:00.000Z',
  },
];

export const ADMINS = [
  {
    id: 'adm_1',
    organizationId: 'org_1',
    name: 'Meera Nair',
    email: 'meera@brightfuture.edu',
    role: 'ADMIN',
    status: 'active',
    createdAt: '2025-08-12T10:00:00.000Z',
  },
  {
    id: 'adm_2',
    organizationId: 'org_1',
    name: 'Arjun Kulkarni',
    email: 'arjun@brightfuture.edu',
    role: 'ADMIN',
    status: 'active',
    createdAt: '2025-08-20T12:00:00.000Z',
  },
  {
    id: 'adm_3',
    organizationId: 'org_2',
    name: 'Deepa Rao',
    email: 'deepa@northstar.io',
    role: 'ADMIN',
    status: 'active',
    createdAt: '2025-10-03T14:30:00.000Z',
  },
  {
    id: 'adm_4',
    organizationId: 'org_3',
    name: 'Sanjay Verma',
    email: 'sanjay@horizonprep.edu',
    role: 'ADMIN',
    status: 'inactive',
    createdAt: '2025-11-20T09:15:00.000Z',
  },
];

export const COUNSELORS = [
  {
    id: 'csl_1',
    organizationId: 'org_1',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@brightfuture.edu',
    phone: '+91 98765 43210',
    referralCode: 'RAH582',
    status: 'active',
    studentCount: 28,
    createdAt: '2025-09-01T08:00:00.000Z',
  },
  {
    id: 'csl_2',
    organizationId: 'org_1',
    name: 'Priya Patel',
    email: 'priya.patel@brightfuture.edu',
    phone: '+91 91234 56789',
    referralCode: 'PRI914',
    status: 'active',
    studentCount: 31,
    createdAt: '2025-09-05T11:20:00.000Z',
  },
  {
    id: 'csl_3',
    organizationId: 'org_2',
    name: 'Ananya Desai',
    email: 'ananya@northstar.io',
    phone: '+91 99887 76655',
    referralCode: 'ANA337',
    status: 'active',
    studentCount: 19,
    createdAt: '2025-10-10T16:45:00.000Z',
  },
  {
    id: 'csl_4',
    organizationId: 'org_2',
    name: 'Vikram Singh',
    email: 'vikram@northstar.io',
    phone: '+91 88776 65544',
    referralCode: 'VIK621',
    status: 'inactive',
    studentCount: 0,
    createdAt: '2025-10-15T09:00:00.000Z',
  },
];

export const STUDENTS = [
  {
    id: 'stu_1',
    organizationId: 'org_1',
    assignedCounselorId: 'csl_1',
    referralCodeEntered: 'RAH582',
    name: 'Aarav Mehta',
    email: 'aarav.mehta@student.in',
    phone: '+91 90001 11111',
    registrationType: 'referral',
    progress: 72,
    assessments: [
      { id: 'as_1', name: 'Career Interest Inventory', status: 'completed', score: 'High alignment · STEM' },
      { id: 'as_2', name: 'Personality Profile', status: 'completed', score: 'INTJ' },
    ],
    notes: [
      { id: 'n_1', author: 'Rahul Sharma', text: 'Interested in computer science programs.', at: '2026-02-10T11:00:00.000Z' },
    ],
    createdAt: '2026-01-08T10:30:00.000Z',
  },
  {
    id: 'stu_2',
    organizationId: 'org_1',
    assignedCounselorId: 'csl_2',
    referralCodeEntered: 'PRI914',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@student.in',
    phone: '+91 90002 22222',
    registrationType: 'referral',
    progress: 45,
    assessments: [{ id: 'as_3', name: 'Aptitude Baseline', status: 'in_progress', score: '—' }],
    notes: [],
    createdAt: '2026-01-12T14:15:00.000Z',
  },
  {
    id: 'stu_3',
    organizationId: 'org_1',
    assignedCounselorId: null,
    referralCodeEntered: null,
    name: 'Kabir Joshi',
    email: 'kabir.joshi@student.in',
    phone: '+91 90003 33333',
    registrationType: 'skipped',
    progress: 12,
    assessments: [],
    notes: [{ id: 'n_2', author: 'Meera Nair', text: 'Awaiting manual counselor assignment.', at: '2026-02-02T09:30:00.000Z' }],
    createdAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'stu_4',
    organizationId: 'org_1',
    assignedCounselorId: null,
    referralCodeEntered: null,
    name: 'Isha Kapoor',
    email: 'isha.kapoor@student.in',
    phone: '+91 90004 44444',
    registrationType: 'skipped',
    progress: 8,
    assessments: [],
    notes: [],
    createdAt: '2026-02-18T16:40:00.000Z',
  },
  {
    id: 'stu_5',
    organizationId: 'org_2',
    assignedCounselorId: 'csl_3',
    referralCodeEntered: 'ANA337',
    name: 'Rohan Gupta',
    email: 'rohan.gupta@student.in',
    phone: '+91 90005 55555',
    registrationType: 'referral',
    progress: 61,
    assessments: [{ id: 'as_4', name: 'Skills Assessment', status: 'completed', score: 'Strong analytical' }],
    notes: [],
    createdAt: '2026-03-02T11:10:00.000Z',
  },
];

export const REFERRAL_CODE_RULES = [
  'Unique across the platform',
  '6–8 characters, uppercase, no spaces',
  'Auto-generated when admin creates a counselor',
  'Immutable by default — admin may regenerate if required',
];

export const ACCESS_PORTALS = [
  {
    id: 'portal_super_admin',
    accessRole: ROLES.SUPER_ADMIN,
    name: 'Guidopia Super Admin',
    demoEmail: 'superadmin@guidopia.com',
  },
  {
    id: 'portal_org_admin',
    accessRole: ROLES.WL_ADMIN,
    name: 'Meera Nair',
    demoEmail: 'meera@brightfuture.edu',
    organizationId: 'org_1',
  },
  {
    id: 'portal_counselor',
    accessRole: ROLES.COUNSELOR,
    name: 'Rahul Sharma',
    demoEmail: 'rahul.sharma@brightfuture.edu',
    organizationId: 'org_1',
    counselorId: 'csl_1',
  },
];

export const ANALYTICS = {
  totalOrganizations: 3,
  activeOrganizations: 2,
  totalCounselors: 24,
  totalStudents: 585,
  unassignedStudents: 42,
  referralConversionRate: 78,
  monthlySignups: [42, 58, 51, 67, 73, 81],
};

export function generateReferralCode(name) {
  const prefix = (name || 'USR')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');
  const suffix = String(Math.floor(100 + Math.random() * 900));
  return `${prefix}${suffix}`;
}

export function orgName(orgId, orgs = ORGANIZATIONS) {
  return orgs.find((o) => o.id === orgId)?.name || '—';
}

export function counselorName(counselorId, counselors = COUNSELORS) {
  if (!counselorId) return null;
  return counselors.find((c) => c.id === counselorId)?.name || '—';
}
