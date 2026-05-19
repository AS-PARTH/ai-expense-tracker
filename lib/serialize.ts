import type { Types } from 'mongoose';
import type { Expense, Budget, PublicUser, Category } from '@/types';

type IdLike = Types.ObjectId | { toString(): string };
type DateLike = Date;

interface RawUser {
  _id: IdLike;
  email: string;
  name: string;
  createdAt: DateLike;
}

interface RawExpense {
  _id: IdLike;
  userId: IdLike;
  amount: number;
  category: Category;
  date: DateLike;
  note?: string;
  createdAt: DateLike;
  updatedAt: DateLike;
}

interface RawBudget {
  _id: IdLike;
  userId: IdLike;
  category: Category;
  monthlyLimit: number;
}

export function toPublicUser(u: RawUser): PublicUser {
  return {
    _id: u._id.toString(),
    email: u.email,
    name: u.name,
    createdAt: u.createdAt.toISOString(),
  };
}

export function toExpense(e: RawExpense): Expense {
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

export function toBudget(b: RawBudget): Budget {
  return {
    _id: b._id.toString(),
    userId: b.userId.toString(),
    category: b.category,
    monthlyLimit: b.monthlyLimit,
  };
}
