import { useState, useEffect } from 'react';
import { X, Download, Filter, ChevronRight, ChevronDown } from 'lucide-react';
import { Entry } from '../types';

interface ExportDialogProps {
  entries: Entry[];
  isOpen: boolean;
  onClose: () => void;
}

interface SelectionState {
  [key: string]: boolean;
}

export function ExportDialog({ entries, isOpen, onClose }: ExportDialogProps) {
  const [selectedIds, setSelectedIds] = useState<SelectionState>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Initialize all entries as selected
  useEffect(() => {
    if (isOpen) {
      const allIds: SelectionState = {};
      const collectIds = (entryList: Entry[]) => {
        entryList.forEach((entry) => {
          allIds[entry.id] = true;
          if (entry.children.length > 0) {
            collectIds(entry.children);
          }
        });
      };
      collectIds(entries);
      setSelectedIds(allIds);

      // Expand all by default
      const allExpandedIds = new Set<string>();
      const collectExpandable = (entryList: Entry[]) => {
        entryList.forEach((entry) => {
          if (entry.children.length > 0) {
            allExpandedIds.add(entry.id);
            collectExpandable(entry.children);
          }
        });
      };
      collectExpandable(entries);
      setExpandedIds(allExpandedIds);
    }
  }, [isOpen, entries]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectOnlyLeaves = () => {
    const newSelection: SelectionState = {};
    const processEntry = (entry: Entry) => {
      if (entry.children.length === 0) {
        // Leaf node - select it
        newSelection[entry.id] = true;
      } else {
        // Has children - deselect it
        newSelection[entry.id] = false;
        // Process children
        entry.children.forEach(processEntry);
      }
    };
    entries.forEach(processEntry);
    setSelectedIds(newSelection);
  };

  const selectAll = () => {
    const allIds: SelectionState = {};
    const collectIds = (entryList: Entry[]) => {
      entryList.forEach((entry) => {
        allIds[entry.id] = true;
        if (entry.children.length > 0) {
          collectIds(entry.children);
        }
      });
    };
    collectIds(entries);
    setSelectedIds(allIds);
  };

  const deselectAll = () => {
    const allIds: SelectionState = {};
    const collectIds = (entryList: Entry[]) => {
      entryList.forEach((entry) => {
        allIds[entry.id] = false;
        if (entry.children.length > 0) {
          collectIds(entry.children);
        }
      });
    };
    collectIds(entries);
    setSelectedIds(allIds);
  };

  const exportSelected = () => {
    const selectedEntries: Entry[] = [];
    const collectSelected = (entryList: Entry[]): Entry[] => {
      const result: Entry[] = [];
      entryList.forEach((entry) => {
        if (selectedIds[entry.id]) {
          const newEntry: Entry = {
            ...entry,
            children: entry.children.length > 0 ? collectSelected(entry.children) : [],
          };
          result.push(newEntry);
        } else if (entry.children.length > 0) {
          // Even if this entry is not selected, check its children
          const selectedChildren = collectSelected(entry.children);
          result.push(...selectedChildren);
        }
      });
      return result;
    };

    const result = collectSelected(entries);

    // Convert to text format
    const lines: string[] = [];
    const processEntry = (entry: Entry, indent: number = 0) => {
      const prefix = '  '.repeat(indent) + '- ';
      lines.push(prefix + entry.text);
      if (entry.content) {
        const contentLines = entry.content.split('\n');
        contentLines.forEach(line => {
          lines.push('  '.repeat(indent + 1) + line);
        });
      }
      entry.children.forEach(child => processEntry(child, indent + 1));
    };

    result.forEach(entry => processEntry(entry));

    const text = lines.join('\n');

    // Download as text file
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ideation-export.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onClose();
  };

  const renderEntry = (entry: Entry, level: number = 0): JSX.Element => {
    const isSelected = selectedIds[entry.id];
    const hasChildren = entry.children.length > 0;
    const isExpanded = expandedIds.has(entry.id);

    return (
      <div key={entry.id} className="select-none">
        <div
          className="flex items-center gap-2 py-1 px-2 hover:bg-gray-50 rounded"
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(entry.id)}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection(entry.id)}
            className="cursor-pointer"
          />
          <span className={`flex-1 text-sm ${!isSelected ? 'text-gray-400' : 'text-gray-800'}`}>
            {entry.text || <em className="text-gray-400">Untitled</em>}
          </span>
          {hasChildren && (
            <span className="text-xs text-gray-500">({entry.children.length})</span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {entry.children.map((child) => renderEntry(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;
  const totalCount = Object.keys(selectedIds).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Export Ideas</h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedCount} of {totalCount} entries selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-3 border-b border-gray-200 flex gap-2 flex-wrap">
          <button
            onClick={selectAll}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Deselect All
          </button>
          <button
            onClick={selectOnlyLeaves}
            className="px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors flex items-center gap-1"
          >
            <Filter className="w-4 h-4" />
            Only Leaf Nodes
          </button>
        </div>

        {/* Tree View */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {entries.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No entries to export</p>
          ) : (
            <div className="space-y-1">
              {entries.map((entry) => renderEntry(entry))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={exportSelected}
            disabled={selectedCount === 0}
            className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export ({selectedCount})
          </button>
        </div>
      </div>
    </div>
  );
}
