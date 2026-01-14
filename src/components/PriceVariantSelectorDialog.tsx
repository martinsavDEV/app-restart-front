import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { BPULine, WorkSection } from "@/types/bpu";
import { PriceItem } from "@/hooks/usePriceItems";

interface LineWithVariants {
  sectionId: string;
  sectionTitle: string;
  line: BPULine;
  variants: PriceItem[];
}

interface PriceVariantSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linesWithVariants: LineWithVariants[];
  onConfirm: (selections: Map<string, { unitPrice: number; priceSource: string } | null>) => void;
}

export const PriceVariantSelectorDialog = ({
  open,
  onOpenChange,
  linesWithVariants,
  onConfirm,
}: PriceVariantSelectorDialogProps) => {
  // Map lineId -> selected variant id (null = keep template price)
  const [selections, setSelections] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    // Initialize with "template" (keep original) for all lines
    const initial = new Map<string, string>();
    linesWithVariants.forEach((lwv) => {
      initial.set(lwv.line.id, "template");
    });
    setSelections(initial);
  }, [linesWithVariants, open]);

  const handleSelectionChange = (lineId: string, value: string) => {
    setSelections((prev) => {
      const next = new Map(prev);
      next.set(lineId, value);
      return next;
    });
  };

  const handleConfirm = () => {
    const result = new Map<string, { unitPrice: number; priceSource: string } | null>();
    
    linesWithVariants.forEach((lwv) => {
      const selectedValue = selections.get(lwv.line.id);
      if (selectedValue === "template" || !selectedValue) {
        result.set(lwv.line.id, null); // Keep template price
      } else {
        const selectedVariant = lwv.variants.find((v) => v.id === selectedValue);
        if (selectedVariant) {
          result.set(lwv.line.id, {
            unitPrice: selectedVariant.unit_price,
            priceSource: selectedVariant.price_reference || "Base de prix",
          });
        }
      }
    });

    onConfirm(result);
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Choix des prix
          </DialogTitle>
          <DialogDescription>
            Certaines lignes du template ont plusieurs prix disponibles dans la base de données.
            Choisissez le prix à appliquer pour chaque ligne.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh] pr-4">
          <div className="space-y-6">
            {linesWithVariants.map((lwv) => (
              <Card key={lwv.line.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>{lwv.line.designation}</span>
                    <Badge variant="secondary" className="text-xs">
                      {lwv.variants.length + 1} options
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{lwv.sectionTitle}</p>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={selections.get(lwv.line.id) || "template"}
                    onValueChange={(value) => handleSelectionChange(lwv.line.id, value)}
                    className="space-y-2"
                  >
                    {/* Option template */}
                    <div className="flex items-center space-x-3 p-2 rounded-md border hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="template" id={`${lwv.line.id}-template`} />
                      <Label
                        htmlFor={`${lwv.line.id}-template`}
                        className="flex-1 cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Template
                          </Badge>
                          <span className="text-sm">
                            {formatCurrency(lwv.line.unitPrice)}/{lwv.line.unit}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {lwv.line.priceSource || "Prix du template"}
                        </span>
                      </Label>
                    </div>

                    {/* Options base de prix */}
                    {lwv.variants.map((variant) => (
                      <div
                        key={variant.id}
                        className="flex items-center space-x-3 p-2 rounded-md border hover:bg-accent/50 transition-colors"
                      >
                        <RadioGroupItem value={variant.id} id={`${lwv.line.id}-${variant.id}`} />
                        <Label
                          htmlFor={`${lwv.line.id}-${variant.id}`}
                          className="flex-1 cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Badge className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                              Base de prix
                            </Badge>
                            <span className="text-sm">
                              {formatCurrency(variant.unit_price)}/{variant.unit}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {variant.price_reference || "Non référencé"}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleConfirm}>Appliquer les prix sélectionnés</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
