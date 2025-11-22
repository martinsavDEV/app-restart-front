import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BPUTable } from "@/components/BPUTable";
import { CAPEXSummaryCard } from "@/components/CAPEXSummaryCard";
import { WorkLot, BPULine, CAPEXSummary } from "@/types/bpu";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const initialLots: WorkLot[] = [
  {
    id: "terrassement",
    name: "Terrassement",
    description: "Lignes BPU : désignation, Q, U, PU, total, source prix",
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
  {
    id: "reinforcement",
    name: "Renforcement de sol",
    description: "Ex : CMC, inclusions rigides, amélioration locale...",
    lines: [],
  },
  {
    id: "foundations",
    name: "Fondations",
    description: "Béton, armatures, fouilles, drains, mises à la terre…",
    lines: [],
  },
  {
    id: "electricity",
    name: "Électricité",
    description: "Tranchées HTA, câbles, poste de livraison, réseaux divers…",
    lines: [],
  },
  {
    id: "turbine",
    name: "Turbinier",
    description: "Prix forfaitaires par éolienne, options, logistique…",
    lines: [],
  },
];

export const PricingView = () => {
  const [lots, setLots] = useState<WorkLot[]>(initialLots);
  const [contingencyRate] = useState(10);

  const calculateLotTotal = (lines: BPULine[]): number => {
    return lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  };

  const capexSummary: CAPEXSummary = useMemo(() => {
    const terrassement = calculateLotTotal(lots.find((l) => l.id === "terrassement")?.lines || []);
    const reinforcement = calculateLotTotal(lots.find((l) => l.id === "reinforcement")?.lines || []);
    const foundations = calculateLotTotal(lots.find((l) => l.id === "foundations")?.lines || []);
    const electricity = calculateLotTotal(lots.find((l) => l.id === "electricity")?.lines || []);
    const turbine = calculateLotTotal(lots.find((l) => l.id === "turbine")?.lines || []);
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

  const handleLineUpdate = (lotId: string, lineId: string, updates: Partial<BPULine>) => {
    setLots((prevLots) =>
      prevLots.map((lot) => {
        if (lot.id === lotId) {
          return {
            ...lot,
            lines: lot.lines.map((line) =>
              line.id === lineId ? { ...line, ...updates } : line
            ),
          };
        }
        return lot;
      })
    );
    toast.success("Ligne mise à jour");
  };

  const handleLineDelete = (lotId: string, lineId: string) => {
    setLots((prevLots) =>
      prevLots.map((lot) => {
        if (lot.id === lotId) {
          return {
            ...lot,
            lines: lot.lines.filter((line) => line.id !== lineId),
          };
        }
        return lot;
      })
    );
    toast.success("Ligne supprimée");
  };

  const handleAddLine = (lotId: string) => {
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
            lines: [...lot.lines, newLine],
          };
        }
        return lot;
      })
    );
    toast.info("Nouvelle ligne ajoutée. Double-cliquez pour modifier les valeurs.");
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-lg font-semibold">Chiffrage projet</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            BPU par lots pour Parc éolien La Besse
          </p>
          <p className="text-xs text-accent mt-1">
            💡 Double-cliquez sur les quantités et prix pour les modifier
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Charger un template chantier type
          </Button>
          <Button size="sm">Appliquer prix BDD</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <div className="space-y-3">
          {lots.map((lot) => (
            <Card key={lot.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm">{lot.name}</CardTitle>
                    <CardDescription className="text-xs">{lot.description}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px]"
                    onClick={() => handleAddLine(lot.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter une ligne
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <BPUTable
                  lines={lot.lines}
                  onLineUpdate={(lineId, updates) => handleLineUpdate(lot.id, lineId, updates)}
                  onLineDelete={(lineId) => handleLineDelete(lot.id, lineId)}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <CAPEXSummaryCard summary={capexSummary} contingencyRate={contingencyRate} />
        </div>
      </div>
    </div>
  );
};
