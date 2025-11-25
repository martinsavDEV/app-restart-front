import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkLot } from "@/types/bpu";
import { Plus } from "lucide-react";
import { useState } from "react";

const foundationsTemplate: WorkLot = {
  id: "foundations-template",
  name: "Foundations",
  description: "Template pour fondations éoliennes - 3 WTG",
  sections: [
    {
      id: "travaux-preparatoires",
      title: "Travaux préparatoires",
      lines: [
        { id: "1", designation: "Installation", quantity: 1, unit: "ft", unitPrice: 35000, priceSource: "forfait" },
        { id: "2", designation: "remise en état", quantity: 0, unit: "ft", unitPrice: 0 },
        { id: "3", designation: "sécu", quantity: 0, unit: "ft", unitPrice: 0 },
        { id: "4", designation: "convenance", quantity: 0, unit: "ft", unitPrice: 0 },
        { id: "5", designation: "management suivi", quantity: 0, unit: "ft", unitPrice: 0 },
      ]
    },
    {
      id: "fondation",
      title: "fondation",
      lines: [
        { id: "6", designation: "Béton de propreté", quantity: 1, unit: "ft", unitPrice: 10000 },
        { id: "7", designation: "cage d'ancrage", quantity: 1, unit: "ft", unitPrice: 5000 },
        { id: "8", designation: "feraillage", quantity: 65550, unit: "kg", unitPrice: 1.15 },
        { id: "9", designation: "béton socle", quantity: 550, unit: "m3", unitPrice: 190 },
        { id: "10", designation: "béton assiette", quantity: 25, unit: "m3", unitPrice: 195 },
        { id: "11", designation: "coffrage", quantity: 1, unit: "ft", unitPrice: 1500 },
        { id: "12", designation: "MALT", quantity: 1, unit: "ft", unitPrice: 5000 },
        { id: "13", designation: "Fourreaux", quantity: 1, unit: "ft", unitPrice: 1000 },
        { id: "14", designation: "grouting", quantity: 1, unit: "ft", unitPrice: 0 },
        { id: "15", designation: "sealing", quantity: 1, unit: "ft", unitPrice: 0 },
        { id: "16", designation: "/ WTG", quantity: 1, unit: "ft", unitPrice: 207258 },
        { id: "17", designation: "Nombre de fondations", quantity: 3, unit: "unité", unitPrice: 0 },
      ]
    },
    {
      id: "assurance-plans",
      title: "Assurance et plans",
      lines: [
        { id: "18", designation: "assurance", quantity: 1, unit: "ft", unitPrice: 25000 },
        { id: "19", designation: "plans", quantity: 1, unit: "ft", unitPrice: 2000 },
      ]
    }
  ]
};

export const TemplatesView = () => {
  const [templates] = useState<WorkLot[]>([foundationsTemplate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const calculateTemplateTotal = (template: WorkLot) => {
    return template.sections.reduce((lotTotal, section) => {
      const sectionTotal = section.lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
      return lotTotal + sectionTotal;
    }, 0);
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Templates</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Modèles de chiffrage réutilisables
          </p>
        </div>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau template
        </Button>
      </div>

      <div className="grid gap-3">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm">{template.name}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {template.description}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">
                    {formatCurrency(calculateTemplateTotal(template))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {template.sections.length} sections
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {template.sections.map((section) => {
                  const sectionTotal = section.lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
                  return (
                    <div key={section.id} className="flex items-center justify-between py-1.5 border-l-2 border-border pl-3">
                      <div>
                        <div className="text-xs font-medium">{section.title}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {section.lines.length} lignes
                        </div>
                      </div>
                      <div className="text-xs font-medium">
                        {formatCurrency(sectionTotal)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  Prévisualiser
                </Button>
                <Button size="sm" className="flex-1">
                  Utiliser ce template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
