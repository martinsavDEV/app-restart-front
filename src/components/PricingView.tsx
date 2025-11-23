import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BPUTable } from "@/components/BPUTable";
import { CAPEXSummaryCard } from "@/components/CAPEXSummaryCard";
import { BPULine, CAPEXSummary, WorkLot } from "@/types/bpu";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const initialLots: WorkLot[] = [
  {
    id: "installation",
    name: "Installation de chantier",
    description: "Sous-ensembles pour base vie, accès et sécurité.",
    sections: [
      {
        id: "site-setup",
        title: "Base vie & sécurité",
        description: "Base vie, barriérage, raccordements provisoires",
        lines: [
          {
            id: "inst-1",
            designation: "Base vie : bungalows, raccordements, nettoyage",
            quantity: 1,
            unit: "forfait",
            unitPrice: 12500,
            priceSource: "Chiffrage AO interne 2024",
          },
          {
            id: "inst-2",
            designation: "Signalisation et clôtures temporaires",
            quantity: 1,
            unit: "forfait",
            unitPrice: 4200,
            priceSource: "BDD – médiane 3 projets",
          },
        ],
      },
      {
        id: "site-access",
        title: "Aménagements d'accès",
        description: "Pistes provisoires et plateforme logistique",
        lines: [
          {
            id: "inst-3",
            designation: "Ouverture & reprofilage des pistes provisoires",
            quantity: 2.4,
            unit: "km",
            unitPrice: 8500,
            priceSource: "Devis entreprises locales",
          },
          {
            id: "inst-4",
            designation: "Aire logistique pour montage",
            quantity: 1,
            unit: "forfait",
            unitPrice: 7800,
            priceSource: "Chiffrage interne",
          },
        ],
      },
    ],
  },
  {
    id: "terrassement",
    name: "Terrassement",
    description: "Lignes BPU : désignation, Q, U, PU, total, source prix",
    sections: [
      {
        id: "earthworks-main",
        title: "Terrassement principal",
        lines: [
          {
            id: "terr-1",
            designation: "Décapage plate-forme éolienne",
            quantity: 1200,
            unit: "m²",
            unitPrice: 4.1,
            priceSource: "BDD – médiane 3 projets",
          },
          {
            id: "terr-2",
            designation: "Excavation générale",
            quantity: 850,
            unit: "m³",
            unitPrice: 12.5,
            priceSource: "BDD – projet similaire 2024",
          },
        ],
      },
    ],
  },
  {
    id: "reinforcement",
    name: "Renforcement de sol",
    description: "Ex : CMC, inclusions rigides, amélioration locale...",
    sections: [
      {
        id: "reinforcement-main",
        title: "Renforcement",
        lines: [],
      },
    ],
  },
  {
    id: "foundations",
    name: "Fondations",
    description: "Béton, armatures, fouilles, drains, mises à la terre…",
    sections: [
      {
        id: "foundations-main",
        title: "Fondations",
        lines: [],
      },
    ],
  },
  {
    id: "electricity",
    name: "Électricité",
    description: "Tranchées HTA, câbles, poste de livraison, réseaux divers…",
    sections: [
      {
        id: "electricity-main",
        title: "Électricité",
        lines: [],
      },
    ],
  },
  {
    id: "turbine",
    name: "Turbinier",
    description: "Prix forfaitaires par éolienne, options, logistique…",
    sections: [
      {
        id: "turbine-main",
        title: "Turbinier",
        lines: [],
      },
    ],
  },
];

