export const DEFAULT_CATEGORIES = [
  'food',
  'transport',
  'shopping',
  'bills',
  'entertainment',
  'health',
  'other',
] as const;

export type Category = string;

export interface UserCategory {
  _id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface PublicUser {
  _id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Expense {
  _id: string;
  userId: string;
  amount: number;
  category: Category;
  date: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  _id: string;
  userId: string;
  category: Category;
  monthlyLimit: number;
}

export interface AIExtractResult {
  amount: number | null;
  category: Category | null;
  date: string | null;
  confidence: 'high' | 'medium' | 'low';
  raw: string;
}

export interface DashboardSummary {
  monthTotal: number;
  byCategory: { category: Category; amount: number }[];
  trend6m: { month: string; amount: number }[];
}

export interface BudgetStatus {
  category: Category;
  monthlyLimit: number;
  spent: number;
  percent: number;
  level: 'ok' | 'warn' | 'over';
}

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string; code?: string };
export type ApiResponse<T> = ApiOk<T> | ApiErr;

export interface AuthSuccess {
  token: string;
  user: PublicUser;
}
