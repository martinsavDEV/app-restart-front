import { useState } from "react";
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
import { useTemplates } from "@/hooks/useTemplates";
import { WorkSection } from "@/types/bpu";

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

  const { templates, isLoading } = useTemplates();

  const filteredTemplates = templates?.filter((t) => 
    !lotCode || t.code === lotCode
  );

  const selectedTemplate = filteredTemplates?.find((t) => t.id === selectedTemplateId);

  const handleLoad = () => {
    if (selectedTemplate) {
      const templateData = selectedTemplate.template_lines as any;
      onLoadTemplate(templateData.sections || []);
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
                    <CardTitle className="text-sm">Aperçu des lignes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sections.map((section: any, sectionIndex: number) => (
                        <div key={sectionIndex} className="space-y-2">
                          <div className="font-semibold text-xs text-primary">{section.title}</div>
                          {section.lines?.map((line: any, lineIndex: number) => (
                            <div
                              key={lineIndex}
                              className="text-xs p-2 bg-muted/50 rounded flex justify-between ml-3"
                            >
                              <span className="font-medium">{line.designation}</span>
                              <span className="text-muted-foreground">
                                {line.unitPrice}€/{line.unit}
                              </span>
                            </div>
                          ))}
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
  );
};
