import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Expense } from '@/models/Expense';
import { requireAuth } from '@/lib/auth';
import { expenseInputSchema } from '@/lib/validators';
import { ok, fail, unauthorized, serverError } from '@/lib/api';
import { toExpense } from '@/lib/serialize';

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth) return unauthorized();
    await dbConnect();

    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const month = url.searchParams.get('month'); // YYYY-MM

    const query: Record<string, unknown> = { userId: auth.userId };
    if (category) {
      query.category = category.toLowerCase();
    }
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-').map(Number);
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 1));
      query.date = { $gte: start, $lt: end };
    }

    const docs = await Expense.find(query).sort({ date: -1 }).limit(500);
    return ok(docs.map(toExpense));
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth) return unauthorized();

    const body = await req.json();
    const parsed = expenseInputSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || 'Invalid input', 400, 'VALIDATION');
    }

    await dbConnect();
    const doc = await Expense.create({
      userId: auth.userId,
      amount: parsed.data.amount,
      category: parsed.data.category,
      date: new Date(parsed.data.date),
      note: parsed.data.note || undefined,
    });
    return ok(toExpense(doc), 201);
  } catch (err) {
    return serverError(err);
  }
}
