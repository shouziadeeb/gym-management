import { useState } from 'react';

import type { OwnerMemberStatusFilter } from '@/api/owner-members.api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export function useMemberSearch(defaultPageSize = 20) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OwnerMemberStatusFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const debouncedSearch = useDebouncedValue(search, 350);

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateStatus(value: OwnerMemberStatusFilter) {
    setStatus(value);
    setPage(1);
  }

  function nextPage(total: number) {
    const maxPages = Math.max(1, Math.ceil(total / pageSize));
    setPage((current) => Math.min(current + 1, maxPages));
  }

  function prevPage() {
    setPage((current) => Math.max(1, current - 1));
  }

  return {
    search,
    setSearch: updateSearch,
    debouncedSearch,
    status,
    setStatus: updateStatus,
    page,
    setPage,
    pageSize,
    setPageSize,
    nextPage,
    prevPage,
  };
}
