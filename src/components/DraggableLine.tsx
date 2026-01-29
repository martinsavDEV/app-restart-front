import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditableCell } from "@/components/EditableCell";
import { EditableCellText } from "@/components/EditableCellText";
import { PriceItemAutocomplete } from "@/components/PriceItemAutocomplete";
import { PriceSourceIndicator } from "@/components/PriceSourceIndicator";
import { QuantityFormulaInput } from "@/components/QuantityFormulaInput";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { BPULine, CalculatorVariable } from "@/types/bpu";
import { Copy, Trash2, GripVertical } from "lucide-react";
import { useState, useEffect } from "react";

interface BPULineWithSection extends BPULine {
  section?: string;
  section_id?: string | null;
}

interface DraggableLineProps {
  line: BPULineWithSection;
  selected: boolean;
  focused: boolean;
  onToggleSelection: (lineId: string) => void;
  onLineUpdate: (id: string, updates: Partial<BPULine>) => void;
  onLineDelete: (id: string) => void;
  onCopyLine: (line: BPULineWithSection) => void;
  onFocus: (lineId: string) => void;
  lotCode?: string;
  formatNumber: (value: number) => string;
  formatCurrency: (value: number) => string;
  variables: CalculatorVariable[];
  resolveQuantity: (quantity: number | string, linkedVariable?: string) => number;
}

export const DraggableLine = ({
  line,
  selected,
  focused,
  onToggleSelection,
  onLineUpdate,
  onLineDelete,
  onCopyLine,
  onFocus,
  lotCode,
  formatNumber,
  formatCurrency,
  variables,
  resolveQuantity,
}: DraggableLineProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: line.id });

  // Local state for comment to avoid race conditions with instant saves
  const [localComment, setLocalComment] = useState(line.comment || "");

  // Sync local state when line.comment changes from external source
  useEffect(() => {
    setLocalComment(line.comment || "");
  }, [line.comment]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const resolvedQuantity = resolveQuantity(line.quantity, line.linkedVariable);
  const total = resolvedQuantity * line.unitPrice;
  
  // Debug log
  console.log(`Line ${line.id.slice(0, 8)}: linkedVariable="${line.linkedVariable}", quantity=${line.quantity}, resolved=${resolvedQuantity}`);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b hover:bg-muted/30 group ${selected ? "bg-accent/20" : ""} ${
        focused ? "ring-2 ring-primary ring-inset" : ""
      }`}
      onClick={() => onFocus(line.id)}
    >
      <td className="py-1 px-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-muted rounded"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </button>
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelection(line.id)}
          />
        </div>
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
        <input
          type="text"
          value={localComment}
          onChange={(e) => setLocalComment(e.target.value)}
          onBlur={() => {
            if (localComment !== (line.comment || "")) {
              onLineUpdate(line.id, { comment: localComment });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
          placeholder="Commentaire..."
          className="w-full h-7 px-2 text-xs border rounded-md bg-background hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-primary"
        />
      </td>
      <td className="py-1 px-2">
        <QuantityFormulaInput
          value={typeof line.quantity === 'number' ? line.quantity : parseFloat(String(line.quantity)) || 0}
          formula={line.quantity_formula}
          linkedVariable={line.linkedVariable}
          variables={variables}
          resolvedValue={resolvedQuantity}
          onUpdate={(updates) => {
            onLineUpdate(line.id, {
              quantity: updates.quantity,
              quantity_formula: updates.quantity_formula,
              linkedVariable: updates.linkedVariable,
            });
          }}
          placeholder="Quantité"
          className="text-right tabular-nums"
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
              priceSource: newSource,
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
            onClick={() => onCopyLine(line)}
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
};
