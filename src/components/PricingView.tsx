import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BPUTableWithSections } from "@/components/BPUTableWithSections";
import { BPULine } from "@/types/bpu";
import { toast } from "sonner";
import { Plus, FileUp } from "lucide-react";
import { useQuotePricing } from "@/hooks/useQuotePricing";
import { TemplateLoaderDialog } from "@/components/TemplateLoaderDialog";
import { QuoteSummaryCard } from "@/components/QuoteSummaryCard";

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
  const { lots, isLoading, updateLine, addLine, deleteLine, loadTemplate } = useQuotePricing(selectedVersionId);

  // Fetch quote settings for foundations multiplier
  const { data: quoteSettings } = useQuery({
    queryKey: ["quote-settings", selectedVersionId],
    queryFn: async () => {
      if (!selectedVersionId) return null;
      const { data, error } = await supabase
        .from("quote_settings")
        .select("*")
        .eq("quote_version_id", selectedVersionId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedVersionId,
  });

  const selectedProject = projects?.find((p) => p.id === selectedProjectId);
  const projectName = initialProjectName || selectedProject?.name;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const calculateLotTotal = (lines: any[]): number => {
    return lines.reduce((sum, line) => sum + (line.quantity || 0) * (line.unit_price || 0), 0);
  };

  // Mutation to update foundations count
  const updateFoundationsMutation = useMutation({
    mutationFn: async (nFoundations: number) => {
      if (!selectedVersionId) return;
      
      const { data: existing } = await supabase
        .from("quote_settings")
        .select("id")
        .eq("quote_version_id", selectedVersionId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("quote_settings")
          .update({ n_foundations: nFoundations })
          .eq("quote_version_id", selectedVersionId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("quote_settings")
          .insert({
            quote_version_id: selectedVersionId,
            n_foundations: nFoundations,
            n_wtg: selectedProject?.n_wtg || 1,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-settings", selectedVersionId] });
      toast.success("Nombre de fondations mis à jour");
    },
  });

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

  const handleLinePaste = (lotId: string) => (line: Omit<any, "id">, sectionName: string) => {
    const currentLot = lots.find((l) => l.id === lotId);
    if (!currentLot) return;

    const nextOrderIndex = currentLot.lines.length || 0;

    addLine({
      lotId: currentLot.id,
      line: {
        designation: line.designation,
        quantity: line.quantity,
        unit: line.unit,
        unit_price: line.unitPrice,
        comment: sectionName !== "Sans section" ? `[${sectionName}] ${line.priceSource || ""}` : line.priceSource || "",
        order_index: nextOrderIndex,
      },
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

  // Convert lot lines to BPULine format with section extraction
  const convertToBPULines = (lines: any[]): (BPULine & { section?: string })[] => {
    return lines.map((line) => {
      // Extract section from comment (format: "[Section Name] comment")
      const sectionMatch = line.comment?.match(/^\[([^\]]+)\]/);
      const section = sectionMatch ? sectionMatch[1] : undefined;
      const priceSource = sectionMatch 
        ? line.comment.replace(/^\[[^\]]+\]\s*/, "")
        : line.comment || "";
      
      return {
        id: line.id,
        designation: line.designation,
        quantity: line.quantity || 0,
        unit: line.unit,
        unitPrice: line.unit_price || 0,
        priceSource,
        section,
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
                          Total : {formatCurrency(calculateLotTotal(lot.lines))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-sm">Lignes de chiffrage</CardTitle>
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
                  <CardContent className="space-y-3">
                    <BPUTableWithSections
                      lines={convertToBPULines(lot.lines)}
                      onLineUpdate={handleLineUpdate}
                      onLineDelete={handleLineDelete}
                      onBulkDelete={handleBulkDelete}
                      onLineAdd={handleLinePaste(lot.id)}
                      lotCode={lot.code}
                      nFoundations={quoteSettings?.n_foundations || 1}
                      onNFoundationsChange={(n) => updateFoundationsMutation.mutate(n)}
                    />
                  </CardContent>
                </Card>
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
    </div>
  );
};
