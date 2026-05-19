'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '@/lib/api-client';
import { type AIExtractResult, type Category, type Expense, type UserCategory } from '@/types';
import { todayISO } from '@/lib/format';
import { CategoryPicker } from './CategoryPicker';
import { Spinner } from './Spinner';
import { Sparkles } from 'lucide-react';

interface Props {
  initial?: Expense | null;
  onSaved: (e: Expense) => void;
  onCancel?: () => void;
  categoryOptions: string[];
  onCategoryAdded: (cat: UserCategory) => void;
}

export function ExpenseForm({
  initial,
  onSaved,
  onCancel,
  categoryOptions,
  onCategoryAdded,
}: Props) {
  const fallbackCategory = categoryOptions[0] ?? 'other';
  const [amount, setAmount] = useState<string>(initial ? String(initial.amount) : '');
  const [category, setCategory] = useState<Category>(initial?.category ?? fallbackCategory);
  const [date, setDate] = useState<string>(
    initial ? initial.date.slice(0, 10) : todayISO()
  );
  const [note, setNote] = useState<string>(initial?.note ?? '');
  const [aiText, setAiText] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiHint, setAiHint] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setAmount(String(initial.amount));
      setCategory(initial.category);
      setDate(initial.date.slice(0, 10));
      setNote(initial.note ?? '');
    }
  }, [initial]);

  useEffect(() => {
    if (!category && categoryOptions.length > 0) {
      setCategory(categoryOptions[0]);
    }
  }, [category, categoryOptions]);

  async function runAI() {
    if (!aiText.trim()) {
      toast.error('Paste some text first');
      return;
    }
    setAiBusy(true);
    setAiHint(null);
    try {
      const result = await apiFetch<AIExtractResult>('/api/ai/extract', {
        method: 'POST',
        body: JSON.stringify({ text: aiText }),
      });
      let filled = 0;
      if (result.amount != null) {
        setAmount(String(result.amount));
        filled++;
      }
      if (result.category) {
        setCategory(result.category);
        filled++;
      }
      if (result.date) {
        setDate(result.date);
        filled++;
      }
      if (filled === 0) {
        setAiHint('AI could not extract any fields. Fill the form manually.');
        toast.warning('Nothing extracted - fill manually');
      } else {
        setAiHint(
          `Extracted ${filled} field${filled > 1 ? 's' : ''} (confidence: ${result.confidence}). Review before saving.`
        );
        toast.success('Form auto-filled - please review');
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'AI extraction failed';
      toast.error(msg);
    } finally {
      setAiBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        amount: Number(amount),
        category,
        date,
        note: note.trim() || undefined,
      };
      const saved = initial
        ? await apiFetch<Expense>(`/api/expenses/${initial._id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : await apiFetch<Expense>('/api/expenses', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
      onSaved(saved);
      toast.success(initial ? 'Expense updated' : 'Expense added');
      if (!initial) {
        setAmount('');
        setNote('');
        setAiText('');
        setAiHint(null);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Save failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-xl border border-dashed border-sky-300 bg-linear-to-br from-sky-50 to-violet-50 p-4 shadow-sm">
        <label className="flex items-center gap-2 text-sm font-semibold text-sky-900">
          <Sparkles size={14} className="text-sky-600" />
          AI auto-fill
          <span className="font-normal text-sky-700/80">— paste a bill, SMS, or receipt</span>
        </label>
        <textarea
          rows={3}
          value={aiText}
          onChange={(e) => setAiText(e.target.value)}
          placeholder="e.g. Uber to airport on 23 Apr, paid Rs 450"
          className="mt-2 w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={runAI}
            disabled={aiBusy}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {aiBusy ? <Spinner size={14} /> : <Sparkles size={14} />}
            {aiBusy ? 'Extracting…' : 'Auto-fill with AI'}
          </button>
          {aiHint && <p className="text-xs text-sky-800">{aiHint}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Category</label>
          <CategoryPicker
            value={category}
            onChange={setCategory}
            options={categoryOptions}
            onCategoryAdded={onCategoryAdded}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Note (optional)</label>
          <input
            type="text"
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <Spinner size={14} />}
          {saving ? 'Saving…' : initial ? 'Update' : 'Add expense'}
        </button>
      </div>
    </form>
  );
}
