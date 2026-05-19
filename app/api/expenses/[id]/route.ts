import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/db';
import { Expense } from '@/models/Expense';
import { requireAuth } from '@/lib/auth';
import { expenseUpdateSchema } from '@/lib/validators';
import { ok, fail, unauthorized, serverError } from '@/lib/api';
import { toExpense } from '@/lib/serialize';

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  try {
    const auth = requireAuth(req);
    if (!auth) return unauthorized();

    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return fail('Invalid id', 400, 'INVALID_ID');

    const body = await req.json();
    const parsed = expenseUpdateSchema.safeParse(body);
    if (!parsed.success) return fail('Invalid input', 400, 'VALIDATION');

    const update: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.date) update.date = new Date(parsed.data.date);
    if (parsed.data.note === '') update.note = undefined;

    await dbConnect();
    const doc = await Expense.findOneAndUpdate(
      { _id: id, userId: auth.userId },
      update,
      { new: true }
    );
    if (!doc) return fail('Expense not found', 404, 'NOT_FOUND');
    return ok(toExpense(doc));
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  try {
    const auth = requireAuth(req);
    if (!auth) return unauthorized();

    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return fail('Invalid id', 400, 'INVALID_ID');

    await dbConnect();
    const doc = await Expense.findOneAndDelete({ _id: id, userId: auth.userId });
    if (!doc) return fail('Expense not found', 404, 'NOT_FOUND');
    return ok({ deleted: true });
  } catch (err) {
    return serverError(err);
  }
}
