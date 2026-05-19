'use client';

import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { apiFetch } from '@/lib/api-client';
import { formatCurrency } from '@/lib/format';
import type { DashboardSummary, BudgetStatus } from '@/types';
import { toast } from 'sonner';

const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'];

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [statuses, setStatuses] = useState<BudgetStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<{ summary: DashboardSummary; statuses: BudgetStatus[] }>(
          '/api/dashboard/summary'
        );
        setSummary(data.summary);
        setStatuses(data.statuses);
      } catch (err) {
        toast.error('Failed to load dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading dashboard…</p>;
  }
  if (!summary) {
    return <p className="text-sm text-zinc-500">No data yet.</p>;
  }

  const alerts = statuses.filter((s) => s.level !== 'ok');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-600">Your spending at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card label="This month" value={formatCurrency(summary.monthTotal)} />
        <Card
          label="Categories used"
          value={String(summary.byCategory.length)}
        />
        <Card
          label="Budgets at risk"
          value={String(alerts.length)}
          tone={alerts.length ? 'warn' : 'ok'}
        />
      </div>

      {alerts.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-900">Budget alerts</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {alerts.map((a) => (
              <li key={a.category} className="flex justify-between">
                <span className="capitalize">{a.category}</span>
                <span
                  className={
                    a.level === 'over' ? 'font-medium text-red-700' : 'font-medium text-amber-700'
                  }
                >
                  {formatCurrency(a.spent)} / {formatCurrency(a.monthlyLimit)} ({a.percent}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">By category (this month)</h3>
          {summary.byCategory.length === 0 ? (
            <p className="text-sm text-zinc-500">No expenses yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={summary.byCategory}
                  dataKey="amount"
                  nameKey="category"
                  outerRadius={90}
                  label={(props: { category?: string; name?: string }) =>
                    props.category ?? props.name ?? ''
                  }
                >
                  {summary.byCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">Last 6 months</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={summary.trend6m}>
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Legend />
              <Bar dataKey="amount" fill="#0ea5e9" name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'ok' | 'warn';
}) {
  const toneClass =
    tone === 'warn'
      ? 'border-amber-300 bg-amber-50'
      : tone === 'ok'
        ? 'border-emerald-200 bg-emerald-50'
        : 'border-zinc-200 bg-white';
  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
