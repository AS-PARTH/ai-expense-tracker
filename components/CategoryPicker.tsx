'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { Category, UserCategory } from '@/types';

interface Props {
  value: Category;
  onChange: (value: Category) => void;
  options: string[];
  onCategoryAdded?: (cat: UserCategory) => void;
  includeAllOption?: boolean;
  allLabel?: string;
  className?: string;
}

export function CategoryPicker({
  value,
  onChange,
  options,
  onCategoryAdded,
  includeAllOption = false,
  allLabel = 'All',
  className,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    const name = newName.trim().toLowerCase();
    if (!name) return;
    setSaving(true);
    try {
      const created = await apiFetch<UserCategory>('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      onCategoryAdded?.(created);
      onChange(created.name);
      setNewName('');
      setAdding(false);
      toast.success(`Added "${created.name}"`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Failed to add category';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={className}>
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => {
            if (e.target.value === '__add__') {
              setAdding(true);
              return;
            }
            onChange(e.target.value);
          }}
          className="flex-1 cursor-pointer rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm capitalize focus:border-zinc-900 focus:outline-none"
        >
          {includeAllOption && <option value="">{allLabel}</option>}
          {options.map((c) => (
            <option key={c} value={c} className="capitalize">
              {c}
            </option>
          ))}
          {onCategoryAdded && (
            <option value="__add__">+ Add new category…</option>
          )}
        </select>
      </div>
      {adding && (
        <form onSubmit={createCategory} className="mt-2 flex gap-2">
          <input
            type="text"
            autoFocus
            maxLength={40}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. groceries"
            className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />
          <button
            type="submit"
            disabled={saving || !newName.trim()}
            className="cursor-pointer rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add'}
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setNewName('');
            }}
            className="cursor-pointer rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
