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
    id: "terrassement",
    name: "Terrassement",
    description: "Lignes BPU : désignation, Q, U, PU, total, source prix",
    sections: [
      {
        id: "terr-installation",
        title: "Installation de chantier",
        description: "Base vie, barriérage, raccordements provisoires",
        lines: [
          {
            id: "terr-inst-1",
            designation: "Base vie : bungalows, raccordements, nettoyage",
            quantity: 1,
            unit: "forfait",
            unitPrice: 12500,
            priceSource: "Chiffrage AO interne 2024",
          },
          {
            id: "terr-inst-2",
            designation: "Signalisation et clôtures temporaires",
            quantity: 1,
            unit: "forfait",
            unitPrice: 4200,
            priceSource: "BDD – médiane 3 projets",
          },
        ],
      },
      {
        id: "terr-earthworks",
        title: "Terrassement principal",
        description: "Décapage, excavation, remblais",
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
          {
            id: "terr-3",
            designation: "Remblai compacté GNT",
            quantity: 420,
            unit: "m³",
            unitPrice: 18.0,
            priceSource: "Devis carrière locale",
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
        id: "reinf-installation",
        title: "Installation de chantier",
        lines: [
          {
            id: "reinf-inst-1",
            designation: "Mobilisation équipe spécialisée",
            quantity: 1,
            unit: "forfait",
            unitPrice: 8500,
            priceSource: "Devis entreprise spécialisée",
          },
        ],
      },
      {
        id: "reinf-main",
        title: "Travaux de renforcement",
        description: "Inclusions rigides et traitement",
        lines: [
          {
            id: "reinf-1",
            designation: "Inclusions rigides Ø450mm",
            quantity: 320,
            unit: "ml",
            unitPrice: 85.0,
            priceSource: "BDD – projet similaire 2023",
          },
          {
            id: "reinf-2",
            designation: "Traitement à la chaux",
            quantity: 650,
            unit: "m³",
            unitPrice: 28.5,
            priceSource: "Devis entreprise",
          },
        ],
      },
    ],
  },
  {
    id: "foundations",
    name: "Fondations",
    description: "Béton, armatures, fouilles, drains, mises à la terre…",
    sections: [
      {
        id: "found-installation",
        title: "Installation de chantier",
        lines: [
          {
            id: "found-inst-1",
            designation: "Aire de préfabrication ferraillage",
            quantity: 1,
            unit: "forfait",
            unitPrice: 6500,
            priceSource: "Chiffrage interne",
          },
        ],
      },
      {
        id: "found-main",
        title: "Travaux de fondations",
        description: "Béton armé et ferraillage",
        lines: [
          {
            id: "found-1",
            designation: "Béton C30/37 pour massif",
            quantity: 285,
            unit: "m³",
            unitPrice: 145.0,
            priceSource: "Devis centrale béton",
          },
          {
            id: "found-2",
            designation: "Acier HA ferraillage",
            quantity: 32,
            unit: "tonnes",
            unitPrice: 1850.0,
            priceSource: "BDD – médiane 2024",
          },
          {
            id: "found-3",
            designation: "Coffrage et décoffrage",
            quantity: 180,
            unit: "m²",
            unitPrice: 42.0,
            priceSource: "Devis entreprise",
          },
        ],
      },
    ],
  },
  {
    id: "electricity",
    name: "Électricité",
    description: "Tranchées HTA, câbles, poste de livraison, réseaux divers…",
    sections: [
      {
        id: "elec-installation",
        title: "Installation de chantier",
        lines: [
          {
            id: "elec-inst-1",
            designation: "Raccordement provisoire chantier",
            quantity: 1,
            unit: "forfait",
            unitPrice: 3200,
            priceSource: "Devis ENEDIS",
          },
        ],
      },
      {
        id: "elec-main",
        title: "Réseaux électriques",
        description: "Câbles, tranchées et postes",
        lines: [
          {
            id: "elec-1",
            designation: "Tranchée HTA profondeur 1.2m",
            quantity: 2800,
            unit: "ml",
            unitPrice: 32.0,
            priceSource: "BDD – médiane 5 projets",
          },
          {
            id: "elec-2",
            designation: "Câble HTA 20kV aluminium",
            quantity: 2850,
            unit: "ml",
            unitPrice: 48.5,
            priceSource: "Devis fournisseur",
          },
          {
            id: "elec-3",
            designation: "Poste de livraison préfabriqué",
            quantity: 1,
            unit: "unité",
            unitPrice: 125000,
            priceSource: "Catalogue constructeur",
          },
        ],
      },
    ],
  },
  {
    id: "turbine",
    name: "Turbinier",
    description: "Prix forfaitaires par éolienne, options, logistique…",
    sections: [
      {
        id: "turb-installation",
        title: "Installation de chantier",
        lines: [
          {
            id: "turb-inst-1",
            designation: "Mobilisation grue 650t",
            quantity: 1,
            unit: "forfait",
            unitPrice: 85000,
            priceSource: "Devis grutier spécialisé",
          },
        ],
      },
      {
        id: "turb-main",
        title: "Fourniture et montage",
        description: "Éoliennes et équipements",
        lines: [
          {
            id: "turb-1",
            designation: "Éolienne 3MW complète (tour, nacelle, rotor)",
            quantity: 6,
            unit: "unité",
            unitPrice: 1850000,
            priceSource: "Contrat turbinier 2024",
          },
          {
            id: "turb-2",
            designation: "Montage et mise en service",
            quantity: 6,
            unit: "unité",
            unitPrice: 125000,
            priceSource: "Contrat turbinier",
          },
        ],
      },
    ],
  },
];

interface PricingViewProps {
  projectId?: string | null;
  projectName?: string | null;
  versionId?: string | null;
}

export const PricingView = ({ projectId, projectName, versionId }: PricingViewProps) => {
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
              {projectName ? `BPU par lots pour ${projectName}` : "BPU par lots"}
              {versionId && " - Version sélectionnée"}
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
      </Tabs>
    </div>
  );
};
