import Link from 'next/link';
import { Sparkles, ArrowRight, PieChart, BellRing } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20">
      <div className="fade-in max-w-3xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white/70 px-3 py-1 text-xs font-medium text-sky-700 backdrop-blur">
          <Sparkles size={12} /> AI-powered expense tracking
        </span>
        <h1 className="mt-5 bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl">
          Track expenses<br className="hidden sm:block" /> at the speed of paste.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-600">
          Paste a bill, SMS, or receipt — let AI fill in the amount, category, and date.
          Visualize spending. Set budgets. Export anytime.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/register"
            className="group inline-flex cursor-pointer items-center gap-2 rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
          >
            Create account
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
          <Link
            href="/login"
            className="cursor-pointer rounded-md border border-zinc-300 bg-white/80 px-5 py-2.5 text-sm font-medium text-zinc-900 shadow-sm backdrop-blur transition hover:bg-white"
          >
            Log in
          </Link>
        </div>
      </div>

      <div className="fade-in mt-16 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        <Feature
          icon={<Sparkles size={18} />}
          title="AI auto-fill"
          body="Paste raw text — get a clean expense in one click."
        />
        <Feature
          icon={<PieChart size={18} />}
          title="Live dashboard"
          body="Category pie + 6-month trend, updated as you spend."
        />
        <Feature
          icon={<BellRing size={18} />}
          title="Budget alerts"
          body="Soft warning at 80%, hard alert at 100% of your limit."
        />
      </div>
    </main>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white/70 p-4 shadow-sm backdrop-blur transition hover:shadow-md">
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-sky-100 text-sky-700">
        {icon}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-600">{body}</p>
    </div>
  );
}
