import { useRef, useEffect } from 'react';
import { Entry } from '../types';
import { EntryCard } from './EntryCard';

interface ColumnProps {
  entries: Entry[];
  selectedId: string | null;
  focusedId: string | null;
  onSelectEntry: (id: string) => void;
  onUpdateText: (id: string, text: string) => void;
  onDeleteEntry: (id: string) => void;
  onMoveEntry: (draggedId: string, targetId: string, position: 'before' | 'after') => void;
  onAddChild: (id: string) => void;
  columnIndex: number;
}

export function Column({
  entries,
  selectedId,
  focusedId,
  onSelectEntry,
  onUpdateText,
  onDeleteEntry,
  onMoveEntry,
  onAddChild,
  columnIndex,
}: ColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusedId && scrollRef.current) {
      const focusedElement = scrollRef.current.querySelector(
        `[data-entry-id="${focusedId}"]`
      );
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [focusedId]);

  if (entries.length === 0) {
    return (
      <div className="flex-shrink-0 w-80 h-full border-r border-gray-200 bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">No entries</p>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 w-80 h-full border-r border-gray-200 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h3 className="text-sm font-medium text-gray-600">
          Level {columnIndex + 1}
        </h3>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {entries.map((entry) => (
          <div key={entry.id} data-entry-id={entry.id}>
            <EntryCard
              entry={entry}
              isSelected={selectedId === entry.id}
              isFocused={focusedId === entry.id}
              onSelect={() => onSelectEntry(entry.id)}
              onTextChange={(text) => onUpdateText(entry.id, text)}
              onDelete={() => onDeleteEntry(entry.id)}
              onMoveEntry={onMoveEntry}
              onAddChild={() => onAddChild(entry.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
