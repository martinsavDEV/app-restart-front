import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpdateQuoteVersionParams {
  versionId: string;
  versionLabel?: string;
  comment?: string;
}

interface UpdateQuoteSettingsParams {
  versionId: string;
  nWtg?: number;
}

export function useQuoteVersionUpdate() {
  const queryClient = useQueryClient();

  const updateVersion = useMutation({
    mutationFn: async ({ versionId, versionLabel, comment }: UpdateQuoteVersionParams) => {
      const updates: Record<string, string> = {};
      if (versionLabel !== undefined) updates.version_label = versionLabel;
      if (comment !== undefined) updates.comment = comment;
      
      const { data, error } = await supabase
        .from("quote_versions")
        .update(updates)
        .eq("id", versionId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["quote_versions"] });
      toast.success("Chiffrage mis à jour");
    },
    onError: (error) => {
      console.error("Error updating quote version:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const updateSettings = useMutation({
    mutationFn: async ({ versionId, nWtg }: UpdateQuoteSettingsParams) => {
      const { data, error } = await supabase
        .from("quote_settings")
        .update({ n_wtg: nWtg })
        .eq("quote_version_id", versionId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["quote_settings"] });
      toast.success("Paramètres mis à jour");
    },
    onError: (error) => {
      console.error("Error updating quote settings:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  return {
    updateVersion,
    updateSettings,
  };
}
