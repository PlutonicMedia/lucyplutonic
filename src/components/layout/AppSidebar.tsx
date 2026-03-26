import { useState } from "react";
import { FolderOpen, Trash2, Image, BookOpen, Plus, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type Folder = Tables<"folders">;

interface AppSidebarProps {
  folders: Folder[];
  imageCounts: Record<string, number>;
  activeFolder: string | null;
  onFolderSelect: (id: string | null) => void;
  activeView: "gallery" | "library";
  onViewChange: (view: "gallery" | "library") => void;
  onAddFolder: (name: string) => void;
  onDeleteFolder: (id: string) => void;
}

export function AppSidebar({
  folders,
  imageCounts,
  activeFolder,
  onFolderSelect,
  activeView,
  onViewChange,
  onAddFolder,
  onDeleteFolder,
}: AppSidebarProps) {
  const { signOut } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    if (newName.trim()) {
      onAddFolder(newName.trim());
      setNewName("");
      setIsAdding(false);
    }
  };

  const handleDelete = (id: string) => {
    onDeleteFolder(id);
    if (activeFolder === id) onFolderSelect(null);
  };

  return (
    <aside className="w-60 border-r border-border bg-sidebar flex flex-col h-full">
      <div className="px-5 py-5 border-b border-border">
        <h1 className="text-xl font-bold text-primary tracking-tight">Lucy</h1>
      </div>

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
                <span className="text-xs text-muted-foreground">{imageCounts[folder.id] || 0}</span>
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

      <div className="px-3 py-3 border-t border-border">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
