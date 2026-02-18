import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { computeCalculatorVariables } from "@/hooks/useCalculatorVariables";
import { evaluateFormulaWithVariables } from "@/lib/formulaUtils";
import { CalculatorData } from "@/types/bpu";

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
    n_foundations: number;
    calculator_data: any;
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
    header_comment: string | null;
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

      // Fetch project, quote version, quote settings, and reference documents in parallel
      const [
        { data: project },
        { data: quoteVersion },
        { data: quoteSettings },
        { data: referenceDocuments },
        { data: lotsRaw },
      ] = await Promise.all([
        supabase
          .from("projects")
          .select("name, department, n_wtg")
          .eq("id", projectId)
          .single(),
        supabase
          .from("quote_versions")
          .select("version_label, date_creation, last_update, comment")
          .eq("id", versionId)
          .single(),
        supabase
          .from("quote_settings")
          .select("n_wtg, turbine_model, turbine_power, hub_height, n_foundations, calculator_data")
          .eq("quote_version_id", versionId)
          .single(),
        supabase
          .from("reference_documents")
          .select("id, label, reference, comment")
          .eq("version_id", versionId),
        // Requête A : lots + sections (sans les lignes)
        supabase
          .from("lots")
          .select(
            `id, label, code, order_index, header_comment,
             quote_sections (id, name, multiplier, is_multiple, order_index)`
          )
          .eq("quote_version_id", versionId)
          .eq("is_enabled", true)
          .order("order_index"),
      ]);

      const lots = lotsRaw || [];
      const lotIds = lots.map((l: any) => l.id);

      // Requête B : toutes les lignes du devis (y compris section_id = NULL)
      let allLines: any[] = [];
      if (lotIds.length > 0) {
        const { data: linesData } = await supabase
          .from("quote_lines")
          .select(
            "id, lot_id, section_id, designation, quantity, unit, unit_price, total_price, comment, order_index, linked_variable, quantity_formula"
          )
          .in("lot_id", lotIds)
          .order("order_index");
        allLines = linesData || [];
      }

      // Compute calculator variables for resolving linked_variable / quantity_formula
      const calcVars = computeCalculatorVariables(
        (quoteSettings?.calculator_data as unknown as CalculatorData) ?? null
      );

      // Helper: resolve quantity for a line
      const resolveQuantity = (line: any): number => {
        if (line.linked_variable) {
          const variable = calcVars.find((v) => v.name === line.linked_variable);
          if (variable != null) return variable.value;
        }
        if (line.quantity_formula && /\$/.test(line.quantity_formula)) {
          const evaluated = evaluateFormulaWithVariables(line.quantity_formula, calcVars);
          if (evaluated != null) return evaluated;
        }
        return line.quantity ?? 0;
      };

      // Helper: transform a raw line into the output shape
      const transformLine = (line: any) => {
        const resolvedQty = resolveQuantity(line);
        const totalPrice = resolvedQty * line.unit_price;
        return {
          id: line.id,
          designation: line.designation,
          quantity: resolvedQty,
          unit: line.unit,
          unit_price: line.unit_price,
          total_price: totalPrice,
          comment: line.comment,
        };
      };

      // Assemble: group lines by lot then by section
      const linesByLot = new Map<string, any[]>();
      for (const line of allLines) {
        if (!linesByLot.has(line.lot_id)) linesByLot.set(line.lot_id, []);
        linesByLot.get(line.lot_id)!.push(line);
      }

      const transformedLots = lots.map((lot: any) => {
        const lotLines = linesByLot.get(lot.id) || [];
        const sections = (lot.quote_sections || [])
          .slice()
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((section: any) => {
            const sectionLines = lotLines
              .filter((l: any) => l.section_id === section.id)
              .sort((a: any, b: any) => a.order_index - b.order_index)
              .map(transformLine);

            const rawSubtotal = sectionLines.reduce((sum, l) => sum + l.total_price, 0);
            const subtotal = section.is_multiple ? rawSubtotal * section.multiplier : rawSubtotal;

            return {
              id: section.id,
              name: section.name,
              multiplier: section.multiplier,
              is_multiple: section.is_multiple,
              subtotal,
              lines: sectionLines,
            };
          });

        // Lignes orphelines (section_id = NULL) → section virtuelle
        const orphanLines = lotLines
          .filter((l: any) => l.section_id === null || l.section_id === undefined)
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map(transformLine);

        if (orphanLines.length > 0) {
          const orphanSubtotal = orphanLines.reduce((sum, l) => sum + l.total_price, 0);
          sections.push({
            id: `__orphan__${lot.id}`,
            name: "(Sans section)",
            multiplier: 1,
            is_multiple: false,
            subtotal: orphanSubtotal,
            lines: orphanLines,
          });
        }

        const total = sections.reduce((sum, s) => sum + s.subtotal, 0);

        return {
          id: lot.id,
          label: lot.label,
          code: lot.code,
          total,
          header_comment: lot.header_comment || null,
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
