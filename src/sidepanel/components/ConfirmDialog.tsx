export function ConfirmDialog({ open, onCancel, onConfirm }: { open: boolean; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-5" role="dialog" aria-modal="true">
    <div className="card w-full max-w-xs p-4"><h2 className="text-sm font-semibold">Clear the queue?</h2><p className="mt-1 text-xs text-zinc-500">This removes every queued prompt in this conversation.</p><div className="mt-4 flex justify-end gap-2"><button className="btn" onClick={onCancel}>Cancel</button><button className="btn-primary" onClick={onConfirm}>Clear all</button></div></div>
  </div>;
}
