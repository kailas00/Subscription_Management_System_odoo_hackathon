// Thin TanStack Query helpers so every page loads/mutates the same way.
import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

/** Paged list with search/filter state.  const t = useTable('subscriptions', subscriptionsApi.list, { status: 'ACTIVE' }) */
export function useTable(key, fetcher, initialFilters = {}) {
  const [params, setParams] = useState({ page: 1, pageSize: 20, search: '', ...initialFilters });
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null));
  const query = useQuery({ queryKey: [key, clean], queryFn: () => fetcher(clean), placeholderData: keepPreviousData });
  return {
    ...query,
    rows: query.data?.data ?? [],
    meta: query.data?.meta,
    params,
    setParam: (k, v) => setParams((p) => ({ ...p, [k]: v, page: k === 'page' ? v : 1 })),
  };
}

/** Single record: const { data } = useRecord(['subscription', id], () => subscriptionsApi.get(id)) */
export function useRecord(key, fetcher, options = {}) {
  const q = useQuery({ queryKey: key, queryFn: fetcher, ...options });
  return { ...q, record: q.data?.data };
}

/** Mutation with toast + cache invalidation. invalidate: array of query-key prefixes */
export function useAction(fn, { success, invalidate = [], onSuccess } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (res, vars) => {
      if (success) toast.success(typeof success === 'function' ? success(res, vars) : success);
      invalidate.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      onSuccess?.(res, vars);
    },
    onError: (e) => toast.error(e.message),
  });
}
