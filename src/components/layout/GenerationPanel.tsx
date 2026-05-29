import { useState, useRef } from "react";
import { Upload, Sparkles, BookmarkPlus, X, Library, Globe, FolderOpen, Images } from "lucide-react";
import { cn } from "@/lib/utils";
import { PromptPicker } from "@/components/generation/PromptPicker";
import type { SavedPrompt } from "@/hooks/usePrompts";

const ASPECT_RATIOS = ["1:1", "9:16", "4:5", "3:4", "16:9"] as const;
const QUALITIES = ["1K", "2K", "4K"] as const;
const FORMATS = ["PNG", "JPG", "WebP"] as const;

export const CAROUSEL_ENVIRONMENTS = [
  { id: "studio", label: "Studio", description: "clean photo studio with soft seamless backdrop and controlled lighting" },
  { id: "outdoor", label: "Outdoor", description: "natural outdoor daylight setting with soft sunlight and shallow depth of field" },
  { id: "urban", label: "Urban", description: "urban street environment with modern architecture and editorial styling" },
  { id: "lifestyle", label: "Lifestyle", description: "warm indoor lifestyle interior with natural window light" },
  { id: "minimal", label: "Minimal", description: "minimalist neutral set with pastel backdrop and subtle shadows" },
] as const;

export type CarouselEnvId = (typeof CAROUSEL_ENVIRONMENTS)[number]["id"];

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
  carousel?: {
    enabled: boolean;
    environments: CarouselEnvId[];
  };
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
  const [carouselEnabled, setCarouselEnabled] = useState(false);
  const [selectedEnvs, setSelectedEnvs] = useState<CarouselEnvId[]>(["studio", "outdoor", "urban"]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    onGenerate({
      prompt,
      aspectRatio,
      quality,
      format,
      outputs: carouselEnabled ? selectedEnvs.length : outputs,
      referenceImages,
      carousel: carouselEnabled ? { enabled: true, environments: selectedEnvs } : undefined,
    });
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

  const toggleEnv = (id: CarouselEnvId) => {
    setSelectedEnvs((prev) => {
      if (prev.includes(id)) return prev.filter((e) => e !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
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

        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Images className="w-3.5 h-3.5 text-muted-foreground" />
              <label className="text-xs font-medium text-foreground">Carousel mode</label>
            </div>
            <button
              type="button"
              onClick={() => setCarouselEnabled((v) => !v)}
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                carouselEnabled ? "bg-primary" : "bg-muted",
              )}
              aria-pressed={carouselEnabled}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-background transition-transform",
                  carouselEnabled ? "translate-x-4" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Generate up to 5 variants of the same style in different environments.
          </p>

          {carouselEnabled ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Environments</span>
                <span className="text-[11px] font-semibold text-foreground">{selectedEnvs.length}/5</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CAROUSEL_ENVIRONMENTS.map((env) => {
                  const active = selectedEnvs.includes(env.id);
                  return (
                    <button
                      key={env.id}
                      type="button"
                      onClick={() => toggleEnv(env.id)}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors",
                        active ? "pill-active" : "pill-inactive",
                      )}
                    >
                      {env.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Outputs</span>
                <span className="text-[11px] font-semibold text-foreground">{outputs}</span>
              </div>
              <input type="range" min={1} max={10} value={outputs} onChange={(e) => setOutputs(Number(e.target.value))} className="w-full accent-primary h-1.5" />
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-border space-y-2">
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating || (carouselEnabled && selectedEnvs.length === 0)}
          className={cn("w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors", "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed")}
        >
          <Sparkles className="w-4 h-4" />
          {isGenerating
            ? "Generating..."
            : carouselEnabled
              ? `Generate carousel (${selectedEnvs.length})`
              : "Generate"}
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
