import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { QueueItem as Item } from '../../lib/types';
import { StatusPill } from './StatusPill';

const Icon = ({ children }: { children: React.ReactNode }) => <span aria-hidden className="text-sm leading-none">{children}</span>;

export function QueueItem({ item, index, onEdit, onDuplicate, onDelete }: { item: Item; index: number; onEdit: () => void; onDuplicate: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const preview = !expanded && item.text.length > 600 ? `${item.text.slice(0, 600)}…` : item.text;
  const locked = item.status === 'sending';
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: locked });
  return <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`card p-3 ${locked ? 'border-blue-400 ring-1 ring-blue-300' : ''} ${isDragging ? 'z-10 opacity-70 shadow-lg' : ''}`}>
    <div className="flex items-start gap-2">
      <button className="mt-0.5 cursor-grab text-zinc-400 disabled:cursor-default" aria-label="Drag to reorder" disabled={locked} {...attributes} {...listeners}><Icon>⠿</Icon></button>
      <span className="mt-0.5 w-5 text-right text-[11px] tabular-nums text-zinc-400">{index + 1}</span>
      <button className={`min-w-0 flex-1 whitespace-pre-wrap text-left font-mono text-xs leading-relaxed ${expanded ? '' : 'line-clamp-3'}`} onClick={() => setExpanded(!expanded)}>{preview}</button>
      <StatusPill label={item.status} tone={item.status === 'failed' ? 'bad' : item.status === 'sending' ? 'warn' : 'neutral'} />
    </div>
    <div className="mt-2 flex justify-end gap-1"><button className="btn" onClick={onEdit} disabled={locked} title="Edit"><Icon>✎</Icon> Edit</button><button className="btn" onClick={onDuplicate} disabled={locked} title="Duplicate"><Icon>⧉</Icon></button><button className="btn" onClick={onDelete} disabled={locked} title="Delete"><Icon>×</Icon></button></div>
  </li>;
}
