import { useState } from "react";
import { CheckSquare, Download, Trash2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Lightbox } from "./Lightbox";

export interface GalleryImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  quality: string;
  format: string;
  createdAt: string;
}

const DEMO_IMAGES: GalleryImage[] = Array.from({ length: 8 }, (_, i) => ({
  id: String(i + 1),
  url: `https://picsum.photos/seed/lucy${i + 1}/600/600`,
  prompt: `A beautiful AI-generated image #${i + 1} with stunning details and vibrant composition`,
  aspectRatio: "1:1",
  quality: "2K",
  format: "PNG",
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
}));

interface GalleryViewProps {
  folderName?: string;
}

export function GalleryView({ folderName }: GalleryViewProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);
  const images = DEMO_IMAGES;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === images.length) setSelected(new Set());
    else setSelected(new Set(images.map((i) => i.id)));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{folderName || "All Images"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{images.length} images</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={selectAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent transition-colors">
            <CheckSquare className="w-3.5 h-3.5" />
            {selected.size === images.length ? "Deselect All" : "Select All"}
          </button>
          {selected.size > 0 && (
            <>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent transition-colors">
                <Download className="w-3.5 h-3.5" />
                Download ({selected.size})
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
                Delete ({selected.size})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No images yet</p>
            <p className="text-xs mt-1">Generate your first image using the panel</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((img) => (
              <div
                key={img.id}
                className={cn(
                  "group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all",
                  selected.has(img.id) ? "border-primary ring-1 ring-primary" : "border-transparent hover:border-border"
                )}
              >
                <img
                  src={img.url}
                  alt={img.prompt}
                  className="w-full h-full object-cover"
                  onClick={() => setLightboxImage(img)}
                  loading="lazy"
                />
                {/* Selection checkbox */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelect(img.id); }}
                  className={cn(
                    "absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                    selected.has(img.id)
                      ? "bg-primary border-primary"
                      : "border-primary-foreground/60 bg-foreground/20 opacity-0 group-hover:opacity-100"
                  )}
                >
                  {selected.has(img.id) && (
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxImage && <Lightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />}
    </div>
  );
}
