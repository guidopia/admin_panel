import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api.js';
import { downloadExport } from '../../lib/downloadExport.js';
import {
  formatFieldValue,
  getOnboardingSectionsForStudentType,
  mapLegacyOnboardingAnswers,
} from '../../lib/onboardingFields.js';
import { ProfileSections } from './ProfileSections.jsx';

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function FieldRow({ label, value }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(0,9rem)_1fr] sm:gap-4 sm:py-0.5">
      <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-neutral-400">{label}</dt>
      <dd className="text-[13px] leading-relaxed text-neutral-800 break-words">{value}</dd>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <section className="surface-flat overflow-hidden">
      <div className="border-b border-neutral-100 bg-neutral-50/80 px-4 py-2.5">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-600">{title}</h3>
      </div>
      <dl className="space-y-3 px-4 py-4">{children}</dl>
    </section>
  );
}

function OnboardingSections({ onboarding }) {
  const sections = useMemo(
    () => getOnboardingSectionsForStudentType(onboarding?.studentType),
    [onboarding?.studentType]
  );

  const rendered = sections
    .map((section) => {
      const rows = section.fields.map((field) => ({
        ...field,
        value: formatFieldValue(onboarding?.[field.key], field.format),
      }));

      const hasAnyValue = rows.some((row) => row.value !== '—');
      if (!hasAnyValue && section.title !== 'Onboarding — general') return null;

      return (
        <SectionCard key={section.title} title={section.title}>
          {rows.map((row) => (
            <FieldRow key={row.key} label={row.label} value={row.value} />
          ))}
        </SectionCard>
      );
    })
    .filter(Boolean);

  if (!rendered.length) {
    return (
      <div className="surface-flat px-4 py-6 text-center text-[12px] text-neutral-500">
        Onboarding record exists but has no saved answers yet.
      </div>
    );
  }

  return <>{rendered}</>;
}

function DrawerSkeleton() {
  return (
    <div className="space-y-4 p-5">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-4 w-64" />
      <div className="surface-flat p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-10 w-full" />
        ))}
      </div>
      <div className="surface-flat p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export function UserDetailDrawer({ userId, open, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/users/${userId}`);
      setData(res.data);
    } catch (err) {
      setData(null);
      setError(err?.response?.data?.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!open || !userId) return undefined;
    fetchDetail();

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, userId, fetchDetail, onClose]);

  useEffect(() => {
    if (!open) {
      setData(null);
      setError('');
    }
  }, [open]);

  const legacyAnswers = useMemo(
    () => mapLegacyOnboardingAnswers(data?.onboardingAnswers),
    [data?.onboardingAnswers]
  );

  const user = data?.user;
  const onboarding = data?.onboarding;
  const futureMeCard = data?.futureMeCard;
  const onboardingComplete = Boolean(user?.onboardingComplete);

  const handleExport = useCallback(
    async (format) => {
      if (!userId) return;
      setExporting(format);
      try {
        const base = (data?.user?.email || data?.user?.name || 'user').replace(/@.*/, '');
        await downloadExport(
          `/api/users/${userId}/export?format=${format}`,
          `${base}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
        );
        toast.success(format === 'pdf' ? 'PDF downloaded' : 'Excel downloaded');
      } catch (err) {
        toast.error(err?.message || 'Export failed');
      } finally {
        setExporting(null);
      }
    },
    [userId, data?.user?.email, data?.user?.name]
  );

  const hasOnboarding = useMemo(() => {
    if (!onboarding) return false;
    const keys = [
      'phoneNumber',
      'studentType',
      'schoolClass',
      'schoolStream',
      'collegeYear',
      'collegeDegree',
      'joiningReason',
      'motivation',
      'lifestyle',
    ];
    return keys.some((k) => {
      const v = onboarding[k];
      if (Array.isArray(v)) return v.length > 0;
      return v != null && String(v).trim() !== '';
    });
  }, [onboarding]);

  return (
    <div
      className={[
        'fixed inset-0 z-50 transition',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      ].join(' ')}
      aria-hidden={!open}
    >
      <div
        className={[
          'absolute inset-0 bg-neutral-900/25 backdrop-blur-[1px] transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        onClick={onClose}
        aria-hidden
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="User details"
        className={[
          'absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-neutral-200 bg-white shadow-2xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              User profile
            </p>
            <h2 className="mt-0.5 truncate text-lg font-semibold tracking-tight text-neutral-900">
              {user?.name || 'User'}
            </h2>
            <p className="truncate font-mono text-[12px] text-neutral-500">{user?.email || '—'}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              disabled={!userId || Boolean(exporting)}
              onClick={() => handleExport('xlsx')}
              className="btn-ghost h-8 px-2 text-[11px]"
              title="Download Excel"
            >
              {exporting === 'xlsx' ? '…' : 'Excel'}
            </button>
            <button
              type="button"
              disabled={!userId || Boolean(exporting)}
              onClick={() => handleExport('pdf')}
              className="btn-ghost h-8 px-2 text-[11px]"
              title="Download PDF"
            >
              {exporting === 'pdf' ? '…' : 'PDF'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-quiet p-2"
              aria-label="Close panel"
            >
              <CloseIcon />
            </button>
          </div>
        </header>

        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <DrawerSkeleton />
          ) : error ? (
            <div className="p-5">
              <div className="surface-flat p-4 text-[13px]">
                <p className="font-semibold text-neutral-900">Couldn’t load details</p>
                <p className="mt-1 text-neutral-500">{error}</p>
                <button type="button" className="btn-ghost mt-3 h-8 px-2.5 text-[12px]" onClick={fetchDetail}>
                  Retry
                </button>
              </div>
            </div>
          ) : user ? (
            <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={user.isPremium ? 'chip-solid' : 'chip-muted'}>
                  {user.isPremium ? 'Premium' : 'Free'}
                </span>
                <span className={onboardingComplete ? 'chip-outline' : 'chip-muted'}>
                  {onboardingComplete ? 'Onboarding complete' : 'Onboarding incomplete'}
                </span>
              </div>

              <ProfileSections user={user} futureMeCard={futureMeCard} />

              <div className="border-t border-neutral-200 pt-2">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                  Onboarding questionnaire
                </p>
              </div>

              {hasOnboarding ? (
                <OnboardingSections onboarding={onboarding} />
              ) : onboardingComplete && legacyAnswers.length === 0 ? (
                <div className="surface-flat px-4 py-8 text-center">
                  <p className="text-sm font-medium text-neutral-900">Onboarding completed</p>
                  <p className="mt-1 text-[12px] text-neutral-500">
                    This user finished onboarding, but their answers were not found in the onboardings
                    collection. Try refreshing, or verify the user exists in the same database as prodigy-ai.
                  </p>
                </div>
              ) : legacyAnswers.length > 0 ? (
                <SectionCard title="Onboarding (legacy)">
                  {legacyAnswers.map((row) => (
                    <FieldRow key={row.key} label={row.label} value={row.value} />
                  ))}
                </SectionCard>
              ) : (
                <div className="surface-flat px-4 py-8 text-center">
                  <p className="text-sm font-medium text-neutral-900">No onboarding data</p>
                  <p className="mt-1 text-[12px] text-neutral-500">
                    This user hasn’t completed onboarding yet, or data wasn’t saved to the database.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
