import type { Settings } from '../../lib/types';

export function SettingsPanel({ settings, onChange }: { settings: Settings; onChange: (patch: Partial<Settings>) => void }) {
  const number = (key: keyof Pick<Settings, 'sendDelayMs' | 'stabilityMs' | 'fallbackReadyTimeoutMs'>, value: string) => onChange({ [key]: Math.max(0, Number(value) || 0) });
  const toggle = (key: keyof Pick<Settings, 'alwaysQueue' | 'showToasts' | 'pauseOnStop' | 'pauseOnError' | 'debugMode'>) => onChange({ [key]: !settings[key] });
  const toggles = [
    ['alwaysQueue', 'Always queue messages'],
    ['showToasts', 'Show toast notifications'],
    ['pauseOnStop', 'Pause on stop generation'],
    ['pauseOnError', 'Pause on error / rate limit'],
    ['debugMode', 'Debug mode'],
  ] as const;
  return <section className="card p-4"><h2 className="text-sm font-semibold">Settings</h2><div className="mt-3 grid grid-cols-2 gap-3">
    <label className="text-xs text-zinc-500">Send delay (ms)<input className="field mt-1" type="number" min="0" step="250" value={settings.sendDelayMs} onChange={(event) => number('sendDelayMs', event.target.value)} /></label>
    <label className="text-xs text-zinc-500">Stability delay (ms)<input className="field mt-1" type="number" min="500" step="250" value={settings.stabilityMs} onChange={(event) => number('stabilityMs', event.target.value)} /></label>
    <label className="col-span-2 text-xs text-zinc-500">Fallback ready timeout (ms)<input className="field mt-1" type="number" min="1000" step="1000" value={settings.fallbackReadyTimeoutMs} onChange={(event) => number('fallbackReadyTimeoutMs', event.target.value)} /></label>
  </div><div className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">{toggles.map(([key, label]) => <label key={key} className="flex cursor-pointer items-center justify-between py-2 text-xs"><span>{label}</span><input type="checkbox" checked={settings[key]} onChange={() => toggle(key)} className="accent-zinc-900" /></label>)}</div></section>;
}