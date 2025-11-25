import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface QuoteSection {
  id: string;
  lot_id: string;
  name: string;
  is_multiple: boolean;
  multiplier: number;
  order_index: number;
}

export const useQuoteSections = (lotId?: string | null) => {
  const queryClient = useQueryClient();

  const { data: sections, isLoading } = useQuery({
    queryKey: ["quote-sections", lotId],
    queryFn: async () => {
      if (!lotId) return [];
      const { data, error } = await supabase
        .from("quote_sections")
        .select("*")
        .eq("lot_id", lotId)
        .order("order_index");
      if (error) throw error;
      return data as QuoteSection[];
    },
    enabled: !!lotId,
  });

  const createSectionMutation = useMutation({
    mutationFn: async ({
      lotId,
      name,
      isMultiple,
      multiplier,
    }: {
      lotId: string;
      name: string;
      isMultiple: boolean;
      multiplier: number;
    }) => {
      const { data: existingSections } = await supabase
        .from("quote_sections")
        .select("order_index")
        .eq("lot_id", lotId)
        .order("order_index", { ascending: false })
        .limit(1);

      const nextOrderIndex = existingSections && existingSections.length > 0 
        ? existingSections[0].order_index + 1 
        : 0;

      const { data: sectionData, error: sectionError } = await supabase
        .from("quote_sections")
        .insert({
          lot_id: lotId,
          name,
          is_multiple: isMultiple,
          multiplier: isMultiple ? multiplier : 1,
          order_index: nextOrderIndex,
        })
        .select()
        .single();

      if (sectionError) throw sectionError;

      // Get the lot code
      const { data: lotData, error: lotError } = await supabase
        .from("lots")
        .select("code")
        .eq("id", lotId)
        .single();

      if (lotError) throw lotError;

      // Create an empty line for the new section
      const { error: lineError } = await supabase
        .from("quote_lines")
        .insert({
          lot_id: lotId,
          section_id: sectionData.id,
          code: lotData.code,
          designation: "",
          quantity: 0,
          unit: "u",
          unit_price: 0,
          order_index: 0
        });

      if (lineError) throw lineError;

      return sectionData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-sections"] });
      queryClient.invalidateQueries({ queryKey: ["quote-lines"] });
      toast.success("Section créée");
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({
      sectionId,
      updates,
    }: {
      sectionId: string;
      updates: Partial<QuoteSection>;
    }) => {
      const { error } = await supabase
        .from("quote_sections")
        .update(updates)
        .eq("id", sectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-sections"] });
      toast.success("Section mise à jour");
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      // First, set section_id to null for all lines in this section
      await supabase
        .from("quote_lines")
        .update({ section_id: null })
        .eq("section_id", sectionId);

      const { error } = await supabase
        .from("quote_sections")
        .delete()
        .eq("id", sectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-sections"] });
      queryClient.invalidateQueries({ queryKey: ["quote-pricing"] });
      toast.success("Section supprimée");
    },
  });

  return {
    sections: sections || [],
    isLoading,
    createSection: createSectionMutation.mutate,
    updateSection: updateSectionMutation.mutate,
    deleteSection: deleteSectionMutation.mutate,
    isCreating: createSectionMutation.isPending,
    isUpdating: updateSectionMutation.isPending,
    isDeleting: deleteSectionMutation.isPending,
  };
};
