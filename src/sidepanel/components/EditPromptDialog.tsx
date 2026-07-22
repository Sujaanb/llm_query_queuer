import { useEffect, useState } from 'react';

export function EditPromptDialog({ text, onCancel, onSave }: { text: string | null; onCancel: () => void; onSave: (text: string) => void }) {
  const [value, setValue] = useState('');
  useEffect(() => setValue(text ?? ''), [text]);
  if (text === null) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-5" role="dialog" aria-modal="true">
    <div className="card w-full max-w-sm p-4"><h2 className="text-sm font-semibold">Edit prompt</h2><textarea className="field mt-3 min-h-36 font-mono text-xs" value={value} onChange={(e) => setValue(e.target.value)} autoFocus /><div className="mt-3 flex justify-end gap-2"><button className="btn" onClick={onCancel}>Cancel</button><button className="btn-primary" disabled={!value.trim()} onClick={() => onSave(value)}>Save</button></div></div>
  </div>;
}
