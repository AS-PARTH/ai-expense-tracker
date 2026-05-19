import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/db';
import { Budget } from '@/models/Budget';
import { Expense } from '@/models/Expense';
import { requireAuth } from '@/lib/auth';
import { budgetUpsertSchema, budgetsBulkSchema } from '@/lib/validators';
import { ok, fail, unauthorized, serverError } from '@/lib/api';
import { toBudget } from '@/lib/serialize';
import type { BudgetStatus, Category } from '@/types';

function monthRange(month?: string) {
  const now = new Date();
  const y = month ? Number(month.slice(0, 4)) : now.getUTCFullYear();
  const m = month ? Number(month.slice(5, 7)) : now.getUTCMonth() + 1;
  return {
    start: new Date(Date.UTC(y, m - 1, 1)),
    end: new Date(Date.UTC(y, m, 1)),
  };
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth) return unauthorized();
    await dbConnect();

    const url = new URL(req.url);
    const monthParam = url.searchParams.get('month') || undefined;
    const { start, end } = monthRange(monthParam);

    const [budgets, spendAgg] = await Promise.all([
      Budget.find({ userId: auth.userId }),
      Expense.aggregate<{ _id: Category; total: number }>([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(auth.userId),
            date: { $gte: start, $lt: end },
          },
        },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
      ]),
    ]);

    const spentMap = new Map<Category, number>();
    for (const row of spendAgg) spentMap.set(row._id, row.total);

    const statuses: BudgetStatus[] = budgets.map((b) => {
      const spent = spentMap.get(b.category) ?? 0;
      const percent = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
      const level: BudgetStatus['level'] =
        percent >= 100 ? 'over' : percent >= 80 ? 'warn' : 'ok';
      return {
        category: b.category,
        monthlyLimit: b.monthlyLimit,
        spent,
        percent: Math.round(percent * 10) / 10,
        level,
      };
    });

    return ok({ budgets: budgets.map(toBudget), statuses });
  } catch (err) {
    return serverError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth) return unauthorized();

    const body = await req.json();
    const parsed = budgetUpsertSchema.safeParse(body);
    if (!parsed.success) return fail('Invalid input', 400, 'VALIDATION');

    await dbConnect();
    const doc = await Budget.findOneAndUpdate(
      { userId: auth.userId, category: parsed.data.category },
      { monthlyLimit: parsed.data.monthlyLimit },
      { new: true, upsert: true }
    );
    return ok(toBudget(doc));
  } catch (err) {
    return serverError(err);
  }
}

// Bulk upsert - powers the "Save all" button on the budgets page
export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth) return unauthorized();

    const body = await req.json();
    const parsed = budgetsBulkSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || 'Invalid input', 400, 'VALIDATION');
    }

    await dbConnect();
    const ops = parsed.data.items.map((item) => ({
      updateOne: {
        filter: { userId: new mongoose.Types.ObjectId(auth.userId), category: item.category },
        update: { $set: { monthlyLimit: item.monthlyLimit } },
        upsert: true,
      },
    }));
    if (ops.length === 0) return ok({ updated: 0 });
    const result = await Budget.bulkWrite(ops);
    return ok({
      updated: (result.modifiedCount ?? 0) + (result.upsertedCount ?? 0),
    });
  } catch (err) {
    return serverError(err);
  }
}
