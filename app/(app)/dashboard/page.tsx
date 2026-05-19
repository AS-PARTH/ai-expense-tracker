"use client";

import { useEffect, useState } from "react";
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
} from "recharts";
import { TrendingUp, Layers, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatBudgetStatus } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import type { DashboardSummary, BudgetStatus } from "@/types";
import { toast } from "sonner";

const COLORS = [
  "#0ea5e9",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [statuses, setStatuses] = useState<BudgetStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<{
          summary: DashboardSummary;
          statuses: BudgetStatus[];
        }>("/api/dashboard/summary");
        setSummary(data.summary);
        setStatuses(data.statuses);
      } catch (err) {
        toast.error("Failed to load dashboard");
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!summary) {
    return <p className="text-sm text-zinc-500">No data yet.</p>;
  }

  const alerts = statuses.filter((s) => s.level !== "ok");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Dashboard
        </h1>
        <p className="text-sm text-zinc-600">Your spending at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<TrendingUp size={16} />}
          label="This month"
          value={formatCurrency(summary.monthTotal)}
          accent="sky"
        />
        <StatCard
          icon={<Layers size={16} />}
          label="Categories used"
          value={String(summary.byCategory.length)}
          accent="violet"
        />
        <StatCard
          icon={<AlertTriangle size={16} />}
          label="Budgets at risk"
          value={String(alerts.length)}
          accent={alerts.length ? "amber" : "emerald"}
        />
      </div>

      {alerts.length > 0 && (
        <div className="rounded-xl border border-amber-300/70 bg-linear-to-br from-amber-50 to-amber-100/40 p-4 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <AlertTriangle size={16} /> Budget alerts
          </h3>
          <ul className="mt-3 space-y-1.5 text-sm">
            {alerts.map((a) => (
              <li
                key={a.category}
                className="flex items-center justify-between"
              >
                <span className="capitalize">{a.category}</span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-24 overflow-hidden rounded-full bg-amber-200/60">
                    <span
                      className={`block h-full rounded-full ${
                        a.level === "over" ? "bg-red-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.min(a.percent, 100)}%` }}
                    />
                  </span>
                  <span
                    className={
                      a.level === "over"
                        ? "font-semibold text-red-700"
                        : "font-semibold text-amber-700"
                    }
                  >
                    {formatCurrency(a.spent)} / {formatCurrency(a.monthlyLimit)}{" "}
                    ({formatBudgetStatus(a.spent, a.monthlyLimit)})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">
            By category (this month)
          </h3>
          {summary.byCategory.length === 0 ? (
            <EmptyState
              text="No expenses yet."
              hint="Add one from the Expenses page to see the breakdown."
            />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={summary.byCategory}
                  dataKey="amount"
                  nameKey="category"
                  outerRadius={90}
                  label={(props: { category?: string; name?: string }) =>
                    props.category ?? props.name ?? ""
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

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">
            Last 6 months
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={summary.trend6m}>
              <XAxis dataKey="month" fontSize={11} stroke="#71717a" />
              <YAxis fontSize={11} stroke="#71717a" />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Legend />
              <Bar
                dataKey="amount"
                fill="#0ea5e9"
                name="Spent"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
