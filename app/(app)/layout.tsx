'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { clsx } from 'clsx';

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
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-semibold text-zinc-900">
              AI Expense Tracker
            </Link>
            <nav className="flex gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={clsx(
                    'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium',
                    pathname.startsWith(n.href)
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-700 hover:bg-zinc-100'
                  )}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {!loading && user && (
              <>
                <span className="text-zinc-600">{user.name}</span>
                <button
                  onClick={logout}
                  className="cursor-pointer rounded-md border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  Log out
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
