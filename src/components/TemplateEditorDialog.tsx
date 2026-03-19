import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkLot, WorkSection, BPULine } from "@/types/bpu";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { EditableCell } from "./EditableCell";
import { EditableCellText } from "./EditableCellText";
import { VariableAutocomplete } from "./VariableAutocomplete";
import { PriceItemAutocomplete } from "./PriceItemAutocomplete";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { getTemplateAvailableVariables } from "@/hooks/useCalculatorVariables";
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
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TemplateEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: { id: string; code: string; label: string; description?: string; template_lines: any };
  onSave: (template: { code: string; label: string; description?: string; template_lines: WorkLot }) => void;
}

const LOT_OPTIONS = [
  { value: "terrassement", label: "Terrassement" },
  { value: "renforcement", label: "Renforcement de sol" },
  { value: "fondation", label: "Fondations" },
  { value: "electricite", label: "Électricité" },
  { value: "turbine", label: "Turbinier" },
];

// --- Sortable row component ---
interface SortableLineRowProps {
  line: BPULine;
  sectionId: string;
  code: string;
  templateVariables: ReturnType<typeof getTemplateAvailableVariables>;
  updateLine: (sectionId: string, lineId: string, updates: Partial<BPULine>) => void;
  deleteLine: (sectionId: string, lineId: string) => void;
  formatCurrency: (value: number) => string;
}

const SortableLineRow = ({
  line,
  sectionId,
  code,
  templateVariables,
  updateLine,
  deleteLine,
  formatCurrency,
}: SortableLineRowProps) => {
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

  const qty = typeof line.quantity === "number" ? line.quantity : parseFloat(String(line.quantity)) || 0;

  return (
    <tr ref={setNodeRef} style={style} className="border-b">
      <td className="py-1 w-6">
        <button
          className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-muted rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </button>
      </td>
      <td className="py-1">
        <PriceItemAutocomplete
          value={line.designation}
          lotCode={code}
          onSelect={(item) => {
            updateLine(sectionId, line.id, {
              designation: item.designation,
              unit: item.unit,
              unitPrice: item.unitPrice,
              priceSource: item.priceSource,
            });
          }}
          onChange={(value) => updateLine(sectionId, line.id, { designation: value })}
          className="w-full"
        />
      </td>
      <td className="py-1">
        <VariableAutocomplete
          value={line.linkedVariable || String(qty)}
          variables={templateVariables}
          resolvedValue={undefined}
          onSelect={(variable) => {
            updateLine(sectionId, line.id, {
              linkedVariable: variable.name,
              quantity: variable.value,
            });
          }}
          onChange={(value) => {
            const trimmedValue = value.trim();
            if (!trimmedValue) {
              updateLine(sectionId, line.id, { quantity: 0, linkedVariable: undefined });
            } else if (trimmedValue.startsWith("$")) {
              updateLine(sectionId, line.id, { linkedVariable: trimmedValue });
            } else {
              const numValue = parseFloat(trimmedValue.replace(/[^\d.,]/g, "").replace(",", "."));
              updateLine(sectionId, line.id, {
                quantity: isNaN(numValue) ? 0 : numValue,
                linkedVariable: undefined,
              });
            }
          }}
          className="w-20 text-right"
        />
      </td>
      <td className="py-1">
        <EditableCellText
          value={line.unit}
          onChange={(value) => updateLine(sectionId, line.id, { unit: value })}
          maxLength={10}
        />
      </td>
      <td className="py-1">
        <EditableCell
          value={line.unitPrice || 0}
          onChange={(value) => updateLine(sectionId, line.id, { unitPrice: value })}
          align="right"
          format={(v) => (v || 0).toFixed(2)}
        />
      </td>
      <td className="py-1">
        {line.priceSource ? (
          <Badge variant="outline" className="text-[10px] font-normal">
            {line.priceSource}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-[10px]">Manuel</span>
        )}
      </td>
      <td className="py-1 text-right font-medium">
        {formatCurrency(qty * (line.unitPrice || 0))}
      </td>
      <td className="py-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => deleteLine(sectionId, line.id)}
          className="h-6 w-6 p-0"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </td>
    </tr>
  );
};

