import { useState } from 'react';
import { parsePrompts, type ParseResult } from '../../lib/parser';

export function ImportPanel({ onImport }: { onImport: (prompts: string[]) => void }) {
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const parse = () => setPreview(parsePrompts(input));
  const add = () => { const result = preview ?? parsePrompts(input); setPreview(result); if (!result.error && result.prompts.length) { onImport(result.prompts); setInput(''); setPreview(null); } };
  return <section className="card p-4"><h2 className="text-sm font-semibold">Import prompts</h2><p className="mt-1 text-xs text-zinc-500">Paste a Python/JSON string list or one prompt per line.</p><textarea className="field mt-3 min-h-24 font-mono text-xs" value={input} onChange={(e) => { setInput(e.target.value); setPreview(null); }} placeholder={'["First prompt", "Second prompt"]'} />
    {preview && <div className="mt-3 rounded-lg bg-zinc-50 p-2 text-xs dark:bg-zinc-950">{preview.error ? <p className="text-red-600 dark:text-red-400">{preview.error}</p> : <><p className="font-medium">{preview.prompts.length} prompt{preview.prompts.length === 1 ? '' : 's'}</p><ol className="mt-2 max-h-40 list-decimal space-y-1 overflow-auto pl-5 font-mono">{preview.prompts.map((prompt, i) => <li key={i} className="whitespace-pre-wrap">{prompt}</li>)}</ol>{preview.warnings.map((w) => <p key={w} className="mt-2 text-amber-600">{w}</p>)}</>}</div>}
    <div className="mt-3 flex gap-2"><button className="btn" disabled={!input.trim()} onClick={parse}>Preview</button><button className="btn-primary" disabled={!input.trim()} onClick={add}>Add to queue</button><button className="btn ml-auto" disabled={!input} onClick={() => { setInput(''); setPreview(null); }}>Clear</button></div>
  </section>;
}
