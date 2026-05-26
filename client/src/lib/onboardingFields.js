/** Human-readable labels for onboarding fields (matches prodigy-ai Onboarding model). */

export const ONBOARDING_SECTIONS = {
  common: {
    title: 'Onboarding — general',
    fields: [
      { key: 'phoneNumber', label: 'Phone number' },
      { key: 'studentType', label: 'Student type', format: 'studentType' },
      { key: 'joiningReason', label: 'Why they joined' },
      { key: 'otherReason', label: 'Other reason (details)' },
      { key: 'completedAt', label: 'Completed at', format: 'date' },
    ],
  },
  school: {
    title: 'School details',
    fields: [
      { key: 'schoolClass', label: 'Class' },
      { key: 'schoolStream', label: 'Stream' },
      { key: 'strongestAreas', label: 'Strongest areas', format: 'list' },
      { key: 'learningFormats', label: 'Preferred learning formats', format: 'list' },
      { key: 'motivation', label: 'Motivation' },
      { key: 'futureExcitement', label: 'Future excitement' },
    ],
  },
  college: {
    title: 'College details',
    fields: [
      { key: 'collegeYear', label: 'Year' },
      { key: 'collegeDegree', label: 'Degree' },
      { key: 'otherDegree', label: 'Other degree' },
      { key: 'strengths', label: 'Strengths', format: 'list' },
      { key: 'careerGoals', label: 'Career goals', format: 'list' },
      { key: 'industries', label: 'Industries of interest', format: 'list' },
      { key: 'lifestyle', label: 'Lifestyle preference' },
      { key: 'learningPreference', label: 'Learning preference', format: 'list' },
    ],
  },
};

export function formatStudentType(value) {
  if (!value) return '—';
  if (value === 'school') return 'School student';
  if (value === 'college') return 'College student';
  return String(value);
}

export function formatFieldValue(value, format) {
  if (value === null || value === undefined || value === '') return '—';

  if (format === 'date') {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (format === 'studentType') return formatStudentType(value);

  if (format === 'list') {
    if (Array.isArray(value)) {
      const items = value.map((v) => String(v).trim()).filter(Boolean);
      return items.length ? items.join(', ') : '—';
    }
    return String(value);
  }

  if (Array.isArray(value)) {
    const items = value.map((v) => String(v).trim()).filter(Boolean);
    return items.length ? items.join(', ') : '—';
  }

  return String(value);
}

export function getOnboardingSectionsForStudentType(studentType) {
  const sections = [ONBOARDING_SECTIONS.common];
  if (studentType === 'school') sections.push(ONBOARDING_SECTIONS.school);
  else if (studentType === 'college') sections.push(ONBOARDING_SECTIONS.college);
  else {
    sections.push(ONBOARDING_SECTIONS.school);
    sections.push(ONBOARDING_SECTIONS.college);
  }
  return sections;
}

/** Legacy `onboardingAnswers` Map on User document. */
export function mapLegacyOnboardingAnswers(answers) {
  if (!answers || typeof answers !== 'object') return [];
  const entries = answers instanceof Map ? [...answers.entries()] : Object.entries(answers);
  return entries
    .map(([key, value]) => ({
      key: String(key),
      label: key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (c) => c.toUpperCase())
        .trim(),
      value: formatFieldValue(value),
    }))
    .filter((e) => e.value !== '—');
}
