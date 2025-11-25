import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SummaryData {
  project: {
    name: string;
    department: string | null;
    n_wtg: number | null;
  } | null;
  quoteVersion: {
    version_label: string;
    date_creation: string | null;
    last_update: string | null;
    comment: string | null;
  } | null;
  quoteSettings: {
    n_wtg: number;
    turbine_model: string | null;
    turbine_power: number | null;
    hub_height: number | null;
  } | null;
  referenceDocuments: Array<{
    id: string;
    label: string;
    reference: string | null;
    comment: string | null;
  }>;
  lots: Array<{
    id: string;
    label: string;
    code: string;
    total: number;
    sections: Array<{
      id: string;
      name: string;
      multiplier: number;
      is_multiple: boolean;
      subtotal: number;
      lines: Array<{
        id: string;
        designation: string;
        quantity: number;
        unit: string;
        unit_price: number;
        total_price: number;
        comment: string | null;
      }>;
    }>;
  }>;
  totalCapex: number;
}

export const useSummaryData = (
  projectId: string | null,
  versionId: string | null
) => {
  return useQuery({
    queryKey: ["summary-data", projectId, versionId],
    queryFn: async (): Promise<SummaryData> => {
      if (!projectId || !versionId) {
        throw new Error("Project ID and Version ID are required");
      }

      // Fetch project
      const { data: project } = await supabase
        .from("projects")
        .select("name, department, n_wtg")
        .eq("id", projectId)
        .single();

      // Fetch quote version
      const { data: quoteVersion } = await supabase
        .from("quote_versions")
        .select("version_label, date_creation, last_update, comment")
        .eq("id", versionId)
        .single();

      // Fetch quote settings
      const { data: quoteSettings } = await supabase
        .from("quote_settings")
        .select("n_wtg, turbine_model, turbine_power, hub_height")
        .eq("quote_version_id", versionId)
        .single();

      // Fetch reference documents
      const { data: referenceDocuments } = await supabase
        .from("reference_documents")
        .select("id, label, reference, comment")
        .eq("version_id", versionId);

      // Fetch lots with sections and lines
      const { data: lots } = await supabase
        .from("lots")
        .select(
          `
          id,
          label,
          code,
          order_index,
          quote_sections (
            id,
            name,
            multiplier,
            is_multiple,
            order_index,
            quote_lines (
              id,
              designation,
              quantity,
              unit,
              unit_price,
              total_price,
              comment,
              order_index
            )
          )
        `
        )
        .eq("quote_version_id", versionId)
        .eq("is_enabled", true)
        .order("order_index");

      // Transform and calculate totals
      const transformedLots = (lots || []).map((lot: any) => {
        const sections = (lot.quote_sections || []).map((section: any) => {
          const lines = (section.quote_lines || [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((line: any) => ({
              id: line.id,
              designation: line.designation,
              quantity: line.quantity,
              unit: line.unit,
              unit_price: line.unit_price,
              total_price: line.total_price || line.quantity * line.unit_price,
              comment: line.comment,
            }));

          const subtotal = lines.reduce(
            (sum, line) => sum + line.total_price,
            0
          );

          return {
            id: section.id,
            name: section.name,
            multiplier: section.multiplier,
            is_multiple: section.is_multiple,
            subtotal: section.is_multiple ? subtotal * section.multiplier : subtotal,
            lines,
          };
        }).sort((a: any, b: any) => a.order_index - b.order_index);

        const total = sections.reduce((sum, section) => sum + section.subtotal, 0);

        return {
          id: lot.id,
          label: lot.label,
          code: lot.code,
          total,
          sections,
        };
      });

      const totalCapex = transformedLots.reduce((sum, lot) => sum + lot.total, 0);

      return {
        project: project || null,
        quoteVersion: quoteVersion || null,
        quoteSettings: quoteSettings || null,
        referenceDocuments: referenceDocuments || [],
        lots: transformedLots,
        totalCapex,
      };
    },
    enabled: !!projectId && !!versionId,
  });
};
