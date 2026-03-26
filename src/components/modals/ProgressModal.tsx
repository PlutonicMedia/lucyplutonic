import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  current: number;
  total: number;
}

export function ProgressModal({ isOpen, onClose, current, total }: ProgressModalProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-background rounded-xl shadow-xl w-96 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Generation Progress</h3>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-6 space-y-4">
              <div className="text-center">
                <span className="text-3xl font-bold text-primary">{current}</span>
                <span className="text-lg text-muted-foreground"> / {total}</span>
                <p className="text-xs text-muted-foreground mt-1">images complete</p>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
