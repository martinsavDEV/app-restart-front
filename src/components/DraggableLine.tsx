import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EditableCell } from "@/components/EditableCell";
import { EditableCellText } from "@/components/EditableCellText";
import { PriceItemAutocomplete } from "@/components/PriceItemAutocomplete";
import { PriceSourceIndicator } from "@/components/PriceSourceIndicator";
import { VariableAutocomplete } from "@/components/VariableAutocomplete";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { BPULine, CalculatorVariable } from "@/types/bpu";
import { Copy, Trash2, GripVertical } from "lucide-react";

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
  resolveQuantity: (quantity: number | string) => number;
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const resolvedQuantity = resolveQuantity(line.quantity);
  const total = resolvedQuantity * line.unitPrice;

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
        <VariableAutocomplete
          value={line.quantity}
          variables={variables}
          resolvedValue={resolvedQuantity}
          onSelect={(variable) => {
            onLineUpdate(line.id, { 
              quantity: variable.name,
              linkedVariable: variable.name,
            });
          }}
          onChange={(value) => {
            const numValue = parseFloat(value);
            onLineUpdate(line.id, { 
              quantity: isNaN(numValue) ? value : numValue,
              linkedVariable: value.startsWith("$") ? value : undefined,
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
