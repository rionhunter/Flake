import { ChevronLeft } from 'lucide-react';

interface CollapsedColumnProps {
  columnIndex: number;
  onClick: () => void;
}

export function CollapsedColumn({ columnIndex, onClick }: CollapsedColumnProps) {
  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-12 h-full border-r border-gray-300 bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors group"
    >
      <div className="h-full flex flex-col items-center justify-center gap-2">
        <ChevronLeft className="w-4 h-4 text-gray-600 group-hover:text-gray-800" />
        <div className="text-xs font-medium text-gray-600 group-hover:text-gray-800 writing-mode-vertical transform -rotate-180">
          Level {columnIndex + 1}
        </div>
      </div>
    </div>
  );
}
