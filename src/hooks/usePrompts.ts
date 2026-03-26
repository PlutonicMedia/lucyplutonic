import { useState, useEffect, useCallback } from "react";
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

  const addPrompt = async (text: string, tags: string[] = []) => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_prompts")
      .insert({ user_id: user.id, text, tags })
      .select()
      .single();
    if (data) setPrompts((prev) => [data, ...prev]);
  };

  const deletePrompt = async (id: string) => {
    await supabase.from("saved_prompts").delete().eq("id", id);
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  };

  return { prompts, loading, addPrompt, deletePrompt };
}
