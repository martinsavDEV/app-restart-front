import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileUp, FolderPlus, MessageSquare } from "lucide-react";
import { BPUTableWithSections } from "@/components/BPUTableWithSections";
import { useQuoteSections } from "@/hooks/useQuoteSections";
import { BPULine } from "@/types/bpu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LotSectionProps {
  lot: any;
  convertToBPULines: (lines: any[]) => (BPULine & { section_id?: string | null; lot_id?: string })[];
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
  const queryClient = useQueryClient();
  const [headerComment, setHeaderComment] = useState(lot.header_comment || "");
  const [isEditingComment, setIsEditingComment] = useState(false);

  // Mutation to update lot header comment
  const updateLotCommentMutation = useMutation({
    mutationFn: async (comment: string) => {
      const { error } = await supabase
        .from("lots")
        .update({ header_comment: comment || null })
        .eq("id", lot.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-pricing"] });
      toast.success("Commentaire du lot mis à jour");
      setIsEditingComment(false);
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const handleSaveComment = () => {
    updateLotCommentMutation.mutate(headerComment);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-sm">{lot.label}</CardTitle>
              <CardDescription className="text-xs">{lot.description}</CardDescription>
              
              {/* Header Comment Section */}
              <div className="mt-2">
                {isEditingComment ? (
                  <div className="space-y-2">
                    <Textarea
                      value={headerComment}
                      onChange={(e) => setHeaderComment(e.target.value)}
                      placeholder="Commentaire du lot (ex: non chiffré, forfait turbinier, chiffré ailleurs...)"
                      className="text-xs min-h-[60px] resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[11px]"
                        onClick={() => {
                          setHeaderComment(lot.header_comment || "");
                          setIsEditingComment(false);
                        }}
                      >
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        className="h-6 text-[11px]"
                        onClick={handleSaveComment}
                        disabled={updateLotCommentMutation.isPending}
                      >
                        Enregistrer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingComment(true)}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1 group"
                  >
                    <MessageSquare className="h-3 w-3" />
                    {lot.header_comment ? (
                      <span className="italic">{lot.header_comment}</span>
                    ) : (
                      <span className="opacity-60 group-hover:opacity-100">
                        Ajouter un commentaire au lot...
                      </span>
                    )}
                  </button>
                )}
              </div>
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
