import { X, Download, Share2, Trash2, BookmarkPlus, Copy } from "lucide-react";
import type { GalleryImage } from "./GalleryView";
import { motion, AnimatePresence } from "framer-motion";

interface LightboxProps {
  image: GalleryImage;
  onClose: () => void;
}

export function Lightbox({ image, onClose }: LightboxProps) {
  const copyPrompt = () => {
    navigator.clipboard.writeText(image.prompt);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-foreground/60 flex"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="m-auto flex bg-background rounded-xl shadow-2xl overflow-hidden max-w-5xl max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image */}
          <div className="flex-1 bg-muted flex items-center justify-center min-w-[400px]">
            <img src={image.url} alt={image.prompt} className="max-w-full max-h-[85vh] object-contain" />
          </div>

          {/* Details Panel */}
          <div className="w-72 flex flex-col border-l border-border">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Details</h3>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Prompt */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prompt</span>
                  <button onClick={copyPrompt} className="text-muted-foreground hover:text-primary transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{image.prompt}</p>
              </div>

              {/* Metadata */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Metadata</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Aspect Ratio", value: image.aspectRatio },
                    { label: "Quality", value: image.quality },
                    { label: "Format", value: image.format },
                    { label: "Created", value: new Date(image.createdAt).toLocaleDateString() },
                  ].map((item) => (
                    <div key={item.label} className="bg-muted rounded-md px-2.5 py-2">
                      <span className="text-[10px] text-muted-foreground uppercase">{item.label}</span>
                      <p className="text-xs font-medium text-foreground mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-4 border-t border-border space-y-1.5">
              {[
                { icon: BookmarkPlus, label: "Save Prompt to Library" },
                { icon: Download, label: "Download" },
                { icon: Share2, label: "Share" },
                { icon: Trash2, label: "Delete", destructive: true },
              ].map(({ icon: Icon, label, destructive }) => (
                <button
                  key={label}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                    destructive ? "text-destructive hover:bg-destructive/10" : "text-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
