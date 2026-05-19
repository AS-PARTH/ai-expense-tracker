'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api-client';
import { PasswordInput } from '@/components/PasswordInput';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Login failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Log in</h1>
        <p className="mt-1 text-sm text-zinc-600">Welcome back to AI Expense Tracker.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Email</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Password</label>
            <PasswordInput
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full cursor-pointer rounded-md bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Log in'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-600">
          No account?{' '}
          <Link href="/register" className="cursor-pointer font-medium text-zinc-900 underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
