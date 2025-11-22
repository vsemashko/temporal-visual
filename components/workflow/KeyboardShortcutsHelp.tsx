import { X, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  if (!open) return null;

  const shortcuts = [
    { key: "Ctrl + S", description: "Save workflow" },
    { key: "Delete", description: "Delete selected node" },
    { key: "Escape", description: "Deselect node" },
    { key: "Ctrl + Z", description: "Undo (coming soon)" },
    { key: "Ctrl + Y", description: "Redo (coming soon)" },
    { key: "Ctrl + C", description: "Copy node (coming soon)" },
    { key: "Ctrl + V", description: "Paste node (coming soon)" },
    { key: "?", description: "Show this help" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-[600px] max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-2">Shortcut</th>
                <th className="text-left pb-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {shortcuts.map((shortcut, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="py-3">
                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                      {shortcut.key}
                    </kbd>
                  </td>
                  <td className="py-3 text-sm text-gray-600">{shortcut.description}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">Tips:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Use mouse drag-and-drop for faster workflow building</li>
              <li>• Auto-save runs every 30 seconds</li>
              <li>• Validate before generating to catch errors early</li>
              <li>• Use the AI assistant for workflow suggestions</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
