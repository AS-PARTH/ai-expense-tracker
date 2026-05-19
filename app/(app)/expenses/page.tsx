'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, Download, X } from 'lucide-react';
import { apiFetch, ApiError, getToken } from '@/lib/api-client';
import { ExpenseForm } from '@/components/ExpenseForm';
import { CategoryPicker } from '@/components/CategoryPicker';
import { Skeleton } from '@/components/Skeleton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useCategories } from '@/lib/use-categories';
import { type Category, type Expense } from '@/types';
import { currentMonth, formatCurrency, formatDate } from '@/lib/format';

export default function ExpensesPage() {
  const cats = useCategories();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<Category | ''>('');
  const [filterMonth, setFilterMonth] = useState<string>(currentMonth());
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.set('category', filterCategory);
      if (filterMonth) params.set('month', filterMonth);
      const list = await apiFetch<Expense[]>(`/api/expenses?${params.toString()}`);
      setExpenses(list);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterMonth]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleSaved(saved: Expense) {
    setExpenses((prev) => {
      const idx = prev.findIndex((e) => e._id === saved._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setEditing(null);
    setShowForm(false);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/expenses/${pendingDelete._id}`, { method: 'DELETE' });
      setExpenses((prev) => prev.filter((e) => e._id !== pendingDelete._id));
      toast.success('Expense deleted');
      setPendingDelete(null);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Delete failed';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  function exportCsv() {
    const token = getToken();
    if (!token) return;
    const params = new URLSearchParams();
    if (filterMonth) params.set('month', filterMonth);
    const url = `/api/export/csv?${params.toString()}`;
    window.open(url, '_blank');
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Expenses</h1>
          <p className="text-sm text-zinc-600">
            {expenses.length} item{expenses.length !== 1 ? 's' : ''} · {formatCurrency(total)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setShowForm((s) => !s);
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
          >
            {showForm && !editing ? <X size={14} /> : <Plus size={14} />}
            {showForm && !editing ? 'Close' : 'Add expense'}
          </button>
        </div>
      </div>

      {(showForm || editing) && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            {editing ? 'Edit expense' : 'Add expense'}
          </h2>
          <ExpenseForm
            initial={editing}
            onSaved={handleSaved}
            onCancel={() => {
              setEditing(null);
              setShowForm(false);
            }}
            categoryOptions={cats.options}
            onCategoryAdded={cats.addCustom}
          />
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-zinc-600">Month</label>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="mt-1 cursor-pointer rounded-md border border-zinc-300 px-2 py-1 text-sm"
          />
        </div>
        <div className="min-w-[180px]">
          <label className="block text-xs font-medium text-zinc-600">Category</label>
          <CategoryPicker
            value={filterCategory}
            onChange={(v) => setFilterCategory(v as Category | '')}
            options={cats.options}
            includeAllOption
            allLabel="All categories"
            className="mt-1"
          />
        </div>
        {(filterCategory || filterMonth !== currentMonth()) && (
          <button
            onClick={() => {
              setFilterCategory('');
              setFilterMonth(currentMonth());
            }}
            className="cursor-pointer text-sm text-zinc-600 underline"
          >
            Reset
          </button>
        )}
      </div>

      {/* Desktop / tablet: table */}
      <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm sm:block">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50/80 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5 text-right">Amount</th>
              <th className="px-4 py-2.5">Note</th>
              <th className="w-28 px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-t border-zinc-100">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="ml-auto h-4 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                  <td className="px-4 py-3"><Skeleton className="ml-auto h-7 w-20" /></td>
                </tr>
              ))
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-sm text-zinc-500">No expenses for this filter.</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Click <span className="font-medium text-zinc-700">Add expense</span> to get started.
                  </p>
                </td>
              </tr>
            ) : (
              expenses.map((e) => (
                <tr
                  key={e._id}
                  className="group border-t border-zinc-100 transition hover:bg-zinc-50/60"
                >
                  <td className="px-4 py-2.5 text-zinc-700">{formatDate(e.date)}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium capitalize text-zinc-700">
                      {e.category}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-zinc-900">
                    {formatCurrency(e.amount)}
                  </td>
                  <td className="max-w-[280px] truncate px-4 py-2.5 text-zinc-600">
                    {e.note ?? '—'}
                  </td>
                  <td className="w-28 px-4 py-2.5 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditing(e);
                          setShowForm(true);
                        }}
                        aria-label="Edit expense"
                        title="Edit"
                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition hover:bg-sky-50 hover:text-sky-700"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setPendingDelete(e)}
                        aria-label="Delete expense"
                        title="Delete"
                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list */}
      <div className="space-y-2 sm:hidden">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2 h-5 w-24" />
            </div>
          ))
        ) : expenses.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-zinc-500">No expenses for this filter.</p>
          </div>
        ) : (
          expenses.map((e) => (
            <div
              key={e._id}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium capitalize text-zinc-700">
                      {e.category}
                    </span>
                    <span className="text-xs text-zinc-500">{formatDate(e.date)}</span>
                  </div>
                  <p className="mt-1 truncate text-sm text-zinc-600">{e.note ?? '—'}</p>
                </div>
                <p className="text-lg font-semibold text-zinc-900">
                  {formatCurrency(e.amount)}
                </p>
              </div>
              <div className="mt-3 flex justify-end gap-1 border-t border-zinc-100 pt-2">
                <button
                  onClick={() => {
                    setEditing(e);
                    setShowForm(true);
                  }}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-50"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={() => setPendingDelete(e)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this expense?"
        description={
          pendingDelete ? (
            <span>
              <span className="font-medium capitalize text-zinc-900">{pendingDelete.category}</span>
              {' · '}
              <span className="font-medium text-zinc-900">
                {formatCurrency(pendingDelete.amount)}
              </span>
              {' on '}
              {formatDate(pendingDelete.date)}.{' '}
              This action cannot be undone.
            </span>
          ) : null
        }
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
    </div>
  );
}
