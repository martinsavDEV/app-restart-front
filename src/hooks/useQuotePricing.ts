import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuoteLine {
  id: string;
  lot_id: string;
  section_id?: string | null;
  designation: string;
  quantity: number;
  unit: string;
  unit_price: number;
  comment?: string;
  linked_variable?: string | null;
  order_index: number;
}

interface Lot {
  id: string;
  quote_version_id: string;
  code: string;
  label: string;
  description?: string;
  order_index: number;
  lines: QuoteLine[];
}

interface TemplateLine {
  designation: string;
  unit: string;
  unit_price: number;
  comment?: string;
  quantity?: number;
}

interface TemplateSection {
  title: string;
  is_multiple?: boolean;
  multiplier?: number;
  lines: TemplateLine[];
}

export const useQuotePricing = (quoteVersionId?: string | null) => {
  const queryClient = useQueryClient();

  // Update quote version total amount
  const updateQuoteVersionTotal = async () => {
    if (!quoteVersionId) return;

    // Fetch all lots for this quote version
    const { data: lotsData, error: lotsError } = await supabase
      .from("lots")
      .select("id")
      .eq("quote_version_id", quoteVersionId);

    if (lotsError || !lotsData) return;

    // Fetch all lines with their sections for these lots
    const lotIds = lotsData.map(lot => lot.id);
    const { data: linesData, error: linesError } = await supabase
      .from("quote_lines")
      .select("quantity, unit_price, section_id")
      .in("lot_id", lotIds);

    if (linesError || !linesData) return;

    // Fetch all sections with their multipliers
    const { data: sectionsData, error: sectionsError } = await supabase
      .from("quote_sections")
      .select("id, is_multiple, multiplier")
      .in("lot_id", lotIds);

    if (sectionsError) return;

    // Create a map of section_id -> multiplier
    const sectionMultipliers = new Map<string, number>();
    sectionsData?.forEach(section => {
      sectionMultipliers.set(section.id, section.is_multiple ? section.multiplier : 1);
    });

    // Calculate total with section multipliers
    const total = linesData.reduce((sum, line) => {
      const lineTotal = (line.quantity || 0) * (line.unit_price || 0);
      const multiplier = line.section_id ? (sectionMultipliers.get(line.section_id) || 1) : 1;
      return sum + (lineTotal * multiplier);
    }, 0);

    // Update quote version
    await supabase
      .from("quote_versions")
      .update({ total_amount: total })
      .eq("id", quoteVersionId);

    // Invalidate quote versions queries
    queryClient.invalidateQueries({ queryKey: ["quote-versions"] });
  };

  // Fetch lots and quote_lines for a quote version
  const { data: lots, isLoading } = useQuery({
    queryKey: ["quote-pricing", quoteVersionId],
    queryFn: async () => {
      if (!quoteVersionId) return [];

      const { data: lotsData, error: lotsError } = await supabase
        .from("lots")
        .select("*")
        .eq("quote_version_id", quoteVersionId)
        .order("order_index");

      if (lotsError) throw lotsError;

      const lotsWithLines = await Promise.all(
        lotsData.map(async (lot) => {
          const { data: linesData, error: linesError } = await supabase
            .from("quote_lines")
            .select("*")
            .eq("lot_id", lot.id)
            .order("order_index");

          if (linesError) throw linesError;

          return {
            ...lot,
            lines: linesData || [],
          };
        })
      );

      return lotsWithLines as Lot[];
    },
    enabled: !!quoteVersionId,
  });

  // Update a quote line
  const updateLineMutation = useMutation({
    mutationFn: async ({
      lineId,
      updates,
    }: {
      lineId: string;
      updates: Partial<QuoteLine>;
    }) => {
      const { error } = await supabase
        .from("quote_lines")
        .update(updates)
        .eq("id", lineId);

      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["quote-pricing", quoteVersionId] });
      await updateQuoteVersionTotal();
      toast.success("Ligne mise à jour");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });

  // Add a new quote line
  const addLineMutation = useMutation({
    mutationFn: async ({
      lotId,
      line,
    }: {
      lotId: string;
      line: Omit<QuoteLine, "id" | "lot_id">;
    }) => {
      const { error } = await supabase.from("quote_lines").insert({
        designation: line.designation,
        unit: line.unit,
        unit_price: line.unit_price,
        quantity: line.quantity,
        code: line.designation.substring(0, 20).toLowerCase().replace(/\s+/g, '_'),
        comment: line.comment || "",
        order_index: line.order_index,
        section_id: line.section_id || null,
        lot_id: lotId,
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["quote-pricing", quoteVersionId] });
      await updateQuoteVersionTotal();
      toast.success("Ligne ajoutée");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout");
      console.error(error);
    },
  });

  // Delete a quote line
  const deleteLineMutation = useMutation({
    mutationFn: async (lineId: string) => {
      const { error } = await supabase.from("quote_lines").delete().eq("id", lineId);

      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["quote-pricing", quoteVersionId] });
      await updateQuoteVersionTotal();
      toast.success("Ligne supprimée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });

  // Update lines order
  const updateLinesOrderMutation = useMutation({
    mutationFn: async (updates: { id: string; order_index: number }[]) => {
      // We need to update each line individually since upsert requires all fields
      const promises = updates.map(({ id, order_index }) =>
        supabase
          .from("quote_lines")
          .update({ order_index })
          .eq("id", id)
      );
      
      const results = await Promise.all(promises);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["quote-pricing", quoteVersionId] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour de l'ordre");
      console.error(error);
    },
  });

  // Update a line's section_id (for drag & drop between sections)
  const updateLineSectionMutation = useMutation({
    mutationFn: async ({
      lineId,
      newSectionId,
      newOrderIndex,
    }: {
      lineId: string;
      newSectionId: string | null;
      newOrderIndex: number;
    }) => {
      const { error } = await supabase
        .from("quote_lines")
        .update({ 
          section_id: newSectionId,
          order_index: newOrderIndex,
        })
        .eq("id", lineId);

      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["quote-pricing", quoteVersionId] });
      toast.success("Ligne déplacée");
    },
    onError: (error) => {
      toast.error("Erreur lors du déplacement");
      console.error(error);
    },
  });

  // Load template sections into a lot (creates sections and quote_lines)
  const loadTemplateMutation = useMutation({
    mutationFn: async ({
      lotId,
      templateSections,
    }: {
      lotId: string;
      templateSections: TemplateSection[];
    }) => {
      // Step 1: Create sections first and get their IDs
      const sectionIds = new Map<string, string>();
      
      for (let i = 0; i < templateSections.length; i++) {
        const section = templateSections[i];
        const { data: sectionData, error: sectionError } = await supabase
          .from("quote_sections")
          .insert({
            lot_id: lotId,
            name: section.title,
            is_multiple: section.is_multiple || false,
            multiplier: section.is_multiple ? (section.multiplier || 1) : 1,
            order_index: i,
          })
          .select()
          .single();

        if (sectionError) throw sectionError;
        sectionIds.set(section.title, sectionData.id);
      }

      // Step 2: Create lines with correct section_id
      let orderIndex = 0;
      const allLinesToInsert: any[] = [];

      templateSections.forEach((section) => {
        section.lines.forEach((line: any) => {
          allLinesToInsert.push({
            lot_id: lotId,
            section_id: sectionIds.get(section.title), // Assign section_id
            code: line.designation.substring(0, 20).toLowerCase().replace(/\s+/g, '_'),
            designation: line.designation,
            unit: line.unit || 'u',
            unit_price: line.unitPrice ?? line.unit_price ?? 0,
            comment: line.comment || "", // No more [Section Title] prefix
            quantity: line.quantity ?? 0,
            order_index: orderIndex++,
          });
        });
      });

      const { error } = await supabase.from("quote_lines").insert(allLinesToInsert);

      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["quote-pricing", quoteVersionId] });
      queryClient.invalidateQueries({ queryKey: ["quote-sections"] }); // Invalidate sections query
      await updateQuoteVersionTotal();
      toast.success("Template chargé avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors du chargement du template");
      console.error(error);
    },
  });

  return {
    lots: lots || [],
    isLoading,
    updateLine: updateLineMutation.mutate,
    addLine: addLineMutation.mutate,
    deleteLine: deleteLineMutation.mutate,
    loadTemplate: loadTemplateMutation.mutate,
    updateLinesOrder: updateLinesOrderMutation.mutate,
    updateLineSection: updateLineSectionMutation.mutate,
    isUpdating: updateLineMutation.isPending,
    isAdding: addLineMutation.isPending,
    isDeleting: deleteLineMutation.isPending,
    isLoadingTemplate: loadTemplateMutation.isPending,
  };
};
