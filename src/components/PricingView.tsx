import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BPULine } from "@/types/bpu";
import { toast } from "sonner";
import { useQuotePricing } from "@/hooks/useQuotePricing";
import { TemplateLoaderDialog } from "@/components/TemplateLoaderDialog";
import { QuoteSummaryCard } from "@/components/QuoteSummaryCard";
import { SectionDialog } from "@/components/SectionDialog";
import { LotSection } from "@/components/LotSection";

interface PricingViewProps {
  projectId?: string | null;
  projectName?: string | null;
  versionId?: string | null;
}

export const PricingView = ({ projectId: initialProjectId, projectName: initialProjectName, versionId: initialVersionId }: PricingViewProps) => {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId || null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(initialVersionId || null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedLotForTemplate, setSelectedLotForTemplate] = useState<{ id: string; code: string } | null>(null);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [selectedLotForSection, setSelectedLotForSection] = useState<string | null>(null);

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Fetch versions for selected project
  const { data: versions } = useQuery({
    queryKey: ["quote-versions", selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const { data, error } = await supabase
        .from("quote_versions")
        .select("*")
        .eq("project_id", selectedProjectId);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProjectId,
  });

  // Use the quote pricing hook
  const { lots, isLoading, updateLine, addLine, deleteLine, loadTemplate, updateLinesOrder, updateLineSection } = useQuotePricing(selectedVersionId);

  const selectedProject = projects?.find((p) => p.id === selectedProjectId);
  const projectName = initialProjectName || selectedProject?.name;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const calculateLotTotal = (lines: any[], sections: any[] = []): number => {
    // Group lines by section_id
    const linesBySection = lines.reduce((acc, line) => {
      const sectionId = line.section_id || "no-section";
      if (!acc[sectionId]) acc[sectionId] = [];
      acc[sectionId].push(line);
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate total with multipliers
    let total = 0;
    sections.forEach(section => {
      const sectionLines = linesBySection[section.id] || [];
      const sectionTotal = sectionLines.reduce((sum, line) => 
        sum + (line.quantity || 0) * (line.unit_price || 0), 0
      );
      const multiplier = section.is_multiple ? section.multiplier : 1;
      total += sectionTotal * multiplier;
    });

    // Add lines without section
    const noSectionLines = linesBySection["no-section"] || [];
    total += noSectionLines.reduce((sum, line) => 
      sum + (line.quantity || 0) * (line.unit_price || 0), 0
    );

    return total;
  };

  const handleSectionUpdate = (lotId: string) => (sectionId: string, multiplier: number) => {
    queryClient.invalidateQueries({ queryKey: ["quote-sections", lotId] });
    queryClient.invalidateQueries({ queryKey: ["quote-pricing", selectedVersionId] });
    queryClient.invalidateQueries({ queryKey: ["quote-versions"] });
  };

  const handleCreateSection = (name: string, isMultiple: boolean, multiplier: number) => {
    if (!selectedLotForSection) return;
    
    // This will be handled by the useQuoteSections hook in LotSection
    const createSectionMutation = async () => {
      const { data: existingSections } = await supabase
        .from("quote_sections")
        .select("order_index")
        .eq("lot_id", selectedLotForSection)
        .order("order_index", { ascending: false })
        .limit(1);

      const nextOrderIndex = existingSections && existingSections.length > 0 
        ? existingSections[0].order_index + 1 
        : 0;

      const { error } = await supabase
        .from("quote_sections")
        .insert({
          lot_id: selectedLotForSection,
          name,
          is_multiple: isMultiple,
          multiplier: isMultiple ? multiplier : 1,
          order_index: nextOrderIndex,
        });

      if (error) {
        toast.error("Erreur lors de la création de la section");
        console.error(error);
      } else {
        queryClient.invalidateQueries({ queryKey: ["quote-sections"] });
        toast.success("Section créée");
      }
    };

    createSectionMutation();
  };

  const handleLineUpdate = (lineId: string, updates: Partial<any>) => {
    // Trouver la ligne actuelle pour récupérer sa section
    let currentLine: any = null;
    for (const lot of lots) {
      const found = lot.lines.find((l: any) => l.id === lineId);
      if (found) {
        currentLine = found;
        break;
      }
    }

    // Extraire le préfixe de section existant du comment actuel
    const sectionMatch = currentLine?.comment?.match(/^\[([^\]]+)\]/);
    const sectionPrefix = sectionMatch ? sectionMatch[0] : "";

    // Construire le nouveau comment en préservant la section
    let newComment = updates.priceSource || "";
    if (sectionPrefix && !newComment.startsWith("[")) {
      newComment = `${sectionPrefix} ${newComment}`.trim();
    }

    updateLine({
      lineId,
      updates: {
        designation: updates.designation,
        quantity: updates.quantity,
        unit: updates.unit,
        unit_price: updates.unitPrice,
        comment: newComment,
      },
    });
  };

  const handleLineDelete = (lineId: string) => {
    deleteLine(lineId);
  };

  const handleBulkDelete = (lineIds: string[]) => {
    lineIds.forEach(lineId => deleteLine(lineId));
  };

  const handleLinePaste = (lotId: string) => (line: Omit<any, "id">, sectionId: string | null, afterLineId?: string) => {
    const currentLot = lots.find((l) => l.id === lotId);
    if (!currentLot) return;

    // If afterLineId is provided, find the order_index of that line and insert after it
    let nextOrderIndex = currentLot.lines.length || 0;
    if (afterLineId) {
      const afterLine = currentLot.lines.find((l: any) => l.id === afterLineId);
      if (afterLine) {
        nextOrderIndex = afterLine.order_index + 1;
        // Update order_index for all lines that come after
        const linesToUpdate = currentLot.lines
          .filter((l: any) => l.order_index >= nextOrderIndex)
          .map((l: any) => ({
            id: l.id,
            order_index: l.order_index + 1,
          }));
        
        if (linesToUpdate.length > 0 && updateLinesOrder) {
          updateLinesOrder(linesToUpdate);
        }
      }
    }

    // Create a new line object with section_id
    const newLine: any = {
      designation: line.designation,
      quantity: line.quantity,
      unit: line.unit,
      unit_price: line.unitPrice,
      comment: line.priceSource || "",
      order_index: nextOrderIndex,
    };

    // Add section_id if provided
    if (sectionId) {
      newLine.section_id = sectionId;
    }

    addLine({
      lotId: currentLot.id,
      line: newLine,
    });
  };

  const handleAddLine = (lotId: string) => {
    const currentLot = lots.find((l) => l.id === lotId);
    const nextOrderIndex = currentLot?.lines.length || 0;

    addLine({
      lotId,
      line: {
        designation: "Nouvelle ligne",
        quantity: 0,
        unit: "u",
        unit_price: 0,
        comment: "",
        order_index: nextOrderIndex,
      },
    });
  };

  const handleLineSectionChange = (lineId: string, newSectionId: string | null, newOrderIndex: number) => {
    updateLineSection({
      lineId,
      newSectionId,
      newOrderIndex,
    });
  };

  const handleLoadTemplate = (lotId: string, lotCode: string) => {
    setSelectedLotForTemplate({ id: lotId, code: lotCode });
    setTemplateDialogOpen(true);
  };

  const handleTemplateSelected = (templateSections: any[]) => {
    if (selectedLotForTemplate) {
      loadTemplate({
        lotId: selectedLotForTemplate.id,
        templateSections,
      });
    }
  };

  // Convert lot lines to BPULine format with section_id
  const convertToBPULines = (lines: any[]): (BPULine & { section_id?: string | null })[] => {
    return lines.map((line) => {
      return {
        id: line.id,
        designation: line.designation,
        quantity: line.quantity || 0,
        unit: line.unit,
        unitPrice: line.unit_price || 0,
        priceSource: line.comment || "",
        section_id: line.section_id,
      };
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {/* Quote Summary Card */}
      {selectedVersionId && (
        <QuoteSummaryCard 
          versionId={selectedVersionId} 
          projectName={projectName} 
          nWtg={selectedProject?.n_wtg}
          onSettingsUpdate={() => {
            // Refresh quote settings and lots when foundations count changes
          }}
        />
      )}

      {/* Project and Version Selectors */}
      {!initialProjectId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sélection</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <div className="flex-1">
              <Select value={selectedProjectId || ""} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select
                value={selectedVersionId || ""}
                onValueChange={setSelectedVersionId}
                disabled={!selectedProjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une version" />
                </SelectTrigger>
                <SelectContent>
                  {versions?.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      {version.version_label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {selectedVersionId && lots.length > 0 ? (
        <Tabs defaultValue={lots[0]?.id} className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-lg font-semibold">Chiffrage projet</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {projectName ? `BPU par lots pour ${projectName}` : "BPU par lots"}
              </p>
            </div>
            <TabsList className="w-full lg:w-auto flex-wrap justify-start">
              {lots.map((lot) => (
                <TabsTrigger key={lot.id} value={lot.id} className="text-xs">
                  {lot.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="space-y-3">
            {lots.map((lot) => (
              <TabsContent key={lot.id} value={lot.id} className="space-y-3">
                <LotSection
                  lot={lot}
                  convertToBPULines={convertToBPULines}
                  formatCurrency={formatCurrency}
                  calculateLotTotal={calculateLotTotal}
                  handleLineUpdate={handleLineUpdate}
                  handleLineDelete={handleLineDelete}
                  handleBulkDelete={handleBulkDelete}
                  handleLinePaste={handleLinePaste}
                  handleLoadTemplate={handleLoadTemplate}
                  handleAddLine={handleAddLine}
                  handleLinesReorder={updateLinesOrder}
                  handleLineSectionChange={handleLineSectionChange}
                  onCreateSection={(lotId) => {
                    setSelectedLotForSection(lotId);
                    setSectionDialogOpen(true);
                  }}
                />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {selectedProjectId
                ? "Sélectionnez une version de chiffrage"
                : "Sélectionnez un projet et une version"}
            </p>
          </CardContent>
        </Card>
      )}

      <TemplateLoaderDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        lotCode={selectedLotForTemplate?.code}
        onLoadTemplate={handleTemplateSelected}
      />

      <SectionDialog
        open={sectionDialogOpen}
        onOpenChange={setSectionDialogOpen}
        onConfirm={handleCreateSection}
      />
    </div>
  );
};
