import { Entry } from '../types';

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const findEntryById = (entries: Entry[], id: string): Entry | null => {
  for (const entry of entries) {
    if (entry.id === id) return entry;
    const found = findEntryById(entry.children, id);
    if (found) return found;
  }
  return null;
};

export const findParentEntry = (
  entries: Entry[],
  targetId: string,
  parent: Entry | null = null
): Entry | null => {
  for (const entry of entries) {
    if (entry.id === targetId) return parent;
    const found = findParentEntry(entry.children, targetId, entry);
    if (found !== null) return found;
  }
  return null;
};

export const updateEntry = (
  entries: Entry[],
  id: string,
  updater: (entry: Entry) => Entry
): Entry[] => {
  return entries.map((entry) => {
    if (entry.id === id) return updater(entry);
    return {
      ...entry,
      children: updateEntry(entry.children, id, updater),
    };
  });
};

export const deleteEntry = (entries: Entry[], id: string): Entry[] => {
  return entries
    .filter((entry) => entry.id !== id)
    .map((entry) => ({
      ...entry,
      children: deleteEntry(entry.children, id),
    }));
};

export const addEntryAtPosition = (
  entries: Entry[],
  newEntry: Entry,
  position: 'top' | 'bottom' | { before: string } | { after: string } | { child: string }
): Entry[] => {
  if (position === 'top') {
    return [newEntry, ...entries];
  }
  if (position === 'bottom') {
    return [...entries, newEntry];
  }

  if ('before' in position) {
    const result: Entry[] = [];
    for (const entry of entries) {
      if (entry.id === position.before) {
        result.push(newEntry);
      }
      result.push(entry);
    }
    return result;
  }

  if ('after' in position) {
    const result: Entry[] = [];
    for (const entry of entries) {
      result.push(entry);
      if (entry.id === position.after) {
        result.push(newEntry);
      }
    }
    return result;
  }

  if ('child' in position) {
    return entries.map((entry) => {
      if (entry.id === position.child) {
        return {
          ...entry,
          children: [...entry.children, newEntry],
        };
      }
      return {
        ...entry,
        children: addEntryAtPosition(entry.children, newEntry, position),
      };
    });
  }

  return entries;
};

export const reorderEntries = (
  entries: Entry[],
  draggedId: string,
  targetId: string,
  position: 'before' | 'after'
): Entry[] => {
  // First, find and remove the dragged entry
  const draggedEntry = findEntryById(entries, draggedId);
  if (!draggedEntry) return entries;

  const withoutDragged = deleteEntry(entries, draggedId);

  // Then add it at the new position
  const positionObj = position === 'before' ? { before: targetId } : { after: targetId };
  return addEntryAtPosition(withoutDragged, draggedEntry, positionObj);
};

export const promoteEntry = (
  entries: Entry[],
  entryId: string,
  parentId: string | null
): Entry[] => {
  // Find the entry to promote
  const entry = findEntryById(entries, entryId);
  if (!entry) return entries;

  // Remove the entry from its current position
  const withoutEntry = deleteEntry(entries, entryId);

  // If parent is null (entry is at root level), can't promote
  if (parentId === null) return entries;

  // Add the entry as a sibling of its parent (after the parent)
  return addEntryAtPosition(withoutEntry, entry, { after: parentId });
};
