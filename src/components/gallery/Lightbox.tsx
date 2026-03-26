import { X, Download, Share2, Trash2, BookmarkPlus, Copy } from "lucide-react";
import type { GeneratedImage } from "@/hooks/useImages";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface LightboxProps {
  image: GeneratedImage;
  onClose: () => void;
  onSavePrompt: (text: string) => void;
  onDelete: () => void;
}

export function Lightbox({ image, onClose, onSavePrompt, onDelete }: LightboxProps) {
  const copyPrompt = () => {
    navigator.clipboard.writeText(image.prompt);
    toast.success("Prompt copied");
  };

  const handleDownload = async () => {
    const resp = await fetch(image.image_url);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${image.id}.${image.format.toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(image.image_url);
      toast.success("Image URL copied to clipboard");
    } catch {
      toast.error("Failed to copy URL");
    }
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
          <div className="flex-1 bg-muted flex items-center justify-center min-w-[400px]">
            <img src={image.image_url} alt={image.prompt} className="max-w-full max-h-[85vh] object-contain" />
          </div>

          <div className="w-72 flex flex-col border-l border-border">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Details</h3>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prompt</span>
                  <button onClick={copyPrompt} className="text-muted-foreground hover:text-primary transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{image.prompt}</p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Metadata</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Aspect Ratio", value: image.aspect_ratio },
                    { label: "Quality", value: image.quality },
                    { label: "Format", value: image.format },
                    { label: "Created", value: new Date(image.created_at).toLocaleDateString() },
                  ].map((item) => (
                    <div key={item.label} className="bg-muted rounded-md px-2.5 py-2">
                      <span className="text-[10px] text-muted-foreground uppercase">{item.label}</span>
                      <p className="text-xs font-medium text-foreground mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-border space-y-1.5">
              {[
                { icon: BookmarkPlus, label: "Save Prompt to Library", action: () => { onSavePrompt(image.prompt); toast.success("Prompt saved"); } },
                { icon: Download, label: "Download", action: handleDownload },
                { icon: Share2, label: "Share", action: handleShare },
                { icon: Trash2, label: "Delete", destructive: true, action: onDelete },
              ].map(({ icon: Icon, label, destructive, action }) => (
                <button
                  key={label}
                  onClick={action}
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
