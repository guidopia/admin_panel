export function serializeOrganization(doc, counts = {}) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id),
    name: o.name || '',
    branding: o.branding || '',
    primaryColor: o.primaryColor || '#171717',
    logoUrl: o.logoUrl || '',
    status: o.status || 'active',
    adminCount: counts.adminCount ?? o.adminCount ?? 0,
    counselorCount: counts.counselorCount ?? o.counselorCount ?? 0,
    studentCount: counts.studentCount ?? o.studentCount ?? 0,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
  };
}

export function serializeAccessUser(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id),
    name: o.name || '',
    email: o.email || '',
    accessRole: o.accessRole,
    organizationId: o.organizationId ? String(o.organizationId) : null,
    counselorId: o.counselorId ? String(o.counselorId) : null,
    status: o.status || 'active',
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
  };
}

export function serializeAdmin(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id),
    organizationId: o.organizationId ? String(o.organizationId) : null,
    name: o.name || '',
    email: o.email || '',
    role: 'ADMIN',
    status: o.status || 'active',
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
  };
}

export function serializeCounselor(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id),
    organizationId: o.organizationId ? String(o.organizationId) : null,
    accessUserId: o.accessUserId ? String(o.accessUserId) : null,
    name: o.name || '',
    email: o.email || '',
    phone: o.phone || '',
    referralCode: o.referralCode || '',
    status: o.status || 'active',
    studentCount: o.studentCount ?? 0,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
  };
}

export function serializeStudent(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id),
    organizationId: o.organizationId ? String(o.organizationId) : null,
    assignedCounselorId: o.assignedCounselorId ? String(o.assignedCounselorId) : null,
    referralCodeEntered: o.referralCodeEntered || null,
    name: o.name || '',
    email: o.email || '',
    phone: o.phone || '',
    registrationType: o.registrationType || 'skipped',
    progress: o.progress ?? 0,
    assessments: (o.assessments || []).map((a) => ({
      id: a.id || String(a._id || ''),
      name: a.name || '',
      status: a.status || 'in_progress',
      score: a.score || '—',
    })),
    notes: (o.notes || []).map((n) => ({
      id: n.id || String(n._id || ''),
      author: n.author || '',
      text: n.text || '',
      at: n.at ? new Date(n.at).toISOString() : null,
    })),
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
  };
}
