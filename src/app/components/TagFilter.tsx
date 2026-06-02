import { X, Filter, Tag as TagIcon } from 'lucide-react';

interface TagFilterProps {
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearFilters: () => void;
}

export function TagFilter({
  allTags,
  selectedTags,
  onToggleTag,
  onClearFilters,
}: TagFilterProps) {
  if (allTags.length === 0) return null;

  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-2 mb-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filter by tags</span>
        {selectedTags.length > 0 && (
          <button
            onClick={onClearFilters}
            className="ml-auto text-xs text-blue-600 hover:text-blue-800"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`
                inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors
                ${
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <TagIcon className="w-3 h-3" />
              {tag}
              {isSelected && <X className="w-3 h-3 ml-1" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
