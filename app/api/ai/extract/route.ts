import { NextRequest } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Category as CategoryModel } from '@/models/Category';
import { requireAuth } from '@/lib/auth';
import { aiExtractSchema } from '@/lib/validators';
import { ok, fail, unauthorized } from '@/lib/api';
import { DEFAULT_CATEGORIES, type AIExtractResult, type Category } from '@/types';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

function buildPrompt(categories: string[]) {
  const list = categories.map((c) => `"${c}"`).join(', ');
  return `You extract structured expense data from raw text (bills, SMS, receipts, notes).
Today's date is ${new Date().toISOString().slice(0, 10)}.

Return ONLY a JSON object matching this schema, with no markdown, no commentary, no surrounding text:
{
  "amount": number | null,
  "category": string | null,
  "date": "YYYY-MM-DD" | null,
  "confidence": "high" | "medium" | "low"
}

Available categories: ${list}.

Rules:
- amount: positive number, no currency symbols. If the text has multiple amounts, pick the total.
- category: pick the best match from the available categories above. If nothing fits, use "other".
- date: ISO date. If only relative ("yesterday", "today", "23 Apr"), resolve to ISO using today's date. If no date is mentioned at all, use today's date.
- confidence: "high" if amount + category + date are all clearly stated; "medium" if some inference was needed; "low" if mostly guessed.`;
}

function fallback(text: string): AIExtractResult {
  return { amount: null, category: null, date: null, confidence: 'low', raw: text };
}

function coerceCategory(value: unknown, allowed: string[]): Category | null {
  if (typeof value !== 'string') return null;
  const lc = value.trim().toLowerCase();
  if (!lc) return null;
  if (allowed.includes(lc)) return lc;
  return 'other';
}

function coerceDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function coerceAmount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  if (typeof value === 'string') {
    const n = Number(value.replace(/[^\d.]/g, ''));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function extractJsonObject(raw: string): string {
  // Models sometimes wrap JSON in ```json fences or add prose. Strip to the first {...} block.
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) return fence[1].trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) return raw.slice(start, end + 1);
  return raw;
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) return unauthorized();

  let text = '';
  try {
    const body = await req.json();
    const parsed = aiExtractSchema.safeParse(body);
    if (!parsed.success) return fail('Invalid input', 400, 'VALIDATION');
    text = parsed.data.text;
  } catch {
    return fail('Invalid request body', 400, 'VALIDATION');
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return ok(fallback(text));
  }

  let allowed: string[] = [...DEFAULT_CATEGORIES];
  try {
    await dbConnect();
    const customs = await CategoryModel.find({ userId: auth.userId }).select('name').lean();
    allowed = Array.from(new Set([...DEFAULT_CATEGORIES, ...customs.map((c) => c.name)]));
  } catch (err) {
    console.warn('[ai/extract] could not load custom categories', err);
  }

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_MODEL,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildPrompt(allowed) },
          { role: 'user', content: `Input:\n${text}` },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error('[ai/extract] Groq error', res.status, errBody);
      return ok(fallback(text));
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content ?? '';

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJsonObject(raw));
    } catch {
      return ok(fallback(text));
    }

    const obj = parsed as Record<string, unknown>;
    const out: AIExtractResult = {
      amount: coerceAmount(obj.amount),
      category: coerceCategory(obj.category, allowed),
      date: coerceDate(obj.date),
      confidence:
        obj.confidence === 'high' || obj.confidence === 'medium' || obj.confidence === 'low'
          ? obj.confidence
          : 'low',
      raw: text,
    };
    return ok(out);
  } catch (err) {
    console.error('[ai/extract]', err);
    return ok(fallback(text));
  }
}
