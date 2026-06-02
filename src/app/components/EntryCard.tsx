import { useRef, useEffect, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { ChevronRight, GripVertical } from 'lucide-react';
import { Entry } from '../types';

interface EntryCardProps {
  entry: Entry;
  isSelected: boolean;
  isFocused: boolean;
  onSelect: () => void;
  onTextChange: (text: string) => void;
  onDelete: () => void;
  onMoveEntry: (draggedId: string, targetId: string, position: 'before' | 'after') => void;
  onAddChild: () => void;
}

const ITEM_TYPE = 'ENTRY_CARD';

interface DragItem {
  id: string;
  type: string;
}

export function EntryCard({
  entry,
  isSelected,
  isFocused,
  onSelect,
  onTextChange,
  onDelete,
  onMoveEntry,
  onAddChild,
}: EntryCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE,
    item: { id: entry.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    hover: (item: DragItem, monitor) => {
      if (item.id === entry.id) return;

      const hoverBoundingRect = dropRef.current?.getBoundingClientRect();
      if (!hoverBoundingRect) return;

      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      setDropPosition(hoverClientY < hoverMiddleY ? 'before' : 'after');
    },
    drop: (item: DragItem) => {
      if (item.id !== entry.id && dropPosition) {
        onMoveEntry(item.id, entry.id, dropPosition);
      }
      setDropPosition(null);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const dropRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  drop(dropRef);
  drag(preview(dropRef));

  useEffect(() => {
    if (isFocused && isEditing && inputRef.current) {
      inputRef.current.focus();
    } else if (isFocused && !isEditing && inputRef.current) {
      inputRef.current.blur();
    }
  }, [isFocused, isEditing]);

  // Auto-edit blank entries when first focused
  useEffect(() => {
    if (isFocused && !isEditing && entry.text === '') {
      setTimeout(() => setIsEditing(true), 0);
    }
  }, [isFocused]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && !e.shiftKey && isEditing) {
      e.preventDefault();
      setIsEditing(false);
      inputRef.current?.blur();
    } else if (e.key === 'Tab' && !e.shiftKey && isEditing) {
      e.preventDefault();
      setIsEditing(false);
      inputRef.current?.blur();
      onAddChild();
    }
    // Shift+Tab will be handled by the global keyboard handler
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTextChange(e.target.value);
  };

  return (
    <div ref={dropRef} className="relative">
      {isOver && dropPosition === 'before' && (
        <div className="absolute -top-[2px] left-0 right-0 h-[2px] bg-blue-500 z-10" />
      )}
      <div
        onClick={onSelect}
        onDoubleClick={handleDoubleClick}
        className={`
          group flex items-center gap-2 px-3 py-2 rounded-lg transition-all
          ${
            isEditing
              ? 'bg-white border-2 border-blue-500 shadow-sm'
              : isFocused
              ? 'bg-blue-50 border-2 border-blue-400'
              : isSelected
              ? 'bg-blue-50 border border-blue-300'
              : 'bg-transparent border border-transparent hover:border-gray-300 hover:bg-gray-50'
          }
          ${isDragging ? 'opacity-50' : ''}
          ${!isEditing ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
        `}
      >
        <div
          ref={dragHandleRef}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={entry.text}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          readOnly={!isEditing}
          className={`
            flex-1 bg-transparent outline-none
            ${isEditing ? 'cursor-text' : 'cursor-pointer'}
          `}
          placeholder="Enter text..."
        />

        {entry.children.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>{entry.children.length}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </div>
      {isOver && dropPosition === 'after' && (
        <div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-blue-500 z-10" />
      )}
    </div>
  );
}
