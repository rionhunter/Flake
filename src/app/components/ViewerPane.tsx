import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Tag as TagIcon } from 'lucide-react';
import { Entry } from '../types';

interface ViewerPaneProps {
  entry: Entry | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onUpdateContent: (content: string) => void;
  onUpdateTags: (tags: string[]) => void;
  allTags: string[];
}

export function ViewerPane({
  entry,
  isCollapsed,
  onToggleCollapse,
  onUpdateContent,
  onUpdateTags,
  allTags,
}: ViewerPaneProps) {
  const [newTag, setNewTag] = useState('');

  const handleAddTag = (tag: string) => {
    if (tag && entry && !(entry.tags || []).includes(tag)) {
      onUpdateTags([...(entry.tags || []), tag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (entry) {
      onUpdateTags((entry.tags || []).filter((tag) => tag !== tagToRemove));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(newTag.trim());
    }
  };

  if (isCollapsed) {
    return (
      <div className="flex-shrink-0 w-12 h-full border-l border-gray-300 bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors group">
        <button
          onClick={onToggleCollapse}
          className="h-full w-full flex flex-col items-center justify-center gap-2"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600 group-hover:text-gray-800" />
          <div className="text-xs font-medium text-gray-600 group-hover:text-gray-800 writing-mode-vertical transform -rotate-180">
            Viewer
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 w-96 h-full border-l border-gray-200 bg-white flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600">Details</h3>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Content */}
      {entry ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Title
            </label>
            <div className="text-base font-medium text-gray-800">
              {entry.text || <span className="text-gray-400 italic">Untitled</span>}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(entry.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm"
                >
                  <TagIcon className="w-3 h-3" />
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add tag..."
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                list="tag-suggestions"
              />
              <button
                onClick={() => handleAddTag(newTag.trim())}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
              >
                Add
              </button>
            </div>
            <datalist id="tag-suggestions">
              {allTags
                .filter((tag) => !(entry.tags || []).includes(tag))
                .map((tag) => (
                  <option key={tag} value={tag} />
                ))}
            </datalist>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Content
            </label>
            <textarea
              value={entry.content || ''}
              onChange={(e) => onUpdateContent(e.target.value)}
              placeholder="Add detailed content here..."
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Select a card to view details
        </div>
      )}
    </div>
  );
}
