export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function calculateBudgetPercentages(spent: number, budget: number) {
  const usedPercentage = budget > 0 ? (spent / budget) * 100 : 0;
  const overPercentage = budget > 0 ? ((spent - budget) / budget) * 100 : 0;
  return { usedPercentage, overPercentage };
}

export function formatBudgetStatus(spent: number, budget: number): string {
  const { usedPercentage, overPercentage } = calculateBudgetPercentages(spent, budget);

  if (spent === 0 || budget === 0) {
    return '—';
  } else if (spent < budget) {
    return `On track (${usedPercentage.toFixed(0)}%)`;
  } else if (spent === budget) {
    return `Limit reached (100%)`;
  } else {
    return `Over budget (${overPercentage.toFixed(0)}%)`;
  }
}

export function formatBudgetUsage(spent: number, budget: number): string {
  const { usedPercentage } = calculateBudgetPercentages(spent, budget);
  return `${usedPercentage.toFixed(0)}% used`;
}

