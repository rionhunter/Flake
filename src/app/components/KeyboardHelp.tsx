import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

export function KeyboardHelp() {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { keys: ['Enter'], description: 'Add card below current' },
    { keys: ['Shift', 'Enter'], description: 'Add card above current' },
    { keys: ['Tab'], description: 'Add child card to current' },
    { keys: ['Shift', 'Tab'], description: 'Focus parent card' },
    { keys: ['Ctrl', 'Shift', 'Tab'], description: 'Promote card (move up one level)' },
    { keys: ['Ctrl', 'Enter'], description: 'Add card at top of list' },
    { keys: ['Ctrl', 'Shift', 'Enter'], description: 'Add card at bottom of list' },
    { keys: ['↑', '↓'], description: 'Navigate between cards' },
    { keys: ['←', '→'], description: 'Navigate between columns' },
    { keys: ['Backspace'], description: 'Delete current card (if empty)' },
    { keys: ['Ctrl', 'E'], description: 'Export ideas' },
    { keys: ['Escape'], description: 'Deselect / Go back' },
    { keys: ['Double Click'], description: 'Edit card text' },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors z-50"
        aria-label="Keyboard shortcuts"
      >
        <HelpCircle className="w-5 h-5 text-gray-600" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-lg">Keyboard Shortcuts</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-start justify-between gap-4">
                  <div className="flex gap-1 flex-wrap">
                    {shortcut.keys.map((key, keyIndex) => (
                      <span key={keyIndex} className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                          {key}
                        </kbd>
                        {keyIndex < shortcut.keys.length - 1 && (
                          <span className="text-gray-400 text-xs">+</span>
                        )}
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 text-right flex-1">
                    {shortcut.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
