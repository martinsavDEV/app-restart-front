import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalculatorDialog } from "./CalculatorDialog";

interface QuoteSummaryCardProps {
  versionId: string;
  projectName?: string;
  nWtg?: number;
  onSettingsUpdate?: () => void;
}

const DOCUMENT_CATEGORIES = ["Plan", "Etude de sol", "Unifilaire", "Road Survey"];

export const QuoteSummaryCard = ({ versionId, projectName, nWtg, onSettingsUpdate }: QuoteSummaryCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [formData, setFormData] = useState({ label: "", reference: "", comment: "" });
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch quote version details
  const { data: versionDetails } = useQuery({
    queryKey: ["quote-version-details", versionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_versions")
        .select("*")
        .eq("id", versionId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!versionId,
  });

  // Fetch reference documents
  const { data: documents } = useQuery({
    queryKey: ["reference-documents", versionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reference_documents")
        .select("*")
        .eq("version_id", versionId)
        .order("label");
      if (error) throw error;
      return data;
    },
    enabled: !!versionId,
  });

  // Create/Update document mutation
  const saveDocumentMutation = useMutation({
    mutationFn: async (doc: { id?: string; label: string; reference: string; comment: string }) => {
      if (doc.id) {
        const { error } = await supabase
          .from("reference_documents")
          .update({ label: doc.label, reference: doc.reference, comment: doc.comment })
          .eq("id", doc.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("reference_documents")
          .insert({ version_id: versionId, label: doc.label, reference: doc.reference, comment: doc.comment });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reference-documents", versionId] });
      toast.success(editingDoc ? "Document mis à jour" : "Document ajouté");
      setDialogOpen(false);
      setEditingDoc(null);
      setFormData({ label: "", reference: "", comment: "" });
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement");
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase.from("reference_documents").delete().eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reference-documents", versionId] });
      toast.success("Document supprimé");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const handleOpenDialog = (doc?: any) => {
    if (doc) {
      setEditingDoc(doc);
      setFormData({ label: doc.label, reference: doc.reference || "", comment: doc.comment || "" });
    } else {
      setEditingDoc(null);
      setFormData({ label: "", reference: "", comment: "" });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.label) {
      toast.error("Le type de document est requis");
      return;
    }
    saveDocumentMutation.mutate({
      id: editingDoc?.id,
      ...formData,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Résumé du chiffrage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Two-column layout */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column: Project Info */}
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Projet</p>
              <p className="font-medium">{projectName || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Nombre d'éoliennes</p>
              <p className="font-medium">{nWtg || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Version</p>
              <p className="font-medium">{versionDetails?.version_label || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Dernière modification</p>
              <p className="font-medium">
                {versionDetails?.last_update
                  ? format(new Date(versionDetails.last_update), "dd/MM/yyyy HH:mm", { locale: fr })
                  : "—"}
              </p>
            </div>
          </div>

          {/* Right Column: Reference Documents */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">Documents de référence</p>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-6 text-[11px]" onClick={() => handleOpenDialog()}>
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingDoc ? "Modifier le document" : "Ajouter un document"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Type de document</Label>
                      <Select value={formData.label} onValueChange={(value) => setFormData({ ...formData, label: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Référence</Label>
                      <Input
                        value={formData.reference}
                        onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                        placeholder="Ex: REF-2024-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Commentaire</Label>
                      <Input
                        value={formData.comment}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        placeholder="Informations complémentaires"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleSave}>Enregistrer</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Compact document list */}
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {documents && documents.length > 0 ? (
                documents.map((doc) => (
                  <div key={doc.id} className="flex items-start justify-between p-1.5 rounded border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium truncate">
                        {doc.label}: {doc.reference || "—"}
                      </p>
                      {doc.comment && <p className="text-[10px] text-muted-foreground italic truncate">{doc.comment}</p>}
                    </div>
                    <div className="flex gap-0.5 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => handleOpenDialog(doc)}
                      >
                        <Pencil className="h-2.5 w-2.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                        onClick={() => deleteDocumentMutation.mutate(doc.id)}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-muted-foreground italic p-2">Aucun document</p>
              )}
            </div>
          </div>
        </div>

        {/* Calculator Button */}
        <div className="pt-3 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setCalculatorOpen(true)}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Ouvrir le Calculator
          </Button>
        </div>

        {/* Calculator Dialog */}
        <CalculatorDialog
          open={calculatorOpen}
          onOpenChange={setCalculatorOpen}
          versionId={versionId}
        />
      </CardContent>
    </Card>
  );
};