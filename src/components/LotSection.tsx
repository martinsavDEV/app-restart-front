import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileUp, FolderPlus } from "lucide-react";
import { BPUTableWithSections } from "@/components/BPUTableWithSections";
import { useQuoteSections } from "@/hooks/useQuoteSections";
import { BPULine } from "@/types/bpu";

interface LotSectionProps {
  lot: any;
  convertToBPULines: (lines: any[]) => (BPULine & { section_id?: string | null })[];
  formatCurrency: (value: number) => string;
  calculateLotTotal: (lines: any[], sections: any[]) => number;
  handleLineUpdate: (lineId: string, updates: Partial<any>) => void;
  handleLineDelete: (lineId: string) => void;
  handleBulkDelete: (lineIds: string[]) => void;
  handleLinePaste: (lotId: string) => (line: Omit<any, "id">, sectionId: string | null, afterLineId?: string) => void;
  handleLoadTemplate: (lotId: string, lotCode: string) => void;
  handleAddLine: (lotId: string) => void;
  handleLinesReorder: (updates: { id: string; order_index: number }[]) => void;
  handleLineSectionChange: (lineId: string, newSectionId: string | null, newOrderIndex: number) => void;
  onCreateSection: (lotId: string) => void;
}

export const LotSection = ({
  lot,
  convertToBPULines,
  formatCurrency,
  calculateLotTotal,
  handleLineUpdate,
  handleLineDelete,
  handleBulkDelete,
  handleLinePaste,
  handleLoadTemplate,
  handleAddLine,
  handleLinesReorder,
  handleLineSectionChange,
  onCreateSection,
}: LotSectionProps) => {
  const { sections, updateSection, deleteSection } = useQuoteSections(lot.id);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-sm">{lot.label}</CardTitle>
              <CardDescription className="text-xs">{lot.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => handleLoadTemplate(lot.id, lot.code)}
              >
                <FileUp className="h-3 w-3 mr-1" />
                Charger template
              </Button>
              <div className="text-xs font-semibold tabular-nums">
                Total : {formatCurrency(calculateLotTotal(lot.lines, sections))}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm">Lignes de chiffrage</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => onCreateSection(lot.id)}
              >
                <FolderPlus className="h-3 w-3 mr-1" />
                Créer section
              </Button>
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
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <BPUTableWithSections
            lines={convertToBPULines(lot.lines)}
            sections={sections}
            onLineUpdate={handleLineUpdate}
            onLineDelete={handleLineDelete}
            onBulkDelete={handleBulkDelete}
            onLineAdd={handleLinePaste(lot.id)}
            onSectionUpdate={(sectionId, multiplier) => 
              updateSection({ sectionId, updates: { multiplier } })
            }
            onSectionDelete={(sectionId) => deleteSection(sectionId)}
            onLinesReorder={handleLinesReorder}
            onLineSectionChange={handleLineSectionChange}
            lotCode={lot.code}
          />
        </CardContent>
      </Card>
    </>
  );
};
