import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export type GeneratedImage = Tables<"generated_images">;

export function useImages(folderId?: string | null) {
  const { user } = useAuth();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchImages = useCallback(async () => {
    if (!user) return;
    let query = supabase
      .from("generated_images")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (folderId) {
      query = query.eq("folder_id", folderId);
    }

    const { data } = await query;
    setImages(data || []);
    setLoading(false);
  }, [user, folderId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const deleteImages = async (ids: string[]) => {
    // Also delete from storage
    const toDelete = images.filter((img) => ids.includes(img.id));
    const storagePaths = toDelete.map((img) => img.storage_path).filter(Boolean) as string[];
    if (storagePaths.length) {
      await supabase.storage.from("generated-images").remove(storagePaths);
    }
    await supabase.from("generated_images").delete().in("id", ids);
    setImages((prev) => prev.filter((img) => !ids.includes(img.id)));
  };

  const addImage = (image: GeneratedImage) => {
    setImages((prev) => [image, ...prev]);
  };

  return { images, loading, fetchImages, deleteImages, addImage };
}
