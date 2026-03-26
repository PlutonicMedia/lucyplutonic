import { useState } from "react";
import { Search, Tag, Copy, Trash2, Plus } from "lucide-react";
import type { SavedPrompt } from "@/hooks/usePrompts";
import { toast } from "sonner";

interface PromptLibraryProps {
  prompts: SavedPrompt[];
  onAdd: (text: string, tags?: string[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function PromptLibrary({ prompts, onAdd, onDelete }: PromptLibraryProps) {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [newPrompt, setNewPrompt] = useState("");
  const [newTags, setNewTags] = useState("");

  const allTags = [...new Set(prompts.flatMap((p) => p.tags || []))];

  const filtered = prompts.filter((p) => {
    const matchesSearch = !search || p.text.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !activeTag || (p.tags || []).includes(activeTag);
    return matchesSearch && matchesTag;
  });

  const handleAdd = async () => {
    if (!newPrompt.trim()) return;
    const tags = newTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    await onAdd(newPrompt.trim(), tags);
    setNewPrompt("");
    setNewTags("");
    toast.success("Prompt saved");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-border space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Prompt Library</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeTag === tag ? "pill-active" : "pill-inactive"
                }`}
              >
                <Tag className="w-3 h-3" />
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Add new prompt */}
        <div className="space-y-2">
          <textarea
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            placeholder="Add a new prompt..."
            rows={2}
            className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex gap-2">
            <input
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="Tags (comma separated)"
              className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={handleAdd}
              disabled={!newPrompt.trim()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No prompts yet</p>
        ) : (
          filtered.map((prompt) => (
            <div key={prompt.id} className="group flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
              <div className="flex-1">
                <p className="text-sm text-foreground leading-relaxed">{prompt.text}</p>
                {prompt.tags && prompt.tags.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {prompt.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-medium pill-inactive">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { navigator.clipboard.writeText(prompt.text); toast.success("Copied"); }}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(prompt.id)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
