import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export type SavedPrompt = Tables<"saved_prompts">;

export function usePrompts() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrompts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_prompts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setPrompts(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const globalPrompts = useMemo(
    () => prompts.filter((p) => !p.folder_id),
    [prompts]
  );

  const getProjectPrompts = useCallback(
    (folderId: string | null) =>
      folderId ? prompts.filter((p) => p.folder_id === folderId) : [],
    [prompts]
  );

  const addPrompt = async (text: string, tags: string[] = [], folderId?: string | null) => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_prompts")
      .insert({ user_id: user.id, text, tags, folder_id: folderId || null })
      .select()
      .single();
    if (data) setPrompts((prev) => [data, ...prev]);
  };

  const deletePrompt = async (id: string) => {
    await supabase.from("saved_prompts").delete().eq("id", id);
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  };

  return { prompts, globalPrompts, getProjectPrompts, loading, addPrompt, deletePrompt };
}
