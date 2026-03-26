import { useState } from "react";
import { Search, Tag, Copy, Trash2 } from "lucide-react";

interface SavedPrompt {
  id: string;
  text: string;
  tags: string[];
  createdAt: string;
}

const DEMO_PROMPTS: SavedPrompt[] = [
  { id: "1", text: "A minimalist product shot on white marble with soft shadows", tags: ["product", "minimal"], createdAt: new Date().toISOString() },
  { id: "2", text: "Cinematic portrait with warm golden hour lighting and bokeh background", tags: ["portrait", "cinematic"], createdAt: new Date().toISOString() },
  { id: "3", text: "Abstract geometric patterns in emerald and gold tones", tags: ["abstract", "pattern"], createdAt: new Date().toISOString() },
];

export function PromptLibrary() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = [...new Set(DEMO_PROMPTS.flatMap((p) => p.tags))];

  const filtered = DEMO_PROMPTS.filter((p) => {
    const matchesSearch = !search || p.text.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !activeTag || p.tags.includes(activeTag);
    return matchesSearch && matchesTag;
  });

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
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-2">
        {filtered.map((prompt) => (
          <div key={prompt.id} className="group flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
            <p className="flex-1 text-sm text-foreground leading-relaxed">{prompt.text}</p>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => navigator.clipboard.writeText(prompt.text)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
