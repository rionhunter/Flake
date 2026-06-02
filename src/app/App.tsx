import { useState, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Download } from 'lucide-react';
import { Entry, NavigationPath } from './types';
import { Column } from './components/Column';
import { CollapsedColumn } from './components/CollapsedColumn';
import { KeyboardHelp } from './components/KeyboardHelp';
import { ExportDialog } from './components/ExportDialog';
import {
  generateId,
  findEntryById,
  updateEntry,
  deleteEntry,
  addEntryAtPosition,
  reorderEntries,
  promoteEntry,
} from './utils/entryUtils';

const INITIAL_ENTRIES: Entry[] = [
  { id: generateId(), text: 'Welcome to the Ideation Tool', children: [], tags: [], content: '' },
  { id: generateId(), text: 'Click a card to view its sub-entries', children: [], tags: [], content: '' },
  { id: generateId(), text: 'Double-click to edit', children: [], tags: [], content: '' },
  { id: generateId(), text: 'Drag to reorder', children: [], tags: [], content: '' },
];

const STORAGE_KEY = 'ideation-tool-entries';

const loadEntriesFromStorage = (): Entry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load entries from storage:', error);
  }
  return INITIAL_ENTRIES;
};

export default function App() {
  const [rootEntries, setRootEntries] = useState<Entry[]>(loadEntriesFromStorage);
  const [navigationPath, setNavigationPath] = useState<NavigationPath[]>([
    { columnIndex: 0, entryId: null },
  ]);
  const [focusedEntry, setFocusedEntry] = useState<{
    columnIndex: number;
    entryId: string | null;
  } | null>(null);
  const [maxVisibleColumn, setMaxVisibleColumn] = useState(0);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Get the entries for a specific column based on navigation path
  const getEntriesForColumn = useCallback(
    (columnIndex: number): Entry[] => {
      if (columnIndex === 0) return rootEntries;

      const pathToColumn = navigationPath.slice(0, columnIndex);
      let currentEntries = rootEntries;

      for (const path of pathToColumn) {
        if (path.entryId) {
          const entry = findEntryById(currentEntries, path.entryId);
          if (entry) {
            currentEntries = entry.children;
          } else {
            return [];
          }
        }
      }

      return currentEntries;
    },
    [rootEntries, navigationPath]
  );

  // Update entry text
  const handleUpdateText = useCallback(
    (columnIndex: number, entryId: string, text: string) => {
      setRootEntries((prev) =>
        updateEntry(prev, entryId, (entry) => ({ ...entry, text }))
      );
    },
    []
  );

  // Delete entry
  const handleDeleteEntry = useCallback(
    (columnIndex: number, entryId: string) => {
      setRootEntries((prev) => deleteEntry(prev, entryId));

      // Clear selection if deleted entry was selected
      setNavigationPath((prev) =>
        prev.filter((path) => path.entryId !== entryId)
      );
      setFocusedEntry((prev) =>
        prev?.entryId === entryId ? null : prev
      );
    },
    []
  );

  // Select an entry
  const handleSelectEntry = useCallback(
    (columnIndex: number, entryId: string) => {
      const entry = findEntryById(rootEntries, entryId);
      if (!entry) return;

      // Update navigation path
      setNavigationPath((prev) => {
        const newPath = prev.slice(0, columnIndex + 1);
        newPath[columnIndex] = { columnIndex, entryId };

        // If the entry has children, add a new path entry for the next column
        if (entry.children.length > 0) {
          newPath.push({ columnIndex: columnIndex + 1, entryId: null });
          setMaxVisibleColumn(columnIndex + 1);
        } else {
          setMaxVisibleColumn(columnIndex);
        }

        return newPath;
      });

      setFocusedEntry({ columnIndex, entryId });
    },
    [rootEntries]
  );

  // Move entry (drag and drop)
  const handleMoveEntry = useCallback(
    (columnIndex: number, draggedId: string, targetId: string, position: 'before' | 'after') => {
      const entries = getEntriesForColumn(columnIndex);
      const reordered = reorderEntries(entries, draggedId, targetId, position);

      if (columnIndex === 0) {
        setRootEntries(reordered);
      } else {
        // Find parent and update its children
        const parentPath = navigationPath[columnIndex - 1];
        if (parentPath?.entryId) {
          setRootEntries((prev) =>
            updateEntry(prev, parentPath.entryId!, (entry) => ({
              ...entry,
              children: reordered,
            }))
          );
        }
      }
    },
    [getEntriesForColumn, navigationPath]
  );

  // Add entry at various positions
  const addEntry = useCallback(
    (
      columnIndex: number,
      position: 'top' | 'bottom' | { before: string } | { after: string } | { child: string }
    ) => {
      const newEntry: Entry = {
        id: generateId(),
        text: '',
        children: [],
        tags: [],
        content: '',
      };

      if ('child' in position) {
        // Add as child
        setRootEntries((prev) => {
          const updated = updateEntry(prev, position.child, (entry) => ({
            ...entry,
            children: [...entry.children, newEntry],
          }));
          return updated;
        });

        // Update navigation to show the new child column
        setNavigationPath((prev) => {
          const newPath = prev.slice(0, columnIndex + 1);
          newPath[columnIndex] = { columnIndex, entryId: position.child };
          newPath.push({ columnIndex: columnIndex + 1, entryId: null });
          return newPath;
        });
        setMaxVisibleColumn(columnIndex + 1);
        setFocusedEntry({ columnIndex: columnIndex + 1, entryId: newEntry.id });
      } else {
        // Add to current column
        const entries = getEntriesForColumn(columnIndex);
        const updatedEntries = addEntryAtPosition(entries, newEntry, position);

        if (columnIndex === 0) {
          setRootEntries(updatedEntries);
        } else {
          const parentPath = navigationPath[columnIndex - 1];
          if (parentPath?.entryId) {
            setRootEntries((prev) =>
              updateEntry(prev, parentPath.entryId!, (entry) => ({
                ...entry,
                children: updatedEntries,
              }))
            );
          }
        }

        setFocusedEntry({ columnIndex, entryId: newEntry.id });
      }
    },
    [getEntriesForColumn, navigationPath, rootEntries]
  );

  // Promote entry (move it up one level in hierarchy)
  const handlePromoteEntry = useCallback(
    (columnIndex: number, entryId: string) => {
      // Can't promote if at root level
      if (columnIndex === 0) return;

      const parentPath = navigationPath[columnIndex - 1];
      if (!parentPath?.entryId) return;

      setRootEntries((prev) => promoteEntry(prev, entryId, parentPath.entryId));

      // Update focus to stay on the promoted entry, now in the parent column
      const parentColumnIndex = columnIndex - 1;
      setFocusedEntry({ columnIndex: parentColumnIndex, entryId });
      setMaxVisibleColumn(parentColumnIndex);
    },
    [navigationPath]
  );

  // Navigate to a collapsed column
  const handleCollapseClick = useCallback((columnIndex: number) => {
    setMaxVisibleColumn(columnIndex);
    setNavigationPath((prev) => prev.slice(0, columnIndex + 1));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focusedEntry) return;

      const { columnIndex, entryId } = focusedEntry;
      const entries = getEntriesForColumn(columnIndex);
      const currentIndex = entryId ? entries.findIndex((e) => e.id === entryId) : -1;

      // Prevent default for keyboard shortcuts
      if (
        e.key === 'Enter' ||
        e.key === 'Tab' ||
        (e.key === 'Backspace' && entryId) ||
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
      ) {
        if (!(e.target instanceof HTMLInputElement && (e.target as HTMLInputElement).type === 'text')) {
          e.preventDefault();
        }
      }

      // Don't handle if typing in input (unless it's readonly)
      if (
        e.target instanceof HTMLInputElement &&
        document.activeElement === e.target &&
        !e.target.readOnly
      ) {
        return;
      }

      // Add card below (Enter)
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && entryId) {
        addEntry(columnIndex, { after: entryId });
      }
      // Add card above (Shift+Enter)
      else if (e.key === 'Enter' && e.shiftKey && !e.ctrlKey && !e.metaKey && entryId) {
        addEntry(columnIndex, { before: entryId });
      }
      // Add card at top (Ctrl+Enter)
      else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        addEntry(columnIndex, 'top');
      }
      // Add card at bottom (Ctrl+Shift+Enter)
      else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        addEntry(columnIndex, 'bottom');
      }
      // Promote entry (Ctrl+Shift+Tab)
      else if (e.key === 'Tab' && (e.ctrlKey || e.metaKey) && e.shiftKey && entryId && columnIndex > 0) {
        e.preventDefault();
        handlePromoteEntry(columnIndex, entryId);
      }
      // Navigate to parent (Shift+Tab)
      else if (e.key === 'Tab' && e.shiftKey && !e.ctrlKey && !e.metaKey && columnIndex > 0) {
        e.preventDefault();
        const prevColumnPath = navigationPath[columnIndex - 1];
        if (prevColumnPath?.entryId) {
          setFocusedEntry({
            columnIndex: columnIndex - 1,
            entryId: prevColumnPath.entryId,
          });
          setMaxVisibleColumn(columnIndex - 1);
        }
      }
      // Add child card (Tab)
      else if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey && entryId) {
        e.preventDefault();
        addEntry(columnIndex, { child: entryId });
      }
      // Delete empty card (Backspace)
      else if (e.key === 'Backspace' && entryId) {
        const entry = findEntryById(rootEntries, entryId);
        if (entry && entry.text === '' && entry.children.length === 0) {
          handleDeleteEntry(columnIndex, entryId);
          // Focus previous or next entry
          if (currentIndex > 0) {
            setFocusedEntry({ columnIndex, entryId: entries[currentIndex - 1].id });
          } else if (entries.length > 1) {
            setFocusedEntry({ columnIndex, entryId: entries[1].id });
          } else {
            setFocusedEntry(null);
          }
        }
      }
      // Navigate up (ArrowUp)
      else if (e.key === 'ArrowUp' && currentIndex > 0) {
        setFocusedEntry({ columnIndex, entryId: entries[currentIndex - 1].id });
      }
      // Navigate down (ArrowDown)
      else if (e.key === 'ArrowDown' && currentIndex < entries.length - 1) {
        setFocusedEntry({ columnIndex, entryId: entries[currentIndex + 1].id });
      }
      // Navigate left (ArrowLeft)
      else if (e.key === 'ArrowLeft' && columnIndex > 0) {
        const prevColumnPath = navigationPath[columnIndex - 1];
        if (prevColumnPath) {
          setFocusedEntry({
            columnIndex: columnIndex - 1,
            entryId: prevColumnPath.entryId,
          });
          setMaxVisibleColumn(columnIndex - 1);
        }
      }
      // Navigate right (ArrowRight)
      else if (e.key === 'ArrowRight' && entryId) {
        const entry = findEntryById(rootEntries, entryId);
        if (entry && entry.children.length > 0) {
          setFocusedEntry({
            columnIndex: columnIndex + 1,
            entryId: entry.children[0].id,
          });
        }
      }
      // Deselect / Go back (Escape)
      else if (e.key === 'Escape') {
        if (columnIndex > 0) {
          setMaxVisibleColumn(columnIndex - 1);
          setNavigationPath((prev) => prev.slice(0, columnIndex));
          const prevPath = navigationPath[columnIndex - 1];
          setFocusedEntry({
            columnIndex: columnIndex - 1,
            entryId: prevPath?.entryId || null,
          });
        } else {
          setFocusedEntry(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    focusedEntry,
    getEntriesForColumn,
    addEntry,
    handleDeleteEntry,
    handlePromoteEntry,
    navigationPath,
    rootEntries,
  ]);

  // Global keyboard shortcuts (Ctrl/Cmd+E for export)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'e' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        setIsExportDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Auto-focus first entry on mount
  useEffect(() => {
    if (rootEntries.length > 0 && !focusedEntry) {
      setFocusedEntry({ columnIndex: 0, entryId: rootEntries[0].id });
    }
  }, []);

  // Save entries to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rootEntries));
    } catch (error) {
      console.error('Failed to save entries to storage:', error);
    }
  }, [rootEntries]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Ideation Tool</h1>
            <p className="text-sm text-gray-600 mt-1">
              Organize your ideas hierarchically
            </p>
          </div>
          <button
            onClick={() => setIsExportDialogOpen(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </header>

        {/* Columns Container */}
        <div className="flex-1 flex overflow-x-auto">
          {navigationPath.map((path, index) => {
            const entries = getEntriesForColumn(index);
            const isVisible = index <= maxVisibleColumn;

            if (!isVisible && index < maxVisibleColumn) {
              return (
                <CollapsedColumn
                  key={index}
                  columnIndex={index}
                  onClick={() => handleCollapseClick(index)}
                />
              );
            }

            if (!isVisible) return null;

            return (
              <Column
                key={index}
                entries={entries}
                selectedId={path.entryId}
                focusedId={focusedEntry?.columnIndex === index ? focusedEntry.entryId : null}
                onSelectEntry={(id) => handleSelectEntry(index, id)}
                onUpdateText={(id, text) => handleUpdateText(index, id, text)}
                onDeleteEntry={(id) => handleDeleteEntry(index, id)}
                onMoveEntry={(draggedId, targetId, position) =>
                  handleMoveEntry(index, draggedId, targetId, position)
                }
                onAddChild={(id) => addEntry(index, { child: id })}
                columnIndex={index}
              />
            );
          })}
        </div>

        <KeyboardHelp />
        <ExportDialog
          entries={rootEntries}
          isOpen={isExportDialogOpen}
          onClose={() => setIsExportDialogOpen(false)}
        />
      </div>
    </DndProvider>
  );
}
