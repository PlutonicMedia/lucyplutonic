import { useState, useRef } from "react";
import { Upload, Sparkles, BookmarkPlus, X, Library, Globe, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { PromptPicker } from "@/components/generation/PromptPicker";
import type { SavedPrompt } from "@/hooks/usePrompts";

const ASPECT_RATIOS = ["1:1", "9:16", "4:5", "3:4", "16:9"] as const;
const QUALITIES = ["1K", "2K", "4K"] as const;
const FORMATS = ["PNG", "JPG", "WebP"] as const;

interface GenerationPanelProps {
  onGenerate: (config: GenerationConfig) => void;
  isGenerating: boolean;
  onSavePrompt: (text: string, folderId?: string | null) => void;
  activeFolder: string | null;
  globalPrompts: SavedPrompt[];
  projectPrompts: SavedPrompt[];
}

export interface GenerationConfig {
  prompt: string;
  aspectRatio: string;
  quality: string;
  format: string;
  outputs: number;
  referenceImages?: File[];
}

export function GenerationPanel({ onGenerate, isGenerating, onSavePrompt, activeFolder, globalPrompts, projectPrompts }: GenerationPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [quality, setQuality] = useState<string>("2K");
  const [format, setFormat] = useState<string>("PNG");
  const [outputs, setOutputs] = useState(1);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [referencePreviews, setReferencePreviews] = useState<string[]>([]);
  const [showPromptPicker, setShowPromptPicker] = useState(false);
  const [showSaveScope, setShowSaveScope] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    onGenerate({ prompt, aspectRatio, quality, format, outputs, referenceImages });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    const combined = [...referenceImages, ...imageFiles].slice(0, 5);
    setReferenceImages(combined);
    const previews = combined.map((f) => URL.createObjectURL(f));
    referencePreviews.forEach((url) => URL.revokeObjectURL(url));
    setReferencePreviews(previews);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeReference = (index: number) => {
    URL.revokeObjectURL(referencePreviews[index]);
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
    setReferencePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectPrompt = (text: string) => {
    setPrompt(text);
    setShowPromptPicker(false);
  };

  const handleSave = (scope: "global" | "project") => {
    if (!prompt.trim()) return;
    onSavePrompt(prompt.trim(), scope === "project" ? activeFolder : null);
    setShowSaveScope(false);
  };

  return (
    <div className="w-80 border-r border-border bg-panel flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Generate</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prompt</label>
            <button
              onClick={() => setShowPromptPicker(!showPromptPicker)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <Library className="w-3 h-3" />
              From Library
            </button>
          </div>

          {showPromptPicker && (
            <PromptPicker
              globalPrompts={globalPrompts}
              projectPrompts={projectPrompts}
              onSelect={handleSelectPrompt}
              onClose={() => setShowPromptPicker(false)}
              activeFolder={activeFolder}
            />
          )}

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
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
          {referencePreviews.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {referencePreviews.map((url, i) => (
                <div key={i} className="relative w-14 h-14 rounded-md overflow-hidden border border-border group">
                  <img src={url} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeReference(i)} className="absolute inset-0 flex items-center justify-center bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-3 py-6 rounded-lg border border-dashed border-input text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            <Upload className="w-4 h-4" />
            {referenceImages.length > 0 ? `Add more (${referenceImages.length}/5)` : "Upload references"}
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aspect Ratio</label>
          <div className="flex flex-wrap gap-1.5">
            {ASPECT_RATIOS.map((ar) => (
              <button key={ar} onClick={() => setAspectRatio(ar)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors", aspectRatio === ar ? "pill-active" : "pill-inactive")}>{ar}</button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quality</label>
          <div className="flex gap-1.5">
            {QUALITIES.map((q) => (
              <button key={q} onClick={() => setQuality(q)} className={cn("flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors", quality === q ? "pill-active" : "pill-inactive")}>{q}</button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Format</label>
          <div className="flex gap-1.5">
            {FORMATS.map((f) => (
              <button key={f} onClick={() => setFormat(f)} className={cn("flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors", format === f ? "pill-active" : "pill-inactive")}>{f}</button>
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
          className={cn("w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors", "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed")}
        >
          <Sparkles className="w-4 h-4" />
          {isGenerating ? "Generating..." : "Generate"}
        </button>

        <div className="relative">
          <button
            onClick={() => prompt.trim() && setShowSaveScope(!showSaveScope)}
            disabled={!prompt.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
          >
            <BookmarkPlus className="w-4 h-4" />
            Save to Library
          </button>

          {showSaveScope && (
            <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-border bg-background shadow-lg overflow-hidden z-10">
              <button onClick={() => handleSave("global")} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-foreground hover:bg-accent transition-colors">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                Save as Global
              </button>
              <button
                onClick={() => handleSave("project")}
                disabled={!activeFolder}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-t border-border"
              >
                <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
                Save to Project
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
