import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { api } from '../lib/api.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { FiltersBar } from '../ui/users/FiltersBar.jsx';
import { UsersTable } from '../ui/users/UsersTable.jsx';
import { Pagination } from '../ui/users/Pagination.jsx';

function toISODateString(d) {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toISOString();
}

export function UsersPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);

  const [premium, setPremium] = useState('all'); // all|true|false
  const [role, setRole] = useState('all'); // all|admin|user
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [data, setData] = useState({ users: [], total: 0, totalPages: 1, page: 1, limit: 20 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const selectedCount = selectedIds.size;

  const lastRequestId = useRef(0);

  const params = useMemo(
    () => ({
      q: debouncedQuery?.trim() ? debouncedQuery.trim() : undefined,
      premium,
      role,
      page,
      limit,
    }),
    [debouncedQuery, premium, role, page, limit]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, premium, role, limit]);

  const fetchUsers = useCallback(async () => {
    const requestId = ++lastRequestId.current;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/users', { params });
      if (requestId !== lastRequestId.current) return;
      setData(res.data);
    } catch (err) {
      if (requestId !== lastRequestId.current) return;
      const msg = err?.response?.data?.message || 'Failed to load users';
      setError(msg);
    } finally {
      if (requestId === lastRequestId.current) setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Keep selection stable across refetches, but drop ids that no longer exist on current page.
  useEffect(() => {
    setSelectedIds((prev) => {
      if (!prev.size) return prev;
      const pageIds = new Set(data.users.map((u) => u.id));
      const next = new Set();
      for (const id of prev) if (pageIds.has(id)) next.add(id);
      return next;
    });
  }, [data.users]);

  const allIdsOnPage = useMemo(() => data.users.map((u) => u.id), [data.users]);
  const allSelectedOnPage = useMemo(() => {
    if (!allIdsOnPage.length) return false;
    return allIdsOnPage.every((id) => selectedIds.has(id));
  }, [allIdsOnPage, selectedIds]);

  const someSelectedOnPage = useMemo(() => {
    if (!allIdsOnPage.length) return false;
    return allIdsOnPage.some((id) => selectedIds.has(id)) && !allSelectedOnPage;
  }, [allIdsOnPage, selectedIds, allSelectedOnPage]);

  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const shouldSelectAll = !allIdsOnPage.every((id) => next.has(id));
      if (shouldSelectAll) allIdsOnPage.forEach((id) => next.add(id));
      else allIdsOnPage.forEach((id) => next.delete(id));
      return next;
    });
  }, [allIdsOnPage]);

  const toggleSelectOne = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setUserPremiumOptimistic = useCallback(async (id, nextPremium) => {
    // Optimistic UI update
    setData((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === id ? { ...u, isPremium: nextPremium } : u)),
    }));

    try {
      await api.patch(`/api/users/${id}/premium`, { isPremium: nextPremium });
      toast.success(nextPremium ? 'Premium enabled' : 'Premium disabled');
    } catch (err) {
      // Rollback
      setData((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === id ? { ...u, isPremium: !nextPremium } : u)),
      }));
      toast.error(err?.response?.data?.message || 'Failed to update premium');
    }
  }, []);

  const bulkSetPremiumOptimistic = useCallback(
    async (nextPremium) => {
      const ids = Array.from(selectedIds);
      if (!ids.length) return;

      const previousById = new Map();
      setData((prev) => {
        const nextUsers = prev.users.map((u) => {
          if (!selectedIds.has(u.id)) return u;
          previousById.set(u.id, u.isPremium);
          return { ...u, isPremium: nextPremium };
        });
        return { ...prev, users: nextUsers };
      });

      try {
        await api.patch('/api/users/premium/bulk', { userIds: ids, isPremium: nextPremium });
        toast.success(nextPremium ? 'Premium granted (bulk)' : 'Premium removed (bulk)');
        setSelectedIds(new Set());
      } catch (err) {
        setData((prev) => ({
          ...prev,
          users: prev.users.map((u) => {
            if (!previousById.has(u.id)) return u;
            return { ...u, isPremium: previousById.get(u.id) };
          }),
        }));
        toast.error(err?.response?.data?.message || 'Bulk update failed');
      }
    },
    [selectedIds]
  );

  const users = useMemo(
    () =>
      data.users.map((u) => ({
        ...u,
        createdAtISO: toISODateString(u.createdAt),
      })),
    [data.users]
  );

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold">Users Management</div>
        <div className="text-sm text-slate-600">Manage premium access for real users from MongoDB Atlas.</div>
      </div>

      <FiltersBar
        query={query}
        onQueryChange={setQuery}
        premium={premium}
        onPremiumChange={setPremium}
        role={role}
        onRoleChange={setRole}
        limit={limit}
        onLimitChange={setLimit}
        selectedCount={selectedCount}
        onBulkGrant={() => bulkSetPremiumOptimistic(true)}
        onBulkRemove={() => bulkSetPremiumOptimistic(false)}
        loading={loading}
      />

      {error ? (
        <div className="rounded-xl border bg-white p-4 text-sm text-red-700">
          <div className="font-semibold">Couldn’t load users</div>
          <div className="mt-1 text-red-600">{error}</div>
          <button
            className="mt-3 rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
            onClick={fetchUsers}
          >
            Retry
          </button>
        </div>
      ) : (
        <UsersTable
          users={users}
          loading={loading}
          selectedIds={selectedIds}
          allSelectedOnPage={allSelectedOnPage}
          someSelectedOnPage={someSelectedOnPage}
          onToggleSelectAll={toggleSelectAllOnPage}
          onToggleSelectOne={toggleSelectOne}
          onTogglePremium={setUserPremiumOptimistic}
        />
      )}

      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        total={data.total}
        limit={data.limit}
        onPageChange={setPage}
      />
    </div>
  );
}

