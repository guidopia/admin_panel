import React, { useEffect } from 'react';

export function StatusBadge({ status }) {
  const normalized = String(status || '').toLowerCase();
  const active = normalized === 'active';
  return (
    <span className={active ? 'chip-solid' : 'chip-muted'}>
      <span
        aria-hidden
        className={[
          'mr-1 inline-block h-1.5 w-1.5 rounded-full',
          active ? 'bg-white' : 'bg-neutral-400',
        ].join(' ')}
      />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

export function ReferralCodeBadge({ code }) {
  if (!code) return <span className="text-[13px] text-neutral-400">—</span>;
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-mono text-[12px] font-semibold tracking-wider text-neutral-800">
      {code}
    </span>
  );
}

export function AssignmentBadge({ assigned, counselorName: name }) {
  if (assigned && name) {
    return <span className="chip-outline">{name}</span>;
  }
  return (
    <span className="chip bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200/80">
      Unassigned
    </span>
  );
}

export function SkeletonBadge() {
  return <div className="skeleton h-5 w-16 rounded-full" />;
}

export function ModalShell({ open, title, description, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-neutral-900/25 backdrop-blur-[1px]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
        <div className="border-b border-neutral-100 px-5 py-4">
          <div className="text-[15px] font-semibold text-neutral-900">{title}</div>
          {description ? (
            <p className="mt-1 text-[12.5px] leading-relaxed text-neutral-500">{description}</p>
          ) : null}
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-neutral-100 bg-neutral-50/60 px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function DrawerShell({ open, title, subtitle, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={[
          'fixed inset-0 z-40 bg-neutral-900/20 backdrop-blur-[1px] transition-opacity',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={onClose}
      />
      <aside
        className={[
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-neutral-200 bg-white shadow-2xl transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        aria-hidden={!open}
      >
        <div className="flex items-start justify-between border-b border-neutral-100 px-5 py-4">
          <div className="min-w-0 pr-4">
            <div className="text-[15px] font-semibold text-neutral-900">{title}</div>
            {subtitle ? (
              <div className="mt-0.5 truncate text-[12px] text-neutral-500">{subtitle}</div>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="btn-quiet h-8 w-8 justify-center p-0">
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">{children}</div>
        {footer ? (
          <div className="border-t border-neutral-100 bg-neutral-50/60 px-5 py-3">{footer}</div>
        ) : null}
      </aside>
    </>
  );
}

export function FieldRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-100 py-2.5 last:border-b-0">
      <dt className="shrink-0 text-[12px] font-medium text-neutral-500">{label}</dt>
      <dd
        className={[
          'min-w-0 text-right text-[13px] text-neutral-900',
          mono ? 'font-mono text-[12px]' : '',
        ].join(' ')}
      >
        {value || '—'}
      </dd>
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-neutral-200 bg-neutral-50 text-neutral-400">
        ∅
      </div>
      <div className="text-[14px] font-semibold text-neutral-900">{title}</div>
      <p className="mt-1 max-w-sm text-[13px] text-neutral-500">{description}</p>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, className = '' }) {
  return (
    <div className={`relative min-w-0 flex-1 ${className}`}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input h-9 pl-8"
      />
    </div>
  );
}
