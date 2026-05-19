import { NextRequest } from 'next/server';
import Papa from 'papaparse';
import { dbConnect } from '@/lib/db';
import { Expense } from '@/models/Expense';
import { requireAuth } from '@/lib/auth';
import { unauthorized, serverError } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth) return unauthorized();
    await dbConnect();

    const url = new URL(req.url);
    const month = url.searchParams.get('month'); // YYYY-MM optional

    const query: Record<string, unknown> = { userId: auth.userId };
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-').map(Number);
      query.date = {
        $gte: new Date(Date.UTC(y, m - 1, 1)),
        $lt: new Date(Date.UTC(y, m, 1)),
      };
    }

    const docs = await Expense.find(query).sort({ date: -1 });
    const rows = docs.map((d) => ({
      date: d.date.toISOString().slice(0, 10),
      amount: d.amount,
      category: d.category,
      note: d.note ?? '',
    }));

    const csv = Papa.unparse(rows, { columns: ['date', 'amount', 'category', 'note'] });
    const filename = month ? `expenses-${month}.csv` : 'expenses-all.csv';

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return serverError(err);
  }
}
