import { useState } from "react";
import { Upload, Sparkles, BookmarkPlus } from "lucide-react";
import { cn } from "@/lib/utils";

const ASPECT_RATIOS = ["1:1", "9:16", "4:5", "3:4", "16:9"] as const;
const QUALITIES = ["1K", "2K", "4K"] as const;
const FORMATS = ["PNG", "JPG", "WebP"] as const;

interface GenerationPanelProps {
  onGenerate: (config: GenerationConfig) => void;
  isGenerating: boolean;
  onSavePrompt: (text: string) => void;
  activeFolder: string | null;
}

export interface GenerationConfig {
  prompt: string;
  aspectRatio: string;
  quality: string;
  format: string;
  outputs: number;
}

export function GenerationPanel({ onGenerate, isGenerating, onSavePrompt }: GenerationPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [quality, setQuality] = useState<string>("2K");
  const [format, setFormat] = useState<string>("PNG");
  const [outputs, setOutputs] = useState(1);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    onGenerate({ prompt, aspectRatio, quality, format, outputs });
  };

  return (
    <div className="w-80 border-r border-border bg-panel flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Generate</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your output image..."
            rows={5}
            className="w-full text-sm px-3 py-2.5 rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/60"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reference Images</label>
          <button className="w-full flex items-center justify-center gap-2 px-3 py-6 rounded-lg border border-dashed border-input text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            <Upload className="w-4 h-4" />
            Upload references
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aspect Ratio</label>
          <div className="flex flex-wrap gap-1.5">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar}
                onClick={() => setAspectRatio(ar)}
                className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors", aspectRatio === ar ? "pill-active" : "pill-inactive")}
              >
                {ar}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quality</label>
          <div className="flex gap-1.5">
            {QUALITIES.map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={cn("flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors", quality === q ? "pill-active" : "pill-inactive")}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Format</label>
          <div className="flex gap-1.5">
            {FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={cn("flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors", format === f ? "pill-active" : "pill-inactive")}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Outputs</label>
            <span className="text-xs font-semibold text-foreground">{outputs}</span>
          </div>
          <input type="range" min={1} max={10} value={outputs} onChange={(e) => setOutputs(Number(e.target.value))} className="w-full accent-primary h-1.5" />
        </div>
      </div>

      <div className="px-5 py-4 border-t border-border space-y-2">
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
            "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Sparkles className="w-4 h-4" />
          {isGenerating ? "Generating..." : "Generate"}
        </button>
        <button
          onClick={() => prompt.trim() && onSavePrompt(prompt.trim())}
          disabled={!prompt.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
        >
          <BookmarkPlus className="w-4 h-4" />
          Save to Library
        </button>
      </div>
    </div>
  );
}
