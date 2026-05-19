'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { apiFetch, ApiError, getToken } from '@/lib/api-client';
import { ExpenseForm } from '@/components/ExpenseForm';
import { CategoryPicker } from '@/components/CategoryPicker';
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

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return;
    try {
      await apiFetch(`/api/expenses/${id}`, { method: 'DELETE' });
      setExpenses((prev) => prev.filter((e) => e._id !== id));
      toast.success('Expense deleted');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Delete failed';
      toast.error(msg);
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
            className="cursor-pointer rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Export CSV
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setShowForm((s) => !s);
            }}
            className="cursor-pointer rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            {showForm && !editing ? 'Close' : '+ Add expense'}
          </button>
        </div>
      </div>

      {(showForm || editing) && (
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
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

      <div className="flex flex-wrap items-end gap-3 rounded-md border border-zinc-200 bg-white p-3">
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

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2">Note</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  Loading…
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  No expenses for this filter. Add one above.
                </td>
              </tr>
            ) : (
              expenses.map((e) => (
                <tr key={e._id} className="border-t border-zinc-100">
                  <td className="px-4 py-2">{formatDate(e.date)}</td>
                  <td className="px-4 py-2 capitalize">{e.category}</td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatCurrency(e.amount)}
                  </td>
                  <td className="px-4 py-2 text-zinc-600">{e.note ?? '—'}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => {
                        setEditing(e);
                        setShowForm(true);
                      }}
                      className="mr-2 cursor-pointer text-xs font-medium text-sky-700 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(e._id)}
                      className="cursor-pointer text-xs font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
