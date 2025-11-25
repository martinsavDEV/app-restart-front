import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BPULine } from "@/types/bpu";
import { Trash2, Clipboard, Plus, Link2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLineSelection } from "@/hooks/useLineSelection";
import { toast } from "sonner";
import { useCalculatorVariables } from "@/hooks/useCalculatorVariables";
import { CalculatorData } from "@/types/bpu";
import { QuoteSection } from "@/hooks/useQuoteSections";
import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DraggableLine } from "./DraggableLine";

interface BPULineWithSection extends BPULine {
  section?: string;
  section_id?: string | null;
  lot_id?: string;
}

interface BPUTableWithSectionsProps {
  lines: BPULineWithSection[];
  sections: QuoteSection[];
  onLineUpdate: (id: string, updates: Partial<BPULine>) => void;
  onLineDelete: (id: string) => void;
  onLineAdd?: (line: Omit<BPULineWithSection, "id">, sectionId: string | null, afterLineId?: string) => void;
  onBulkDelete?: (lineIds: string[]) => void;
  onSectionUpdate?: (sectionId: string, multiplier: number) => void;
  onSectionDelete?: (sectionId: string) => void;
  onLinesReorder?: (updates: { id: string; order_index: number }[]) => void;
  onLineSectionChange?: (lineId: string, newSectionId: string | null, newOrderIndex: number) => void;
  lotCode?: string;
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
};

