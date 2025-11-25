import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LinkedCell } from "./LinkedCell";
import { toast } from "sonner";
import { Calculator } from "lucide-react";

interface CalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionId: string;
}

interface QuoteSettings {
  id?: string;
  n_wtg: number;
  hub_height?: number | null;
  turbine_model?: string | null;
  turbine_power?: number | null;
  n_foundations: number;
}

export const CalculatorDialog = ({ open, onOpenChange, versionId }: CalculatorDialogProps) => {
  const queryClient = useQueryClient();
  
  const [nWtg, setNWtg] = useState<number>(1);
  const [hubHeight, setHubHeight] = useState<number | undefined>();
  const [turbineModel, setTurbineModel] = useState<string>("");
  const [turbinePower, setTurbinePower] = useState<number | undefined>();

  // Fetch quote settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["quote-settings", versionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_settings")
        .select("*")
        .eq("quote_version_id", versionId)
        .maybeSingle();
      if (error) throw error;
      return data as QuoteSettings | null;
    },
    enabled: !!versionId && open,
  });

  // Initialize form when settings are loaded
  useEffect(() => {
    if (settings) {
      setNWtg(settings.n_wtg || 1);
      setHubHeight(settings.hub_height || undefined);
      setTurbineModel(settings.turbine_model || "");
      setTurbinePower(settings.turbine_power || undefined);
    }
  }, [settings]);

  // Calculated values (automatically derived)
  const nFoundations = nWtg; // For now, same as n_wtg

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const settingsData = {
        n_wtg: nWtg,
        hub_height: hubHeight || null,
        turbine_model: turbineModel || null,
        turbine_power: turbinePower || null,
        n_foundations: nFoundations,
      };

      if (settings?.id) {
        const { error } = await supabase
          .from("quote_settings")
          .update(settingsData)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("quote_settings")
          .insert({
            ...settingsData,
            quote_version_id: versionId,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-settings"] });
      queryClient.invalidateQueries({ queryKey: ["quote-sections"] });
      toast.success("Paramètres enregistrés");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement");
    },
  });

  const handleSave = () => {
    if (nWtg < 1) {
      toast.error("Le nombre d'éoliennes doit être au moins 1");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculator - Paramètres du projet
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Chargement...</div>
        ) : (
          <div className="space-y-6">
            {/* Input Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary">Données d'entrée</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Nombre d'éoliennes</Label>
                  <LinkedCell
                    value={nWtg}
                    isInput={true}
                    type="number"
                    min={1}
                    onChange={(val) => setNWtg(parseInt(val) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Hauteur de moyeu (m)</Label>
                  <LinkedCell
                    value={hubHeight || ""}
                    isInput={true}
                    type="number"
                    min={0}
                    onChange={(val) => setHubHeight(val ? parseFloat(val) : undefined)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Modèle de turbine</Label>
                  <LinkedCell
                    value={turbineModel}
                    isInput={true}
                    type="text"
                    onChange={(val) => setTurbineModel(val)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Puissance turbine (MW)</Label>
                  <LinkedCell
                    value={turbinePower || ""}
                    isInput={true}
                    type="number"
                    min={0}
                    onChange={(val) => setTurbinePower(val ? parseFloat(val) : undefined)}
                  />
                </div>
              </div>
            </div>

            {/* Calculated Output Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-primary">Quantités calculées</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Nombre de fondations</Label>
                  <LinkedCell
                    value={nFoundations}
                    isLinked={true}
                    disabled={true}
                  />
                  <p className="text-[10px] text-muted-foreground italic">Lié au nombre d'éoliennes</p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-muted/30 p-3 rounded-md space-y-1">
              <p className="text-xs font-medium">Légende des couleurs:</p>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-50 dark:bg-amber-950/30 border rounded"></div>
                  <span>Fond jaune pâle = Données à saisir</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-muted border rounded"></div>
                  <span className="text-orange-500">Fond gris + texte orange + 🔗 = Valeur calculée automatiquement</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};