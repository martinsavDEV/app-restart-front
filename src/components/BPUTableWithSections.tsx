import { Button } from "@/components/ui/button";
import { EditableCell } from "@/components/EditableCell";
import { EditableCellText } from "@/components/EditableCellText";
import { BPULine } from "@/types/bpu";
import { Trash2 } from "lucide-react";

interface BPULineWithSection extends BPULine {
  section?: string;
}

interface BPUTableWithSectionsProps {
  lines: BPULineWithSection[];
  onLineUpdate: (id: string, updates: Partial<BPULine>) => void;
  onLineDelete: (id: string) => void;
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

export const BPUTableWithSections = ({ lines, onLineUpdate, onLineDelete }: BPUTableWithSectionsProps) => {
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

  const grandTotal = lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);

  return (
    <div className="overflow-x-auto">
      <div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground italic">
        <span>💡</span>
        <span>Double-cliquez sur une cellule pour modifier</span>
      </div>
      
      {Object.entries(sections).map(([sectionName, sectionLines]) => {
        const sectionTotal = calculateSectionTotal(sectionLines);
        
        return (
          <div key={sectionName} className="mb-6">
            {/* Section Header */}
            <div className="bg-muted/50 px-3 py-2 mb-2 rounded-md">
              <h3 className="text-sm font-semibold">{sectionName}</h3>
            </div>
            
            {/* Section Table */}
            <table className="w-full text-xs mb-2">
              <thead>
                <tr className="border-b">
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
                  return (
                    <tr key={line.id} className="border-b hover:bg-muted/30 group">
                      <td className="py-3 px-2">
                        <EditableCellText
                          value={line.designation}
                          onChange={(value) => onLineUpdate(line.id, { designation: value })}
                          maxLength={200}
                          placeholder="Désignation"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <EditableCell
                          value={line.quantity}
                          onChange={(value) => onLineUpdate(line.id, { quantity: value })}
                          align="right"
                          format={(v) => formatNumber(v)}
                          className="tabular-nums"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <EditableCellText
                          value={line.unit}
                          onChange={(value) => onLineUpdate(line.id, { unit: value })}
                          maxLength={20}
                          placeholder="Unité"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <EditableCell
                          value={line.unitPrice}
                          onChange={(value) => onLineUpdate(line.id, { unitPrice: value })}
                          align="right"
                          format={(v) => formatCurrency(v)}
                          className="tabular-nums"
                        />
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums font-semibold">
                        {formatCurrency(total)}
                      </td>
                      <td className="py-3 px-2">
                        <EditableCellText
                          value={line.priceSource || ""}
                          onChange={(value) => onLineUpdate(line.id, { priceSource: value })}
                          placeholder="Source prix"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => onLineDelete(line.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Section Subtotal */}
            <div className="flex justify-end px-2 py-2 bg-accent/10 rounded-md">
              <div className="text-sm font-semibold">
                Sous-total {sectionName}: <span className="tabular-nums">{formatCurrency(sectionTotal)}</span>
              </div>
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
