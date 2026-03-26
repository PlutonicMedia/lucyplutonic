import { useState } from "react";
import { FolderPlus, FolderOpen, Trash2, Image, BookOpen, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Folder {
  id: string;
  name: string;
  count: number;
}

const INITIAL_FOLDERS: Folder[] = [
  { id: "1", name: "Brand Assets", count: 12 },
  { id: "2", name: "Social Media", count: 8 },
  { id: "3", name: "Product Shots", count: 5 },
];

interface AppSidebarProps {
  activeFolder: string | null;
  onFolderSelect: (id: string | null) => void;
  activeView: "gallery" | "library";
  onViewChange: (view: "gallery" | "library") => void;
}

export function AppSidebar({ activeFolder, onFolderSelect, activeView, onViewChange }: AppSidebarProps) {
  const [folders, setFolders] = useState<Folder[]>(INITIAL_FOLDERS);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    if (newName.trim()) {
      setFolders((prev) => [...prev, { id: Date.now().toString(), name: newName.trim(), count: 0 }]);
      setNewName("");
      setIsAdding(false);
    }
  };

  const handleDelete = (id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    if (activeFolder === id) onFolderSelect(null);
  };

  return (
    <aside className="w-60 border-r border-border bg-sidebar flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <h1 className="text-xl font-bold text-primary tracking-tight">Lucy</h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <button
          onClick={() => { onViewChange("gallery"); onFolderSelect(null); }}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            activeView === "gallery" && !activeFolder ? "bg-accent text-accent-foreground" : "text-sidebar-foreground hover:bg-accent/60"
          )}
        >
          <Image className="w-4 h-4" />
          All Images
        </button>
        <button
          onClick={() => onViewChange("library")}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            activeView === "library" ? "bg-accent text-accent-foreground" : "text-sidebar-foreground hover:bg-accent/60"
          )}
        >
          <BookOpen className="w-4 h-4" />
          Prompt Library
        </button>

        {/* Folders */}
        <div className="pt-4">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Projects</span>
            <button onClick={() => setIsAdding(true)} className="text-muted-foreground hover:text-primary transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {isAdding && (
            <div className="px-3 mb-1">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                onBlur={() => { if (!newName.trim()) setIsAdding(false); else handleAdd(); }}
                placeholder="Folder name..."
                className="w-full text-sm px-2 py-1.5 rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}

          {folders.map((folder) => (
            <div key={folder.id} className="group flex items-center">
              <button
                onClick={() => { onViewChange("gallery"); onFolderSelect(folder.id); }}
                className={cn(
                  "flex-1 flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                  activeFolder === folder.id ? "bg-accent text-accent-foreground font-medium" : "text-sidebar-foreground hover:bg-accent/60"
                )}
              >
                <FolderOpen className="w-4 h-4" />
                <span className="truncate flex-1 text-left">{folder.name}</span>
                <span className="text-xs text-muted-foreground">{folder.count}</span>
              </button>
              <button
                onClick={() => handleDelete(folder.id)}
                className="opacity-0 group-hover:opacity-100 p-1 mr-1 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}
