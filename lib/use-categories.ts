'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import type { UserCategory } from '@/types';

interface CategoriesPayload {
  defaults: string[];
  custom: UserCategory[];
  all: string[];
}

export function useCategories() {
  const [data, setData] = useState<CategoriesPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const d = await apiFetch<CategoriesPayload>('/api/categories');
      setData(d);
    } catch (err) {
      console.error('[useCategories]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function addCustom(cat: UserCategory) {
    setData((prev) => {
      if (!prev) return prev;
      if (prev.all.includes(cat.name)) return prev;
      return {
        defaults: prev.defaults,
        custom: [...prev.custom, cat],
        all: [...prev.all, cat.name],
      };
    });
  }

  function removeCustom(id: string) {
    setData((prev) => {
      if (!prev) return prev;
      const removed = prev.custom.find((c) => c._id === id);
      if (!removed) return prev;
      return {
        defaults: prev.defaults,
        custom: prev.custom.filter((c) => c._id !== id),
        all: prev.all.filter((n) => n !== removed.name),
      };
    });
  }

  return {
    loading,
    options: data?.all ?? [],
    defaults: data?.defaults ?? [],
    custom: data?.custom ?? [],
    refresh,
    addCustom,
    removeCustom,
  };
}
