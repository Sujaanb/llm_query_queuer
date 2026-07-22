import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { QueueItem as Item } from '../../lib/types';
import { QueueItem } from './QueueItem';

export function QueueList({ items, onReorder, onEdit, onDuplicate, onDelete }: { items: Item[]; onReorder: (a: string, b: string) => void; onEdit: (item: Item) => void; onDuplicate: (id: string) => void; onDelete: (id: string) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const end = ({ active, over }: DragEndEvent) => { if (over && active.id !== over.id) onReorder(String(active.id), String(over.id)); };
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={end}><SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}><ol className="space-y-2">{items.map((item, index) => <QueueItem key={item.id} item={item} index={index} onEdit={() => onEdit(item)} onDuplicate={() => onDuplicate(item.id)} onDelete={() => onDelete(item.id)} />)}</ol></SortableContext></DndContext>;
}