export const PricingView = () => {
  const [lots, setLots] = useState<WorkLot[]>(initialLots);
  const [contingencyRate] = useState(10);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const calculateSectionTotal = (lines: BPULine[]): number => {
    return lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  };

  const calculateLotTotal = (lot: WorkLot): number => {
    return lot.sections.reduce((sum, section) => sum + calculateSectionTotal(section.lines), 0);
  };

  const capexSummary: CAPEXSummary = useMemo(() => {
    const lotTotal = (lotId: string) => {
      const lot = lots.find((l) => l.id === lotId);
      return lot ? calculateLotTotal(lot) : 0;
    };

    const terrassement = lotTotal("terrassement");
    const reinforcement = lotTotal("reinforcement");
    const foundations = lotTotal("foundations");
    const electricity = lotTotal("electricity");
    const turbine = lotTotal("turbine");
    const subtotal = terrassement + reinforcement + foundations + electricity + turbine;
    const contingency = subtotal * (contingencyRate / 100);
    const total = subtotal + contingency;

    return {
      terrassement,
      reinforcement,
      foundations,
      electricity,
      turbine,
      subtotal,
      contingency,
      total,
    };
  }, [lots, contingencyRate]);

  const handleLineUpdate = (
    lotId: string,
    sectionId: string,
    lineId: string,
    updates: Partial<BPULine>
  ) => {
    setLots((prevLots) =>
      prevLots.map((lot) => {
        if (lot.id === lotId) {
          return {
            ...lot,
            sections: lot.sections.map((section) => {
              if (section.id === sectionId) {
                return {
                  ...section,
                  lines: section.lines.map((line) =>
                    line.id === lineId ? { ...line, ...updates } : line
                  ),
                };
              }
              return section;
            }),
          };
        }
        return lot;
      })
    );
    toast.success("Ligne mise à jour");
  };

  const handleLineDelete = (lotId: string, sectionId: string, lineId: string) => {
    setLots((prevLots) =>
      prevLots.map((lot) => {
        if (lot.id === lotId) {
          return {
            ...lot,
            sections: lot.sections.map((section) =>
              section.id === sectionId
                ? {
                    ...section,
                    lines: section.lines.filter((line) => line.id !== lineId),
                  }
                : section
            ),
          };
        }
        return lot;
      })
    );
    toast.success("Ligne supprimée");
  };

  const handleAddLine = (lotId: string, sectionId: string) => {
    const newLine: BPULine = {
      id: `${lotId}-${Date.now()}`,
      designation: "Nouvelle ligne",
      quantity: 0,
      unit: "unité",
      unitPrice: 0,
      priceSource: "",
    };

    setLots((prevLots) =>
      prevLots.map((lot) => {
        if (lot.id === lotId) {
          return {
            ...lot,
            sections: lot.sections.map((section) =>
              section.id === sectionId
                ? { ...section, lines: [...section.lines, newLine] }
                : section
            ),
          };
        }
        return lot;
      })
    );
    toast.info("Nouvelle ligne ajoutée. Double-cliquez pour modifier les valeurs.");
  };

  return (
    <div className="p-4 space-y-3">
      <Tabs defaultValue={lots[0]?.id} className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-lg font-semibold">Chiffrage projet</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              BPU par lots pour 41 - Parc éolien La Besse
            </p>
            <p className="text-xs text-accent mt-1">
              💡 Double-cliquez sur les quantités et prix pour les modifier
            </p>
          </div>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
            <TabsList className="w-full lg:w-auto flex-wrap justify-start">
              {lots.map((lot) => (
                <TabsTrigger key={lot.id} value={lot.id} className="text-xs">
                  {lot.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm">
                Charger un template chantier type
              </Button>
              <Button size="sm">Appliquer prix BDD</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
          <div className="space-y-3">
            {lots.map((lot) => (
              <TabsContent key={lot.id} value={lot.id} className="space-y-3">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm">{lot.name}</CardTitle>
                        <CardDescription className="text-xs">{lot.description}</CardDescription>
                      </div>
                      <div className="text-xs font-semibold tabular-nums">
                        Total lot : {formatCurrency(calculateLotTotal(lot))}
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {lot.sections.map((section) => {
                  const sectionTotal = calculateSectionTotal(section.lines);
                  return (
                    <Card key={section.id}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-sm">{section.title}</CardTitle>
                            {section.description && (
                              <CardDescription className="text-xs">
                                {section.description}
                              </CardDescription>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px]"
                            onClick={() => handleAddLine(lot.id, section.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Ajouter une ligne
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <BPUTable
                          lines={section.lines}
                          onLineUpdate={(lineId, updates) =>
                            handleLineUpdate(lot.id, section.id, lineId, updates)
                          }
                          onLineDelete={(lineId) => handleLineDelete(lot.id, section.id, lineId)}
                        />
                        <div className="flex justify-end text-xs text-muted-foreground">
                          Sous-total {section.title} :
                          <span className="font-semibold ml-2 text-foreground">
                            {formatCurrency(sectionTotal)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>
            ))}
          </div>

          <div>
            <CAPEXSummaryCard summary={capexSummary} contingencyRate={contingencyRate} />
          </div>
        </div>
      </Tabs>
    </div>
  );
};