// --- Main dialog ---
export const TemplateEditorDialog = ({ open, onOpenChange, template, onSave }: TemplateEditorDialogProps) => {
  const [code, setCode] = useState(template?.code || "terrassement");
  const [label, setLabel] = useState(template?.label || "");
  const [description, setDescription] = useState(template?.description || "");
  const [sections, setSections] = useState<WorkSection[]>([]);

  const templateVariables = useMemo(() => getTemplateAvailableVariables(), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    if (template) {
      setCode(template.code);
      setLabel(template.label);
      setDescription(template.description || "");
      const templateSections = (template.template_lines as WorkLot)?.sections || [];
      const normalizedSections = templateSections.map(section => ({
        ...section,
        lines: section.lines.map(line => ({
          ...line,
          unitPrice: line.unitPrice ?? 0,
          quantity: line.quantity ?? 0,
        }))
      }));
      setSections(normalizedSections);
    } else {
      setCode("fondation");
      setLabel("");
      setDescription("");
      setSections([]);
    }
  }, [template, open]);

  const addSection = () => {
    const newSection: WorkSection = {
      id: `section-${Date.now()}`,
      title: "Nouvelle section",
      is_multiple: false,
      multiplier: 1,
      lines: [],
    };
    setSections([...sections, newSection]);
  };

  const deleteSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
  };

  const updateSectionTitle = (sectionId: string, title: string) => {
    setSections(sections.map(s => s.id === sectionId ? { ...s, title } : s));
  };

  const updateSectionMultiple = (sectionId: string, isMultiple: boolean) => {
    setSections(sections.map(s =>
      s.id === sectionId ? { ...s, is_multiple: isMultiple, multiplier: isMultiple ? (s.multiplier || 1) : 1 } : s
    ));
  };

  const updateSectionMultiplier = (sectionId: string, multiplier: number) => {
    setSections(sections.map(s =>
      s.id === sectionId ? { ...s, multiplier } : s
    ));
  };

  const addLine = (sectionId: string) => {
    const newLine: BPULine = {
      id: `line-${Date.now()}`,
      designation: "",
      quantity: 0,
      unit: "u",
      unitPrice: 0,
      linkedVariable: undefined,
    };
    setSections(sections.map(s =>
      s.id === sectionId ? { ...s, lines: [...s.lines, newLine] } : s
    ));
  };

  const deleteLine = (sectionId: string, lineId: string) => {
    setSections(sections.map(s =>
      s.id === sectionId ? { ...s, lines: s.lines.filter(l => l.id !== lineId) } : s
    ));
  };

  const updateLine = (sectionId: string, lineId: string, updates: Partial<BPULine>) => {
    setSections(sections.map(s =>
      s.id === sectionId ? {
        ...s,
        lines: s.lines.map(l => l.id === lineId ? { ...l, ...updates } : l)
      } : s
    ));
  };

  const handleLineDragEnd = (sectionId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const oldIndex = s.lines.findIndex(l => l.id === active.id);
      const newIndex = s.lines.findIndex(l => l.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return s;
      return { ...s, lines: arrayMove(s.lines, oldIndex, newIndex) };
    }));
  };

  const handleSave = () => {
    const workLot: WorkLot = {
      id: template?.id || `template-${Date.now()}`,
      name: label,
      description: description,
      sections: sections,
    };

    onSave({
      code,
      label,
      description: description || undefined,
      template_lines: workLot,
    });
    onOpenChange(false);
  };

  const calculateSectionTotal = (section: WorkSection) => {
    return section.lines.reduce((sum, line) => {
      const qty = typeof line.quantity === "number" ? line.quantity : parseFloat(String(line.quantity)) || 0;
      return sum + (qty * (line.unitPrice || 0));
    }, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{template ? "Éditer le template" : "Nouveau template"}</DialogTitle>
          <DialogDescription>
            {template ? "Modifiez les informations du template" : "Créez un nouveau template réutilisable"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-200px)] pr-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lot">Lot</Label>
                <Select value={code} onValueChange={setCode}>
                  <SelectTrigger id="lot">
                    <SelectValue placeholder="Sélectionner un lot" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="label">Nom du template</Label>
                <Input
                  id="label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ex: Fondations standard"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description du template"
                rows={2}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Sections</h3>
                <Button size="sm" variant="outline" onClick={addSection}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter une section
                </Button>
              </div>

              {sections.map((section) => (
                <Card key={section.id}>
                  <CardHeader className="pb-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={section.title}
                        onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                        className="font-medium"
                        placeholder="Titre de la section"
                      />
                      <div className="text-sm font-medium whitespace-nowrap">
                        {formatCurrency(calculateSectionTotal(section))}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSection(section.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 ml-6">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`multiple-${section.id}`}
                          checked={section.is_multiple || false}
                          onCheckedChange={(checked) => updateSectionMultiple(section.id, checked as boolean)}
                        />
                        <Label htmlFor={`multiple-${section.id}`} className="text-sm font-normal cursor-pointer">
                          Section multiple
                        </Label>
                      </div>
                      {section.is_multiple && (
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`multiplier-${section.id}`} className="text-sm font-normal whitespace-nowrap">
                            Multiplicateur:
                          </Label>
                          <Input
                            id={`multiplier-${section.id}`}
                            type="text"
                            inputMode="numeric"
                            value={section.multiplier || 1}
                            onChange={(e) => updateSectionMultiplier(section.id, parseInt(e.target.value) || 1)}
                            className="w-20 h-8"
                          />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleLineDragEnd(section.id)}
                      >
                        <SortableContext
                          items={section.lines.map(l => l.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b">
                                <th className="w-6"></th>
                                <th className="text-left py-2 font-medium">Désignation</th>
                                <th className="text-right py-2 font-medium w-20">Quantité</th>
                                <th className="text-left py-2 font-medium w-16">Unité</th>
                                <th className="text-right py-2 font-medium w-24">PU</th>
                                <th className="text-left py-2 font-medium w-24">Source</th>
                                <th className="text-right py-2 font-medium w-24">Total</th>
                                <th className="w-10"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.lines.map((line) => (
                                <SortableLineRow
                                  key={line.id}
                                  line={line}
                                  sectionId={section.id}
                                  code={code}
                                  templateVariables={templateVariables}
                                  updateLine={updateLine}
                                  deleteLine={deleteLine}
                                  formatCurrency={formatCurrency}
                                />
                              ))}
                            </tbody>
                          </table>
                        </SortableContext>
                      </DndContext>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addLine(section.id)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter une ligne
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!label.trim()}>
            {template ? "Mettre à jour" : "Créer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
