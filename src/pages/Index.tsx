import { useState, useCallback } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { GenerationPanel, type GenerationConfig, CAROUSEL_ENVIRONMENTS } from "@/components/layout/GenerationPanel";
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
  const { prompts, globalPrompts, getProjectPrompts, addPrompt, deletePrompt } = usePrompts();

  const projectPrompts = getProjectPrompts(activeFolder);

  const handleGenerate = useCallback(async (config: GenerationConfig) => {
    setIsGenerating(true);
    const carousel = config.carousel;
    const envs = carousel?.enabled ? carousel.environments : [];
    const total = carousel?.enabled ? envs.length : config.outputs;
    setProgress({ current: 0, total });
    setShowProgress(true);

    let referenceBase64: string[] = [];
    if (config.referenceImages?.length) {
      referenceBase64 = await Promise.all(
        config.referenceImages.map(
          (file) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            })
        )
      );
    }

    const carouselGroupId = carousel?.enabled ? crypto.randomUUID() : null;

    for (let i = 0; i < total; i++) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { toast.error("Not authenticated"); break; }

        let perPrompt = config.prompt;
        let envLabel: string | null = null;
        if (carousel?.enabled) {
          const env = CAROUSEL_ENVIRONMENTS.find((e) => e.id === envs[i]);
          if (env) {
            perPrompt = `${config.prompt} — set in ${env.description}. Keep the same subject, wardrobe, styling and overall look consistent across variants.`;
            envLabel = env.label;
          }
        }

        const response = await supabase.functions.invoke("generate-image", {
          body: {
            prompt: perPrompt,
            aspectRatio: config.aspectRatio,
            quality: config.quality,
            format: config.format,
            folderId: activeFolder,
            referenceImages: referenceBase64,
            carouselGroupId,
            environment: envLabel,
          },
        });

        if (response.error) { toast.error(response.error.message || "Generation failed"); break; }

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

  const handleSavePrompt = useCallback(async (text: string, folderId?: string | null) => {
    await addPrompt(text, [], folderId);
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
        globalPrompts={globalPrompts}
        projectPrompts={projectPrompts}
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
          <PromptLibrary prompts={prompts} folders={folders} onAdd={addPrompt} onDelete={deletePrompt} />
        )}
      </div>
      <ProgressModal isOpen={showProgress} onClose={() => setShowProgress(false)} current={progress.current} total={progress.total} />
    </div>
  );
};

export default Index;
