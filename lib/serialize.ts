import type { ExpenseDoc } from '@/models/Expense';
import type { BudgetDoc } from '@/models/Budget';
import type { UserDoc } from '@/models/User';
import type { Expense, Budget, PublicUser } from '@/types';

export function toPublicUser(u: UserDoc): PublicUser {
  return {
    _id: u._id.toString(),
    email: u.email,
    name: u.name,
    createdAt: u.createdAt.toISOString(),
  };
}

export function toExpense(e: ExpenseDoc): Expense {
  return {
    _id: e._id.toString(),
    userId: e.userId.toString(),
    amount: e.amount,
    category: e.category,
    date: e.date.toISOString(),
    note: e.note,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export function toBudget(b: BudgetDoc): Budget {
  return {
    _id: b._id.toString(),
    userId: b.userId.toString(),
    category: b.category,
    monthlyLimit: b.monthlyLimit,
  };
}
