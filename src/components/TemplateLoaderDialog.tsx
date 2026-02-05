import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Check } from "lucide-react";
import { useTemplates } from "@/hooks/useTemplates";
import { usePriceItems, PriceItem } from "@/hooks/usePriceItems";
import { WorkSection, BPULine } from "@/types/bpu";
import { PriceVariantSelectorDialog } from "./PriceVariantSelectorDialog";

interface LineWithVariants {
  sectionId: string;
  sectionTitle: string;
  line: BPULine;
  variants: PriceItem[];
}

interface TemplateLoaderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lotCode?: string;
  onLoadTemplate: (sections: WorkSection[]) => void;
}

export const TemplateLoaderDialog = ({
  open,
  onOpenChange,
  lotCode,
  onLoadTemplate,
}: TemplateLoaderDialogProps) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [pendingSections, setPendingSections] = useState<WorkSection[]>([]);
  const [linesWithVariants, setLinesWithVariants] = useState<LineWithVariants[]>([]);

  const { templates, isLoading } = useTemplates();
  const { priceItems } = usePriceItems();

  const filteredTemplates = templates;

  const selectedTemplate = filteredTemplates?.find((t) => t.id === selectedTemplateId);

  // Count variants per item name in price database
  const variantsMap = useMemo(() => {
    const map = new Map<string, PriceItem[]>();
    priceItems?.forEach((item) => {
      const key = item.item.toLowerCase().trim();
      const existing = map.get(key) || [];
      existing.push(item);
      map.set(key, existing);
    });
    return map;
  }, [priceItems]);

  const findVariants = (designation: string): PriceItem[] => {
    return variantsMap.get(designation.toLowerCase().trim()) || [];
  };

  const handleLoad = () => {
    if (!selectedTemplate) return;

    const templateData = selectedTemplate.template_lines as any;
    let sections: WorkSection[] = templateData.sections || [];

    // Find lines with multiple price variants
    const linesWithMultipleVariants: LineWithVariants[] = [];
    
    // Update prices automatically for items with single variant
    sections = sections.map((section) => ({
      ...section,
      lines: section.lines?.map((line: BPULine) => {
        const variants = findVariants(line.designation);
        
        if (variants.length === 1) {
          // Single variant: update automatically
          const priceItem = variants[0];
          return {
            ...line,
            unitPrice: priceItem.unit_price,
            priceSource: priceItem.price_reference || priceItem.item,
          };
        } else if (variants.length > 1) {
          // Multiple variants: collect for selector
          linesWithMultipleVariants.push({
            sectionId: section.id,
            sectionTitle: section.title,
            line,
            variants,
          });
        }
        // No variant: keep original price
        return line;
      }) || [],
    }));

    if (linesWithMultipleVariants.length > 0) {
      setPendingSections(sections);
      setLinesWithVariants(linesWithMultipleVariants);
      setShowVariantSelector(true);
    } else {
      onLoadTemplate(sections);
      onOpenChange(false);
      setSelectedTemplateId(null);
    }
  };

  const handleVariantConfirm = (
    selections: Map<string, { unitPrice: number; priceSource: string } | null>
  ) => {
    // Apply selected prices to pending sections
    const updatedSections = pendingSections.map((section) => ({
      ...section,
      lines: section.lines.map((line) => {
        const selection = selections.get(line.id);
        if (selection) {
          return {
            ...line,
            unitPrice: selection.unitPrice,
            priceSource: selection.priceSource,
          };
        }
        return line;
      }),
    }));

    onLoadTemplate(updatedSections);
    onOpenChange(false);
    setSelectedTemplateId(null);
    setPendingSections([]);
    setLinesWithVariants([]);
  };

  // Check if selected template has lines with price updates
  const selectedTemplateVariantsInfo = useMemo(() => {
    if (!selectedTemplate) return null;
    
    const templateData = selectedTemplate.template_lines as any;
    const sections = templateData.sections || [];
    
    let linesWithMultipleVariants = 0;
    let linesWithAutoUpdate = 0;
    
    sections.forEach((section: any) => {
      section.lines?.forEach((line: any) => {
        const variants = findVariants(line.designation);
        if (variants.length > 1) {
          linesWithMultipleVariants++;
        } else if (variants.length === 1) {
          linesWithAutoUpdate++;
        }
      });
    });

    return {
      multipleVariants: linesWithMultipleVariants > 0 ? linesWithMultipleVariants : null,
      autoUpdate: linesWithAutoUpdate > 0 ? linesWithAutoUpdate : null,
    };
  }, [selectedTemplate, variantsMap]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Charger un template</DialogTitle>
            <DialogDescription>
              Sélectionnez un template pour ajouter ses lignes au lot
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <RadioGroup value={selectedTemplateId || ""} onValueChange={setSelectedTemplateId}>
                {filteredTemplates?.map((template) => (
                  <div key={template.id} className="flex items-start space-x-2">
                    <RadioGroupItem value={template.id} id={template.id} className="mt-1" />
                    <Label htmlFor={template.id} className="flex-1 cursor-pointer">
                      <Card className="hover:bg-accent/50 transition-colors">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">{template.label}</CardTitle>
                          {template.description && (
                            <CardDescription className="text-xs">
                              {template.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground">
                            {(() => {
                              const templateData = template.template_lines as any;
                              const sections = templateData.sections || [];
                              return `${sections.reduce((sum: number, section: any) => sum + (section.lines?.length || 0), 0)} ligne(s) dans ${sections.length} section(s)`;
                            })()}
                          </p>
                        </CardContent>
                      </Card>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {selectedTemplate && (() => {
                const templateData = selectedTemplate.template_lines as any;
                const sections = templateData.sections || [];
                return (
                  <Card className="border-primary">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>Aperçu des lignes</span>
                        <div className="flex items-center gap-2">
                          {selectedTemplateVariantsInfo?.autoUpdate && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              {selectedTemplateVariantsInfo.autoUpdate} prix MAJ auto
                            </Badge>
                          )}
                          {selectedTemplateVariantsInfo?.multipleVariants && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {selectedTemplateVariantsInfo.multipleVariants} ligne(s) avec plusieurs prix
                            </Badge>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {sections.map((section: any, sectionIndex: number) => (
                          <div key={sectionIndex} className="space-y-2">
                            <div className="font-semibold text-xs text-primary">{section.title}</div>
                            {section.lines?.map((line: any, lineIndex: number) => {
                              const variants = findVariants(line.designation);
                              const hasMultipleVariants = variants.length > 1;
                              const hasSingleVariant = variants.length === 1;
                              const updatedPrice = hasSingleVariant ? variants[0].unit_price : null;
                              return (
                                <div
                                  key={lineIndex}
                                  className={`text-xs p-2 rounded flex justify-between ml-3 ${
                                    hasMultipleVariants 
                                      ? "bg-amber-50 border border-amber-200" 
                                      : hasSingleVariant
                                        ? "bg-green-50 border border-green-200"
                                        : "bg-muted/50"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{line.designation}</span>
                                    {hasMultipleVariants && (
                                      <Badge 
                                        variant="secondary" 
                                        className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 h-4"
                                      >
                                        {variants.length} prix
                                      </Badge>
                                    )}
                                    {hasSingleVariant && (
                                      <Badge 
                                        variant="secondary" 
                                        className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0 h-4"
                                      >
                                        Prix MAJ
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-muted-foreground">
                                    {hasSingleVariant && updatedPrice !== line.unitPrice ? (
                                      <>
                                        <span className="line-through mr-1">{line.unitPrice}€</span>
                                        <span className="text-green-600 font-medium">{updatedPrice}€/{line.unit}</span>
                                      </>
                                    ) : (
                                      <>{line.unitPrice}€/{line.unit}</>
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleLoad} disabled={!selectedTemplateId}>
              Charger le template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PriceVariantSelectorDialog
        open={showVariantSelector}
        onOpenChange={setShowVariantSelector}
        linesWithVariants={linesWithVariants}
        onConfirm={handleVariantConfirm}
      />
    </>
  );
};