export const BPUTableWithSections = ({ 
  lines, 
  sections,
  onLineUpdate, 
  onLineDelete, 
  onLineAdd,
  onBulkDelete,
  onSectionUpdate,
  onSectionDelete,
  onLinesReorder,
  onLineSectionChange,
  lotCode,
}: BPUTableWithSectionsProps) => {
  const {
    selectedLines,
    toggleLineSelection,
    selectAll,
    clearSelection,
    isSelected,
    selectedCount,
    copiedLine,
    copyLine,
    focusedLineId,
    setFocusedLine,
  } = useLineSelection();

  // Fetch quote settings to get linked values
  const { data: quoteSettings } = useQuery({
    queryKey: ["quote-settings-for-sections", lines[0]?.lot_id],
    queryFn: async () => {
      if (!lines[0]?.lot_id) return null;
      
      // Get the quote_version_id from the lot
      const { data: lotData, error: lotError } = await supabase
        .from("lots")
        .select("quote_version_id")
        .eq("id", lines[0].lot_id)
        .single();
      
      if (lotError || !lotData) return null;

      const { data, error } = await supabase
        .from("quote_settings")
        .select("*")
        .eq("quote_version_id", lotData.quote_version_id)
        .maybeSingle();
      
      if (error) return null;
      return data;
    },
    enabled: lines.length > 0,
  });

  // Load calculator variables
  const calculatorData = quoteSettings?.calculator_data as unknown as CalculatorData | null;
  const { variables, getVariableValue } = useCalculatorVariables(calculatorData);

  // Resolve quantity (number or variable)
  const resolveQuantity = (quantity: number | string): number => {
    if (typeof quantity === "string" && quantity.startsWith("$")) {
      return getVariableValue(quantity) ?? 0;
    }
    return typeof quantity === "number" ? quantity : parseFloat(quantity) || 0;
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group lines by section_id
  const linesBySection = lines.reduce((acc, line) => {
    const sectionId = line.section_id || "no-section";
    if (!acc[sectionId]) {
      acc[sectionId] = [];
    }
    acc[sectionId].push(line);
    return acc;
  }, {} as Record<string, BPULineWithSection[]>);


  const calculateSectionTotal = (sectionLines: BPULineWithSection[]) => {
    return sectionLines.reduce((sum, line) => {
      const qty = resolveQuantity(line.quantity);
      return sum + (qty * line.unitPrice);
    }, 0);
  };

  const grandTotal = sections.reduce((sum, section) => {
    const sectionLines = linesBySection[section.id] || [];
    const sectionTotal = calculateSectionTotal(sectionLines);
    const multiplier = section.is_multiple ? section.multiplier : 1;
    return sum + (sectionTotal * multiplier);
  }, 0) + calculateSectionTotal(linesBySection["no-section"] || []);

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedCount > 0) {
      onBulkDelete(Array.from(selectedLines));
      clearSelection();
    }
  };

  const handleSelectAll = () => {
    if (selectedCount === lines.length) {
      clearSelection();
    } else {
      selectAll(lines.map(line => line.id));
    }
  };

  const handleCopyLine = (line: BPULineWithSection) => {
    copyLine(line);
    toast.success("Ligne copiée");
  };

  const handlePasteLine = (sectionId: string | null) => {
    if (copiedLine && onLineAdd) {
      onLineAdd(copiedLine, sectionId, focusedLineId || undefined);
      toast.success("Ligne collée");
    }
  };

  const handleAddLine = (sectionId: string | null) => {
    if (onLineAdd) {
      const emptyLine = {
        designation: "",
        quantity: 0,
        unit: "u",
        unitPrice: 0,
        section_id: sectionId,
      };
      onLineAdd(emptyLine, sectionId, focusedLineId || undefined);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const draggedLine = lines.find(line => line.id === active.id);
    const targetLine = lines.find(line => line.id === over.id);
    
    if (!draggedLine || !targetLine) return;

    const draggedSectionId = draggedLine.section_id || "no-section";
    const targetSectionId = targetLine.section_id || "no-section";

    // Case 1: Moving within the same section - reorder only
    if (draggedSectionId === targetSectionId) {
      const sectionLines = draggedSectionId === "no-section" 
        ? (linesBySection["no-section"] || [])
        : (linesBySection[draggedSectionId] || []);
      
      const oldIndex = sectionLines.findIndex((line) => line.id === active.id);
      const newIndex = sectionLines.findIndex((line) => line.id === over.id);

      const reorderedLines = arrayMove(sectionLines, oldIndex, newIndex);
      
      const updates = reorderedLines.map((line, index) => ({
        id: line.id,
        order_index: index,
      }));

      if (onLinesReorder) {
        onLinesReorder(updates);
      }
    } 
    // Case 2: Moving between sections - change section_id
    else {
      if (onLineSectionChange) {
        const newSectionId = targetSectionId === "no-section" ? null : targetSectionId;
        const targetSectionLines = targetSectionId === "no-section"
          ? (linesBySection["no-section"] || [])
          : (linesBySection[targetSectionId] || []);
        
        // Insert at the position of the target line
        const targetIndex = targetSectionLines.findIndex((line) => line.id === over.id);
        const newOrderIndex = targetIndex >= 0 ? targetIndex : targetSectionLines.length;
        
        onLineSectionChange(active.id as string, newSectionId, newOrderIndex);
      }
    }
  };

  const renderSectionTable = (
    sectionId: string | null,
    sectionLines: BPULineWithSection[],
    sectionName?: string
  ) => {
    return (
      <>
        <SortableContext
          items={sectionLines.map((line) => line.id)}
          strategy={verticalListSortingStrategy}
        >
          <table className="w-full text-xs mb-2">
            <thead>
              <tr className="border-b">
                <th className="text-center py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase w-20">
                  <Checkbox
                    checked={sectionLines.every(line => isSelected(line.id))}
                    onCheckedChange={() => {
                      const allSelected = sectionLines.every(line => isSelected(line.id));
                      sectionLines.forEach(line => {
                        if (allSelected) {
                          if (isSelected(line.id)) toggleLineSelection(line.id);
                        } else {
                          if (!isSelected(line.id)) toggleLineSelection(line.id);
                        }
                      });
                    }}
                  />
                </th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                  Désignation
                </th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                  Qté
                </th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                  Unité
                </th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                  PU
                </th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                  Total
                </th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                  Source prix
                </th>
                <th className="text-center py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sectionLines.map((line) => (
                <DraggableLine
                  key={line.id}
                  line={line}
                  selected={isSelected(line.id)}
                  focused={focusedLineId === line.id}
                  onToggleSelection={toggleLineSelection}
                  onLineUpdate={onLineUpdate}
                  onLineDelete={onLineDelete}
                  onCopyLine={handleCopyLine}
                  onFocus={setFocusedLine}
                  lotCode={lotCode}
                  formatNumber={formatNumber}
                  formatCurrency={formatCurrency}
                  variables={variables}
                  resolveQuantity={resolveQuantity}
                />
              ))}
            </tbody>
          </table>
        </SortableContext>
        <div className="flex justify-end mt-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px]"
            onClick={() => handleAddLine(sectionId)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Ajouter ligne
          </Button>
        </div>
      </>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground italic">
            <span>💡</span>
            <span>Glissez-déposez les lignes pour les réorganiser (même entre sections) • Double-cliquez pour modifier</span>
          </div>
          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <>
                <span className="text-xs text-muted-foreground">
                  {selectedCount} ligne{selectedCount > 1 ? "s" : ""} sélectionnée{selectedCount > 1 ? "s" : ""}
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Supprimer
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={handleSelectAll}
            >
              {selectedCount === lines.length ? "Tout désélectionner" : "Tout sélectionner"}
            </Button>
          </div>
        </div>
        
        {/* Render sections */}
        {sections.map((section) => {
        const sectionLines = linesBySection[section.id] || [];
        const sectionTotal = calculateSectionTotal(sectionLines);
        
        return (
          <div key={section.id} className="mb-6">
            {/* Section Header */}
            <div className="bg-emerald-500/20 px-3 py-2 mb-2 rounded-md flex items-center justify-between border border-emerald-500/30">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{section.name}</h3>
                {section.is_multiple && onSectionUpdate && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Nombre:</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        value={section.linked_field && quoteSettings ? (quoteSettings as any)[section.linked_field] || section.multiplier : section.multiplier}
                        onChange={(e) => onSectionUpdate(section.id, Math.max(1, parseInt(e.target.value) || 1))}
                        disabled={!!section.linked_field}
                        className={`w-16 h-7 px-2 text-xs border rounded-md ${
                          section.linked_field 
                            ? 'bg-muted text-orange-500 font-medium cursor-not-allowed' 
                            : 'bg-background'
                        }`}
                      />
                      {section.linked_field && (
                        <Link2 className="h-3 w-3 text-orange-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {copiedLine && onLineAdd && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px]"
                    onClick={() => handlePasteLine(section.id)}
                  >
                    <Clipboard className="h-3 w-3 mr-1" />
                    Coller ligne
                  </Button>
                )}
                {onSectionDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Supprimer la section "${section.name}" ? Les lignes de cette section ne seront pas supprimées.`)) {
                        onSectionDelete(section.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Section Table */}
            {renderSectionTable(section.id, sectionLines, section.name)}
            
            {/* Section Subtotal */}
            <div className="px-2 py-2 bg-accent/10 rounded-md space-y-1">
              <div className="flex justify-end">
                <div className="text-sm font-semibold">
                  Sous-total {section.is_multiple ? "unitaire" : ""} {section.name}: <span className="tabular-nums">{formatCurrency(sectionTotal)}</span>
                </div>
              </div>
              {section.is_multiple && section.multiplier > 1 && (
                <div className="flex justify-end text-sm">
                  <span className="text-muted-foreground mr-2">× {section.multiplier} =</span>
                  <span className="font-bold tabular-nums">{formatCurrency(sectionTotal * section.multiplier)}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Render lines without section */}
      {linesBySection["no-section"] && linesBySection["no-section"].length > 0 && (
        <div className="mb-6">
          {/* No Section Header */}
          <div className="bg-muted/20 px-3 py-2 mb-2 rounded-md flex items-center justify-between border border-muted/30">
            <h3 className="text-sm font-semibold text-muted-foreground">Sans section</h3>
            {copiedLine && onLineAdd && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px]"
                onClick={() => handlePasteLine(null)}
              >
                <Clipboard className="h-3 w-3 mr-1" />
                Coller ligne
              </Button>
            )}
          </div>
          
          {/* Section Table */}
          {renderSectionTable(null, linesBySection["no-section"])}
        </div>
      )}

        {/* Grand Total */}
        <div className="flex justify-end py-3 px-2 bg-primary/5 rounded-md border-t-2 border-primary">
          <div className="text-base font-bold">
            Total général: <span className="tabular-nums">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>
    </DndContext>
  );
};
