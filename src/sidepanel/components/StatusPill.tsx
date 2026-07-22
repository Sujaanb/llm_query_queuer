export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'good' | 'warn' | 'bad' }) {
  const tones = { neutral: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300', good: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300', warn: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300', bad: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' };
  return <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${tones[tone]}`}>{label}</span>;
}
