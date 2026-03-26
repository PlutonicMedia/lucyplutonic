import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

type Folder = Tables<"folders">;

export function useFolders() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageCounts, setImageCounts] = useState<Record<string, number>>({});

  const fetchFolders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("folders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setFolders(data || []);
    setLoading(false);
  }, [user]);

  const fetchCounts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("generated_images")
      .select("folder_id")
      .eq("user_id", user.id)
      .not("folder_id", "is", null);
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((img) => {
        if (img.folder_id) counts[img.folder_id] = (counts[img.folder_id] || 0) + 1;
      });
      setImageCounts(counts);
    }
  }, [user]);

  useEffect(() => {
    fetchFolders();
    fetchCounts();
  }, [fetchFolders, fetchCounts]);

  const addFolder = async (name: string) => {
    if (!user) return;
    const { data } = await supabase
      .from("folders")
      .insert({ user_id: user.id, name })
      .select()
      .single();
    if (data) setFolders((prev) => [data, ...prev]);
  };

  const deleteFolder = async (id: string) => {
    await supabase.from("folders").delete().eq("id", id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
  };

  return { folders, loading, imageCounts, addFolder, deleteFolder, refetchCounts: fetchCounts };
}
