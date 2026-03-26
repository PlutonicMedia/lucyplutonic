import { useState } from "react";
import { CheckSquare, Trash2, Download, Sparkles } from "lucide-react";
import { Lightbox } from "./Lightbox";
import type { GeneratedImage } from "@/hooks/useImages";
import JSZip from "jszip";
import { toast } from "sonner";

interface GalleryViewProps {
  images: GeneratedImage[];
  loading: boolean;
  folderName?: string;
  onDeleteImages: (ids: string[]) => Promise<void>;
  onSavePrompt: (text: string) => void;
  onRefresh: () => void;
}

export function GalleryView({ images, loading, folderName, onDeleteImages, onSavePrompt, onRefresh }: GalleryViewProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lightboxImage, setLightboxImage] = useState<GeneratedImage | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === images.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(images.map((img) => img.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (!selected.size) return;
    const count = selected.size;
    await onDeleteImages(Array.from(selected));
    setSelected(new Set());
    toast.success(`Deleted ${count} image(s)`);
  };

  const handleBulkDownload = async () => {
    if (!selected.size) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const toDownload = images.filter((img) => selected.has(img.id));
      for (const img of toDownload) {
        const resp = await fetch(img.image_url);
        const blob = await resp.blob();
        const ext = img.format.toLowerCase();
        zip.file(`${img.id}.${ext}`, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lucy-images-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch {
      toast.error("Failed to create ZIP");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{folderName || "All Images"}</h2>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <>
              <span className="text-xs text-muted-foreground">{selected.size} selected</span>
              <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
              <button onClick={handleBulkDownload} disabled={isZipping} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50">
                <Download className="w-3.5 h-3.5" />
                {isZipping ? "Zipping..." : "Download ZIP"}
              </button>
            </>
          )}
          {images.length > 0 && (
            <button onClick={selectAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent transition-colors">
              <CheckSquare className="w-3.5 h-3.5" />
              {selected.size === images.length ? "Deselect All" : "Select All"}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Sparkles className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Sparkles className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No images yet. Generate your first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className={`group relative rounded-lg overflow-hidden border transition-all cursor-pointer ${
                  selected.has(image.id) ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/30"
                }`}
              >
                <div className="aspect-square bg-muted" onClick={() => setLightboxImage(image)}>
                  <img src={image.image_url} alt={image.prompt} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelect(image.id); }}
                  className={`absolute top-2 left-2 w-5 h-5 rounded border flex items-center justify-center text-xs transition-all ${
                    selected.has(image.id)
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background/80 border-border opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {selected.has(image.id) && "✓"}
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-foreground/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white line-clamp-2">{image.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxImage && (
        <Lightbox
          image={lightboxImage}
          onClose={() => setLightboxImage(null)}
          onSavePrompt={onSavePrompt}
          onDelete={async () => {
            await onDeleteImages([lightboxImage.id]);
            setLightboxImage(null);
            toast.success("Image deleted");
          }}
        />
      )}
    </div>
  );
}
