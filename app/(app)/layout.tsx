'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { clsx } from 'clsx';
import { Sparkles, LogOut } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/expenses', label: 'Expenses' },
  { href: '/budgets', label: 'Budgets' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/75 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-lg font-semibold text-zinc-900"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-linear-to-br from-sky-500 to-violet-600 text-white shadow-sm">
                <Sparkles size={14} />
              </span>
              AI Expense Tracker
            </Link>
            <nav className="flex gap-1">
              {NAV.map((n) => {
                const active = pathname.startsWith(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={clsx(
                      'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition',
                      active
                        ? 'bg-zinc-900 text-white shadow-sm'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                    )}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {!loading && user && (
              <>
                <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-linear-to-br from-sky-500 to-violet-600 text-[10px] font-bold uppercase text-white">
                    {user.name.charAt(0)}
                  </span>
                  {user.name}
                </span>
                <button
                  onClick={logout}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  <LogOut size={14} /> Log out
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="fade-in">{children}</div>
      </main>
    </div>
  );
}
