import { useState } from "react";
import { Search, X } from "lucide-react";
import type { SavedPrompt } from "@/hooks/usePrompts";

interface PromptPickerProps {
  prompts: SavedPrompt[];
  onSelect: (text: string) => void;
  onClose: () => void;
  activeFolder: string | null;
}

export function PromptPicker({ prompts, onSelect, onClose, activeFolder }: PromptPickerProps) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "project">("all");

  // For now all saved prompts are "global" since they aren't folder-scoped in the DB.
  // "Project" tab is a placeholder for future folder-scoped prompts.
  const filtered = prompts.filter((p) =>
    !search || p.text.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-lg border border-border bg-background shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex gap-1">
          <button
            onClick={() => setTab("all")}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              tab === "all" ? "pill-active" : "pill-inactive"
            }`}
          >
            All Prompts
          </button>
          {activeFolder && (
            <button
              onClick={() => setTab("project")}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                tab === "project" ? "pill-active" : "pill-inactive"
              }`}
            >
              Project
            </button>
          )}
        </div>
        <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="w-full text-xs pl-7 pr-2 py-1.5 rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            {tab === "project" ? "No project prompts yet" : "No prompts saved yet"}
          </p>
        ) : (
          filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.text)}
              className="w-full text-left px-3 py-2.5 text-xs text-foreground hover:bg-accent border-b border-border last:border-0 transition-colors line-clamp-2"
            >
              {p.text}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
