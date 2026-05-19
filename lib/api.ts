import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ ok: true, data }, { status });
}

export function fail(error: string, status = 400, code?: string) {
  return NextResponse.json<ApiResponse<never>>({ ok: false, error, code }, { status });
}

export function unauthorized() {
  return fail('Unauthorized', 401, 'UNAUTHORIZED');
}

export function serverError(err: unknown) {
  // eslint-disable-next-line no-console
  console.error('[api] server error:', err);
  const msg = err instanceof Error ? err.message : 'Internal server error';
  return fail(msg, 500, 'INTERNAL');
}
