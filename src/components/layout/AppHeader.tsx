import { Loader2 } from "lucide-react";

interface AppHeaderProps {
  isGenerating: boolean;
  onShowProgress: () => void;
}

export function AppHeader({ isGenerating, onShowProgress }: AppHeaderProps) {
  return (
    <header className="h-12 border-b border-border flex items-center justify-end px-5 bg-background">
      {isGenerating && (
        <button
          onClick={onShowProgress}
          className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <Loader2 className="w-4 h-4 animate-spin-slow" />
          Generating...
        </button>
      )}
    </header>
  );
}
