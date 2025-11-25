import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Loader2 } from "lucide-react";

interface TemplateLine {
  designation: string;
  unit: string;
  unit_price: number;
  comment?: string;
}

interface LotTemplate {
  id: string;
  code: string;
  label: string;
  description?: string;
  template_lines: TemplateLine[];
}

interface TemplateLoaderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lotCode?: string;
  onLoadTemplate: (templateLines: TemplateLine[]) => void;
}

export const TemplateLoaderDialog = ({
  open,
  onOpenChange,
  lotCode,
  onLoadTemplate,
}: TemplateLoaderDialogProps) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["lot-templates", lotCode],
    queryFn: async () => {
      let query = supabase.from("lot_templates").select("*");
      
      if (lotCode) {
        query = query.eq("code", lotCode);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        template_lines: d.template_lines as unknown as TemplateLine[]
      }));
    },
    enabled: open,
  });

  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

  const handleLoad = () => {
    if (selectedTemplate) {
      onLoadTemplate(selectedTemplate.template_lines);
      onOpenChange(false);
      setSelectedTemplateId(null);
    }
  };

  return (
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
              {templates?.map((template) => (
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
                          {template.template_lines.length} ligne(s) type
                        </p>
                      </CardContent>
                    </Card>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {selectedTemplate && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-sm">Aperçu des lignes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedTemplate.template_lines.map((line, index) => (
                      <div
                        key={index}
                        className="text-xs p-2 bg-muted/50 rounded flex justify-between"
                      >
                        <span className="font-medium">{line.designation}</span>
                        <span className="text-muted-foreground">
                          {line.unit_price}€/{line.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
  );
};
