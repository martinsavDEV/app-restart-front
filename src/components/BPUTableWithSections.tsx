import { Button } from "@/components/ui/button";
import { EditableCell } from "@/components/EditableCell";
import { EditableCellText } from "@/components/EditableCellText";
import { PriceItemAutocomplete } from "@/components/PriceItemAutocomplete";
import { PriceSourceIndicator } from "@/components/PriceSourceIndicator";
import { Checkbox } from "@/components/ui/checkbox";
import { BPULine } from "@/types/bpu";
import { Trash2, Copy, Clipboard } from "lucide-react";
import { useLineSelection } from "@/hooks/useLineSelection";
import { toast } from "sonner";

interface BPULineWithSection extends BPULine {
  section?: string;
}

interface BPUTableWithSectionsProps {
  lines: BPULineWithSection[];
  onLineUpdate: (id: string, updates: Partial<BPULine>) => void;
  onLineDelete: (id: string) => void;
  onLineAdd?: (line: Omit<BPULineWithSection, "id">, sectionName: string) => void;
  onBulkDelete?: (lineIds: string[]) => void;
  lotCode?: string;
  nFoundations?: number;
  onNFoundationsChange?: (n: number) => void;
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
  onLineUpdate, 
  onLineDelete, 
  onLineAdd,
  onBulkDelete,
  lotCode,
  nFoundations = 1,
  onNFoundationsChange
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
  } = useLineSelection();
  // Group lines by section
  const sections = lines.reduce((acc, line) => {
    const sectionName = line.section || "Sans section";
    if (!acc[sectionName]) {
      acc[sectionName] = [];
    }
    acc[sectionName].push(line);
    return acc;
  }, {} as Record<string, BPULineWithSection[]>);

  const calculateSectionTotal = (sectionLines: BPULineWithSection[]) => {
    return sectionLines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
  };

  const grandTotal = Object.entries(sections).reduce((sum, [sectionName, sectionLines]) => {
    const sectionTotal = calculateSectionTotal(sectionLines);
    const isFoundationSection = sectionName.toLowerCase().includes("fondation");
    
    if (isFoundationSection && nFoundations > 1) {
      return sum + (sectionTotal * nFoundations);
    }
    return sum + sectionTotal;
  }, 0);

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

  const handlePasteLine = (sectionName: string) => {
    if (copiedLine && onLineAdd) {
      onLineAdd(copiedLine, sectionName);
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground italic">
          <span>💡</span>
          <span>Double-cliquez sur une cellule pour modifier</span>
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
      
      {Object.entries(sections).map(([sectionName, sectionLines]) => {
        const sectionTotal = calculateSectionTotal(sectionLines);
        const isFoundationSection = sectionName.toLowerCase().includes("fondation");
        
        return (
          <div key={sectionName} className="mb-6">
            {/* Section Header */}
            <div className="bg-emerald-500/20 px-3 py-2 mb-2 rounded-md flex items-center justify-between border border-emerald-500/30">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{sectionName}</h3>
                {isFoundationSection && onNFoundationsChange && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Nombre:</label>
                    <input
                      type="number"
                      min="1"
                      value={nFoundations}
                      onChange={(e) => onNFoundationsChange(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 h-7 px-2 text-xs border rounded-md bg-background"
                    />
                  </div>
                )}
              </div>
              {copiedLine && onLineAdd && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px]"
                  onClick={() => handlePasteLine(sectionName)}
                >
                  <Clipboard className="h-3 w-3 mr-1" />
                  Coller ligne
                </Button>
              )}
            </div>
            
            {/* Section Table */}
            <table className="w-full text-xs mb-2">
              <thead>
                <tr className="border-b">
                  <th className="text-center py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase w-10">
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
                {sectionLines.map((line) => {
                  const total = line.quantity * line.unitPrice;
                  const selected = isSelected(line.id);
                  return (
                     <tr 
                      key={line.id} 
                      className={`border-b hover:bg-muted/30 group ${selected ? "bg-accent/20" : ""}`}
                    >
                      <td className="py-1 px-2 text-center">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => toggleLineSelection(line.id)}
                        />
                      </td>
                      <td className="py-1 px-2">
                        <PriceItemAutocomplete
                          value={line.designation}
                          lotCode={lotCode}
                          onSelect={(item) => {
                            onLineUpdate(line.id, {
                              designation: item.designation,
                              unit: item.unit,
                              unitPrice: item.unitPrice,
                              priceSource: item.priceSource,
                            });
                          }}
                          onChange={(value) => onLineUpdate(line.id, { designation: value })}
                          placeholder="Désignation"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <EditableCell
                          value={line.quantity}
                          onChange={(value) => onLineUpdate(line.id, { quantity: value })}
                          align="right"
                          format={(v) => formatNumber(v)}
                          className="tabular-nums"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <EditableCellText
                          value={line.unit}
                          onChange={(value) => onLineUpdate(line.id, { unit: value })}
                          maxLength={20}
                          placeholder="Unité"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <EditableCell
                          value={line.unitPrice}
                          onChange={(value) => onLineUpdate(line.id, { unitPrice: value })}
                          align="right"
                          format={(v) => formatCurrency(v)}
                          className="tabular-nums"
                        />
                      </td>
                      <td className="py-1 px-2 text-right tabular-nums font-semibold">
                        {formatCurrency(total)}
                      </td>
                      <td className="py-1 px-2">
                        <PriceSourceIndicator
                          designation={line.designation}
                          currentUnitPrice={line.unitPrice}
                          priceSource={line.priceSource || ""}
                          lotCode={lotCode}
                          onUpdate={(newPrice, newSource) => {
                            onLineUpdate(line.id, { 
                              unitPrice: newPrice, 
                              priceSource: newSource 
                            });
                          }}
                          onChange={(value) => onLineUpdate(line.id, { priceSource: value })}
                        />
                      </td>
                      <td className="py-1 px-2 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleCopyLine(line)}
                            title="Copier la ligne"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => onLineDelete(line.id)}
                            title="Supprimer la ligne"
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Section Subtotal */}
            <div className="px-2 py-2 bg-accent/10 rounded-md space-y-1">
              <div className="flex justify-end">
                <div className="text-sm font-semibold">
                  Sous-total {isFoundationSection ? "unitaire" : ""} {sectionName}: <span className="tabular-nums">{formatCurrency(sectionTotal)}</span>
                </div>
              </div>
              {isFoundationSection && nFoundations > 1 && (
                <div className="flex justify-end text-sm">
                  <span className="text-muted-foreground mr-2">× {nFoundations} fondations =</span>
                  <span className="font-bold tabular-nums">{formatCurrency(sectionTotal * nFoundations)}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Grand Total */}
      {Object.keys(sections).length > 1 && (
        <div className="flex justify-end px-2 py-3 mt-4 bg-accent/20 rounded-md border border-accent/30">
          <div className="text-base font-bold">
            Total: <span className="tabular-nums">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      )}
      
      {lines.length === 0 && (
        <div className="text-center py-8 text-xs text-muted-foreground">
          Aucune ligne. Cliquez sur "+ Ajouter une ligne" pour commencer.
        </div>
      )}
    </div>
  );
};
