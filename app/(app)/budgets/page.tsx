'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useCategories } from '@/lib/use-categories';
import { CategoryPicker } from '@/components/CategoryPicker';
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
            className="cursor-pointer rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingAll
              ? 'Saving…'
              : dirtyItems.length > 0
                ? `Save all (${dirtyItems.length})`
                : 'Save all'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Monthly limit</th>
                <th className="px-4 py-2">Spent this month</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const s = statusMap.get(c);
                const value = edits[c] ?? '';
                const dirty = value !== originalFor(c);
                return (
                  <tr key={c} className="border-t border-zinc-100">
                    <td className="px-4 py-2 capitalize">{c}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        value={value}
                        onChange={(e) =>
                          setEdits((prev) => ({ ...prev, [c]: e.target.value }))
                        }
                        placeholder="0"
                        className="w-28 rounded-md border border-zinc-300 px-2 py-1 text-sm"
                      />
                      {dirty && <span className="ml-2 text-xs text-amber-700">●</span>}
                    </td>
                    <td className="px-4 py-2">
                      {s ? formatCurrency(s.spent) : <span className="text-zinc-400">—</span>}
                    </td>
                    <td className="px-4 py-2">
                      {!s || s.monthlyLimit === 0 ? (
                        <span className="text-zinc-400">—</span>
                      ) : (
                        <StatusBadge status={s} />
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => saveOne(c)}
                        disabled={savingCat === c}
                        className="cursor-pointer rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingCat === c ? 'Saving…' : 'Save'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: BudgetStatus }) {
  const { level, percent } = status;
  const cls =
    level === 'over'
      ? 'bg-red-100 text-red-800'
      : level === 'warn'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-emerald-100 text-emerald-800';
  const label = level === 'over' ? 'Over budget' : level === 'warn' ? 'Near limit' : 'OK';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
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
