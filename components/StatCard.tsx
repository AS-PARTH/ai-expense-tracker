type Accent = 'sky' | 'violet' | 'amber' | 'emerald';

const ACCENTS: Record<Accent, { ring: string; chip: string }> = {
  sky: { ring: 'from-sky-400/40 to-sky-100/0', chip: 'bg-sky-100 text-sky-700' },
  violet: { ring: 'from-violet-400/40 to-violet-100/0', chip: 'bg-violet-100 text-violet-700' },
  amber: { ring: 'from-amber-400/40 to-amber-100/0', chip: 'bg-amber-100 text-amber-700' },
  emerald: {
    ring: 'from-emerald-400/40 to-emerald-100/0',
    chip: 'bg-emerald-100 text-emerald-700',
  },
};

interface Props {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: Accent;
}

export function StatCard({ icon, label, value, accent }: Props) {
  const a = ACCENTS[accent];
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-linear-to-br ${a.ring} blur-2xl`}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold text-zinc-900">{value}</p>
        </div>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${a.chip}`}>
          {icon}
        </span>
      </div>
    </div>
  );
}
