import { useState, useCallback } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { GenerationPanel, type GenerationConfig } from "@/components/layout/GenerationPanel";
import { AppHeader } from "@/components/layout/AppHeader";
import { GalleryView } from "@/components/gallery/GalleryView";
import { PromptLibrary } from "@/components/library/PromptLibrary";
import { ProgressModal } from "@/components/modals/ProgressModal";
import { useFolders } from "@/hooks/useFolders";
import { useImages, type GeneratedImage } from "@/hooks/useImages";
import { usePrompts } from "@/hooks/usePrompts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"gallery" | "library">("gallery");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const { folders, imageCounts, addFolder, deleteFolder, refetchCounts } = useFolders();
  const { images, loading: imagesLoading, fetchImages, deleteImages, addImage } = useImages(activeFolder);
  const { prompts, addPrompt, deletePrompt } = usePrompts();

  const handleGenerate = useCallback(async (config: GenerationConfig) => {
    setIsGenerating(true);
    setProgress({ current: 0, total: config.outputs });
    setShowProgress(true);

    for (let i = 0; i < config.outputs; i++) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error("Not authenticated");
          break;
        }

        const response = await supabase.functions.invoke("generate-image", {
          body: {
            prompt: config.prompt,
            aspectRatio: config.aspectRatio,
            quality: config.quality,
            format: config.format,
            folderId: activeFolder,
          },
        });

        if (response.error) {
          toast.error(response.error.message || "Generation failed");
          break;
        }

        const { image } = response.data;
        addImage(image as GeneratedImage);
        setProgress((p) => ({ ...p, current: p.current + 1 }));
        refetchCounts();
      } catch (err: any) {
        toast.error(err.message || "Generation failed");
        break;
      }
    }

    setIsGenerating(false);
  }, [activeFolder, addImage, refetchCounts]);

  const handleSavePrompt = useCallback(async (text: string) => {
    await addPrompt(text);
    toast.success("Prompt saved to library");
  }, [addPrompt]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        folders={folders}
        imageCounts={imageCounts}
        activeFolder={activeFolder}
        onFolderSelect={setActiveFolder}
        activeView={activeView}
        onViewChange={setActiveView}
        onAddFolder={addFolder}
        onDeleteFolder={deleteFolder}
      />
      <GenerationPanel
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        onSavePrompt={handleSavePrompt}
        activeFolder={activeFolder}
        prompts={prompts}
      />
      <div className="flex-1 flex flex-col">
        <AppHeader isGenerating={isGenerating} onShowProgress={() => setShowProgress(true)} />
        {activeView === "gallery" ? (
          <GalleryView
            images={images}
            loading={imagesLoading}
            folderName={folders.find((f) => f.id === activeFolder)?.name}
            onDeleteImages={deleteImages}
            onSavePrompt={handleSavePrompt}
            onRefresh={fetchImages}
          />
        ) : (
          <PromptLibrary prompts={prompts} onAdd={addPrompt} onDelete={deletePrompt} />
        )}
      </div>
      <ProgressModal isOpen={showProgress} onClose={() => setShowProgress(false)} current={progress.current} total={progress.total} />
    </div>
  );
};

export default Index;
