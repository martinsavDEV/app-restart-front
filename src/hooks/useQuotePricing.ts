import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuoteLine {
  id: string;
  lot_id: string;
  designation: string;
  quantity: number;
  unit: string;
  unit_price: number;
  comment?: string;
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

    // Fetch all lines for these lots
    const lotIds = lotsData.map(lot => lot.id);
    const { data: linesData, error: linesError } = await supabase
      .from("quote_lines")
      .select("quantity, unit_price")
      .in("lot_id", lotIds);

    if (linesError || !linesData) return;

    // Calculate total
    const total = linesData.reduce(
      (sum, line) => sum + (line.quantity || 0) * (line.unit_price || 0),
      0
    );

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

  // Load template sections into a lot (creates sections as quote_lines with proper grouping)
  const loadTemplateMutation = useMutation({
    mutationFn: async ({
      lotId,
      templateSections,
    }: {
      lotId: string;
      templateSections: TemplateSection[];
    }) => {
      let orderIndex = 0;
      const allLinesToInsert: any[] = [];

      // Flatten all sections into lines with section info in comment
      templateSections.forEach((section) => {
        section.lines.forEach((line) => {
          allLinesToInsert.push({
            lot_id: lotId,
            code: line.designation.substring(0, 20).toLowerCase().replace(/\s+/g, '_'),
            designation: line.designation,
            unit: line.unit,
            unit_price: line.unit_price,
            comment: `[${section.title}] ${line.comment || ""}`.trim(),
            quantity: line.quantity || 0,
            order_index: orderIndex++,
          });
        });
      });

      const { error } = await supabase.from("quote_lines").insert(allLinesToInsert);

      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["quote-pricing", quoteVersionId] });
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
    isUpdating: updateLineMutation.isPending,
    isAdding: addLineMutation.isPending,
    isDeleting: deleteLineMutation.isPending,
    isLoadingTemplate: loadTemplateMutation.isPending,
  };
};
