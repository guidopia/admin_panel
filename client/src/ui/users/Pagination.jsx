import React, { useMemo } from 'react';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function Pagination({ page, totalPages, total, limit, onPageChange }) {
  const safePage = clamp(page || 1, 1, totalPages || 1);

  const rangeText = useMemo(() => {
    if (!total) return '0 results';
    const start = (safePage - 1) * limit + 1;
    const end = Math.min(total, safePage * limit);
    return `${start}-${end} of ${total}`;
  }, [safePage, limit, total]);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-slate-600">{rangeText}</div>

      <div className="flex items-center gap-2">
        <button
          className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          disabled={safePage <= 1}
          onClick={() => onPageChange(1)}
        >
          First
        </button>
        <button
          className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Prev
        </button>
        <div className="px-2 text-sm text-slate-700">
          Page <span className="font-semibold">{safePage}</span> /{' '}
          <span className="font-semibold">{totalPages || 1}</span>
        </div>
        <button
          className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          disabled={safePage >= (totalPages || 1)}
          onClick={() => onPageChange(safePage + 1)}
        >
          Next
        </button>
        <button
          className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          disabled={safePage >= (totalPages || 1)}
          onClick={() => onPageChange(totalPages || 1)}
        >
          Last
        </button>
      </div>
    </div>
  );
}

