import React, { useMemo } from 'react';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function ChevronLeftIcon() {
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
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
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
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function Pagination({ page, totalPages, total, limit, onPageChange }) {
  const safeTotalPages = totalPages || 1;
  const safePage = clamp(page || 1, 1, safeTotalPages);

  const rangeText = useMemo(() => {
    if (!total) return 'No results';
    const start = (safePage - 1) * limit + 1;
    const end = Math.min(total, safePage * limit);
    return (
      <>
        <span className="font-medium text-neutral-900">{start}</span>
        <span className="mx-0.5">–</span>
        <span className="font-medium text-neutral-900">{end}</span>
        <span className="mx-1">of</span>
        <span className="font-medium text-neutral-900">{total}</span>
      </>
    );
  }, [safePage, limit, total]);

  const atStart = safePage <= 1;
  const atEnd = safePage >= safeTotalPages;

  return (
    <div className="flex flex-col gap-2 px-1 py-2 md:flex-row md:items-center md:justify-between">
      <div className="text-[12.5px] text-neutral-500">{rangeText}</div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="btn-ghost h-8 w-8 justify-center px-0"
          disabled={atStart}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous page"
          title="Previous page"
        >
          <ChevronLeftIcon />
        </button>

        <div className="inline-flex h-8 items-center rounded-lg border border-neutral-200 bg-white px-2.5 text-[12px] tabular-nums leading-none text-neutral-700">
          <span className="font-semibold text-neutral-900">{safePage}</span>
          <span className="mx-1 text-neutral-300">/</span>
          <span>{safeTotalPages}</span>
        </div>

        <button
          type="button"
          className="btn-ghost h-8 w-8 justify-center px-0"
          disabled={atEnd}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next page"
          title="Next page"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}
