'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useCategories } from '@/lib/use-categories';
import { Skeleton } from '@/components/Skeleton';
import { Spinner } from '@/components/Spinner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Budget, BudgetStatus, Category, UserCategory } from '@/types';
import { formatCurrency } from '@/lib/format';

export default function BudgetsPage() {
  const cats = useCategories();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [statuses, setStatuses] = useState<BudgetStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<Category, string>>({});
  const [savingAll, setSavingAll] = useState(false);
  const [savingCat, setSavingCat] = useState<Category | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ budgets: Budget[]; statuses: BudgetStatus[] }>(
        '/api/budgets'
      );
      setBudgets(data.budgets);
      setStatuses(data.statuses);
      const map: Record<string, string> = {};
      for (const b of data.budgets) map[b.category] = String(b.monthlyLimit);
      setEdits(map);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    // Show every available category (defaults + custom) so user can budget any
    const allCats = cats.options.length > 0 ? cats.options : Object.keys(edits);
    const seen = new Set<string>(allCats);
    // Also include any budgets for categories no longer in options (legacy/edge)
    for (const b of budgets) {
      if (!seen.has(b.category)) {
        allCats.push(b.category);
        seen.add(b.category);
      }
    }
    return allCats;
  }, [cats.options, budgets, edits]);

  function originalFor(cat: Category): string {
    const existing = budgets.find((b) => b.category === cat);
    return existing ? String(existing.monthlyLimit) : '';
  }

  const dirtyItems = useMemo(() => {
    const items: { category: Category; monthlyLimit: number }[] = [];
    for (const cat of rows) {
      const current = edits[cat] ?? '';
      const orig = originalFor(cat);
      if (current.trim() === '' && orig === '') continue;
      if (current === orig) continue;
      const value = Number(current);
      if (Number.isNaN(value) || value < 0) continue;
      items.push({ category: cat, monthlyLimit: value });
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edits, budgets, rows]);

  async function saveOne(category: Category) {
    const value = Number(edits[category] ?? '0');
    if (Number.isNaN(value) || value < 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSavingCat(category);
    try {
      await apiFetch<Budget>('/api/budgets', {
        method: 'PUT',
        body: JSON.stringify({ category, monthlyLimit: value }),
      });
      toast.success(`${category} budget saved`);
      await load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Save failed';
      toast.error(msg);
    } finally {
      setSavingCat(null);
    }
  }

  async function saveAll() {
    if (dirtyItems.length === 0) {
      toast.info('No changes to save');
      return;
    }
    setSavingAll(true);
    try {
      const res = await apiFetch<{ updated: number }>('/api/budgets', {
        method: 'POST',
        body: JSON.stringify({ items: dirtyItems }),
      });
      toast.success(`Saved ${res.updated} budget${res.updated === 1 ? '' : 's'}`);
      await load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Save all failed';
      toast.error(msg);
    } finally {
      setSavingAll(false);
    }
  }

  function handleCategoryAdded(cat: UserCategory) {
    cats.addCustom(cat);
    setEdits((prev) => ({ ...prev, [cat.name]: prev[cat.name] ?? '' }));
  }

  const [pendingDelete, setPendingDelete] = useState<UserCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [forceDelete, setForceDelete] = useState(false);

  function startDeleteCategory(cat: UserCategory) {
    setForceDelete(false);
    setPendingDelete(cat);
  }

  async function confirmDeleteCategory() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const url = `/api/categories/${pendingDelete._id}${forceDelete ? '?force=1' : ''}`;
      const res = await apiFetch<{ deleted: true; reassigned: number; reassignedTo: string }>(
        url,
        { method: 'DELETE' }
      );
      cats.removeCustom(pendingDelete._id);
      setEdits((prev) => {
        const next = { ...prev };
        delete next[pendingDelete.name];
        return next;
      });
      setBudgets((prev) => prev.filter((b) => b.category !== pendingDelete.name));
      setStatuses((prev) => prev.filter((s) => s.category !== pendingDelete.name));
      setPendingDelete(null);
      setForceDelete(false);
      if (res.reassigned > 0) {
        toast.success(
          `Category deleted · ${res.reassigned} expense${res.reassigned === 1 ? '' : 's'} reassigned to "${res.reassignedTo}"`
        );
      } else {
        toast.success('Category deleted');
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'IN_USE') {
        // Reveal force-confirm step
        setForceDelete(true);
        return;
      }
      const msg = err instanceof ApiError ? err.message : 'Delete failed';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  const customByName = new Map(cats.custom.map((c) => [c.name, c]));
  const statusMap = new Map(statuses.map((s) => [s.category, s]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Budgets</h1>
          <p className="text-sm text-zinc-600">
            Set monthly limits per category. Alerts appear at 80% and 100%.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddCategoryInline onAdded={handleCategoryAdded} />
          <button
            onClick={saveAll}
            disabled={savingAll || dirtyItems.length === 0}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingAll && <Spinner size={14} />}
            {savingAll
              ? 'Saving…'
              : dirtyItems.length > 0
                ? `Save all (${dirtyItems.length})`
                : 'Save all'}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50/80 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5">Monthly limit</th>
              <th className="px-4 py-2.5">Spent this month</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-zinc-100">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-7 w-28" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-28" /></td>
                  <td className="px-4 py-3"><Skeleton className="ml-auto h-7 w-16" /></td>
                </tr>
              ))
            ) : (
              rows.map((c) => {
                const s = statusMap.get(c);
                const value = edits[c] ?? '';
                const dirty = value !== originalFor(c);
                const customCat = customByName.get(c);
                return (
                  <tr key={c} className="border-t border-zinc-100 transition hover:bg-zinc-50/60">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="capitalize text-zinc-800">{c}</span>
                        {customCat && (
                          <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                            custom
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={value}
                          onChange={(e) =>
                            setEdits((prev) => ({ ...prev, [c]: e.target.value }))
                          }
                          placeholder="0"
                          className="w-28 rounded-md border border-zinc-300 px-2 py-1 text-sm focus:border-zinc-900 focus:outline-none"
                        />
                        {dirty && (
                          <span
                            className="inline-block h-2 w-2 rounded-full bg-amber-500"
                            title="Unsaved change"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {s ? (
                        <span className="font-medium text-zinc-800">
                          {formatCurrency(s.spent)}
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {!s || s.monthlyLimit === 0 ? (
                        <span className="text-zinc-400">—</span>
                      ) : (
                        <StatusBadge status={s} />
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => saveOne(c)}
                          disabled={savingCat === c}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingCat === c && <Spinner size={12} />}
                          {savingCat === c ? 'Saving…' : 'Save'}
                        </button>
                        {customCat && (
                          <button
                            onClick={() => startDeleteCategory(customCat)}
                            aria-label={`Delete ${c} category`}
                            title="Delete category"
                            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title={forceDelete ? 'This category is in use' : 'Delete this category?'}
        description={
          pendingDelete ? (
            forceDelete ? (
              <span>
                <span className="font-medium capitalize text-zinc-900">{pendingDelete.name}</span>{' '}
                is used by{' '}
                <span className="font-medium text-zinc-900">
                  {pendingDelete.usage ?? 0} expense
                  {(pendingDelete.usage ?? 0) === 1 ? '' : 's'}
                </span>
                . Confirm to reassign them to <span className="font-medium">&quot;other&quot;</span> and delete the category.
                Any per-category budget will also be removed. This cannot be undone.
              </span>
            ) : (
              <span>
                You&apos;re about to delete{' '}
                <span className="font-medium capitalize text-zinc-900">{pendingDelete.name}</span>.
                {(pendingDelete.usage ?? 0) > 0 && (
                  <>
                    {' '}
                    It has{' '}
                    <span className="font-medium text-zinc-900">
                      {pendingDelete.usage} expense{pendingDelete.usage === 1 ? '' : 's'}
                    </span>{' '}
                    using it.
                  </>
                )}
              </span>
            )
          ) : null
        }
        confirmLabel={forceDelete ? 'Reassign & delete' : 'Delete'}
        busy={deleting}
        onConfirm={confirmDeleteCategory}
        onCancel={() => {
          if (deleting) return;
          setPendingDelete(null);
          setForceDelete(false);
        }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: BudgetStatus }) {
  const { level, percent } = status;
  const cls =
    level === 'over'
      ? 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-200'
      : level === 'warn'
        ? 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200'
        : 'bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200';
  const label = level === 'over' ? 'Over budget' : level === 'warn' ? 'Near limit' : 'On track';
  const dot =
    level === 'over' ? 'bg-red-500' : level === 'warn' ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />
      {label} ({percent}%)
    </span>
  );
}

function AddCategoryInline({ onAdded }: { onAdded: (cat: UserCategory) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim().toLowerCase();
    if (!value) return;
    setSaving(true);
    try {
      const created = await apiFetch<UserCategory>('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: value }),
      });
      onAdded(created);
      toast.success(`Added "${created.name}"`);
      setName('');
      setOpen(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to add';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
      >
        + Add category
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="text"
        autoFocus
        maxLength={40}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. groceries"
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-zinc-900 focus:outline-none"
      />
      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="cursor-pointer rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? 'Adding…' : 'Add'}
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setName('');
        }}
        className="cursor-pointer rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
      >
        Cancel
      </button>
    </form>
  );
}
