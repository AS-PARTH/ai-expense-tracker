import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          AI Expense Tracker
        </h1>
        <p className="mt-4 text-lg text-zinc-600">
          Paste a bill, SMS, or receipt — let AI auto-fill the amount,
          category, and date. Track spending, set budgets, export to CSV.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/login"
            className="cursor-pointer rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="cursor-pointer rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
