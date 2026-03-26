import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { GenerationPanel, type GenerationConfig } from "@/components/layout/GenerationPanel";
import { AppHeader } from "@/components/layout/AppHeader";
import { GalleryView } from "@/components/gallery/GalleryView";
import { PromptLibrary } from "@/components/library/PromptLibrary";
import { ProgressModal } from "@/components/modals/ProgressModal";

const Index = () => {
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"gallery" | "library">("gallery");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleGenerate = (config: GenerationConfig) => {
    setIsGenerating(true);
    setProgress({ current: 0, total: config.outputs });
    setShowProgress(true);

    // Demo: simulate progress
    let done = 0;
    const interval = setInterval(() => {
      done++;
      setProgress({ current: done, total: config.outputs });
      if (done >= config.outputs) {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 1500);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        activeFolder={activeFolder}
        onFolderSelect={setActiveFolder}
        activeView={activeView}
        onViewChange={setActiveView}
      />
      <GenerationPanel onGenerate={handleGenerate} isGenerating={isGenerating} />
      <div className="flex-1 flex flex-col">
        <AppHeader isGenerating={isGenerating} onShowProgress={() => setShowProgress(true)} />
        {activeView === "gallery" ? <GalleryView folderName={activeFolder ? "Project" : undefined} /> : <PromptLibrary />}
      </div>
      <ProgressModal isOpen={showProgress} onClose={() => setShowProgress(false)} current={progress.current} total={progress.total} />
    </div>
  );
};

export default Index;
