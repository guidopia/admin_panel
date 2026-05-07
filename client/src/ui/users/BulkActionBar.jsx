import React, { useEffect, useState } from 'react';

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function BulkActionBar({
  selectedCount,
  onBulkGrant,
  onBulkRemove,
  onClear,
  loading,
}) {
  const visible = selectedCount > 0;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return undefined;
    }
    const t = setTimeout(() => setMounted(false), 180);
    return () => clearTimeout(t);
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center px-4"
      role="region"
      aria-label="Bulk actions"
    >
      <div
        className={[
          'pointer-events-auto flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-2 pl-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.18)] transition-all duration-200 ease-out',
          visible
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-2 opacity-0',
        ].join(' ')}
      >
        <div className="flex items-center gap-2 pr-1">
          <span className="grid h-6 min-w-[24px] place-items-center rounded-md bg-neutral-900 px-1.5 text-[11px] font-semibold text-white">
            {selectedCount}
          </span>
          <span className="text-[12px] font-medium text-neutral-700">
            selected
          </span>
        </div>

        <div className="h-5 w-px bg-neutral-200" aria-hidden />

        <button
          type="button"
          onClick={onBulkGrant}
          disabled={loading}
          className="btn-primary h-8 px-2.5 text-[12px]"
        >
          <CheckIcon />
          Grant Premium
        </button>

        <button
          type="button"
          onClick={onBulkRemove}
          disabled={loading}
          className="btn-ghost h-8 px-2.5 text-[12px]"
        >
          <MinusIcon />
          Remove Premium
        </button>

        <div className="h-5 w-px bg-neutral-200" aria-hidden />

        <button
          type="button"
          onClick={onClear}
          className="btn-quiet h-8 px-2 text-[12px]"
          aria-label="Clear selection"
          title="Clear selection"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
