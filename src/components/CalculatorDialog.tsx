import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Calculator, Plus, Copy, X } from "lucide-react";
import { CalculatorData, TurbineData, AccessSegment } from "@/types/bpu";
import { useCalculatorVariables } from "@/hooks/useCalculatorVariables";
import { cn } from "@/lib/utils";

interface CalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionId: string;
}

interface QuoteSettings {
  id?: string;
  calculator_data?: CalculatorData;
  [key: string]: any;
}

export const CalculatorDialog = ({ open, onOpenChange, versionId }: CalculatorDialogProps) => {
  const queryClient = useQueryClient();
  
  const [calculatorData, setCalculatorData] = useState<CalculatorData>({
    global: { nb_eol: 1, typ_eol: "Vestas" },
    turbines: [],
    access_segments: [],
    design: { diametre_fondation: null },
  });

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
      return data;
    },
    enabled: !!versionId && open,
  });

  // Initialize form when settings are loaded
  useEffect(() => {
    if (settings?.calculator_data) {
      const data = settings.calculator_data as unknown as Partial<CalculatorData>;
      
      // Validate structure before using
      if (data.global && data.turbines && data.access_segments && data.design) {
        setCalculatorData(data as CalculatorData);
      }
      // Otherwise, keep default values initialized in useState
    }
  }, [settings]);

  // Get all available variables
  const { variables } = useCalculatorVariables(calculatorData);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const settingsData = {
        calculator_data: calculatorData as any,
        n_wtg: calculatorData.global.nb_eol,
        n_foundations: calculatorData.global.nb_eol,
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
      toast.success("Calculator enregistré");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement");
    },
  });

  const addTurbine = () => {
    const newName = `E${String(calculatorData.turbines.length + 1).padStart(2, "0")}`;
    const newTurbine: TurbineData = {
      name: newName,
      surf_PF: 0,
      acces_PF: 0,
      m3_bouger: 0,
      bypass: 0,
      fondation_type: "sans eau",
      g2avp: "",
      substitution: 0,
      commentaire: "",
    };
    setCalculatorData({
      ...calculatorData,
      turbines: [...calculatorData.turbines, newTurbine],
      global: { ...calculatorData.global, nb_eol: calculatorData.turbines.length + 1 },
    });
  };

  const removeTurbine = (index: number) => {
    const newTurbines = calculatorData.turbines.filter((_, i) => i !== index);
    setCalculatorData({
      ...calculatorData,
      turbines: newTurbines,
      global: { ...calculatorData.global, nb_eol: newTurbines.length },
    });
  };

  const updateTurbine = (index: number, field: keyof TurbineData, value: any) => {
    const newTurbines = [...calculatorData.turbines];
    newTurbines[index] = { ...newTurbines[index], [field]: value };
    setCalculatorData({ ...calculatorData, turbines: newTurbines });
  };

  const addAccessSegment = () => {
    const newSegment: AccessSegment = {
      name: `Tronçon ${calculatorData.access_segments.length + 1}`,
      longueur: 0,
      surface: 0,
      renforcement: "refresh",
      gnt: false,
      bicouche: 0,
      enrobe: 0,
    };
    setCalculatorData({
      ...calculatorData,
      access_segments: [...calculatorData.access_segments, newSegment],
    });
  };

  const removeAccessSegment = (index: number) => {
    const newSegments = calculatorData.access_segments.filter((_, i) => i !== index);
    setCalculatorData({ ...calculatorData, access_segments: newSegments });
  };

  const updateAccessSegment = (index: number, field: keyof AccessSegment, value: any) => {
    const newSegments = [...calculatorData.access_segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    setCalculatorData({ ...calculatorData, access_segments: newSegments });
  };

  // Calculate totals
  const turbineTotals = {
    surf_PF: calculatorData.turbines.reduce((sum, t) => sum + t.surf_PF, 0),
    acces_PF: calculatorData.turbines.reduce((sum, t) => sum + t.acces_PF, 0),
    m3_bouger: calculatorData.turbines.reduce((sum, t) => sum + t.m3_bouger, 0),
    bypass: calculatorData.turbines.reduce((sum, t) => sum + t.bypass, 0),
  };

  const accessTotals = {
    longueur: calculatorData.access_segments.reduce((sum, s) => sum + s.longueur, 0),
    surface: calculatorData.access_segments.reduce((sum, s) => sum + s.surface, 0),
    bicouche: calculatorData.access_segments.reduce((sum, s) => sum + s.bicouche, 0),
    enrobe: calculatorData.access_segments.reduce((sum, s) => sum + s.enrobe, 0),
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${text} copié`);
  };

  const handleSave = () => {
    if (calculatorData.turbines.length === 0) {
      toast.error("Ajoutez au moins une éolienne");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculator - Variables du projet
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Chargement...</div>
        ) : (
          <div className="flex gap-4 h-full">
            {/* Main content - Vertical table layout */}
            <div className="flex-1">
              <ScrollArea className="h-[70vh]">
                <div className="space-y-6">
                  {/* Global Section */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Paramètres globaux</h3>
                    <div className="flex gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs min-w-[140px]">Nombre d'éoliennes</Label>
                        <Input
                          type="number"
                          value={calculatorData.global.nb_eol}
                          className="w-20"
                          onChange={(e) =>
                            setCalculatorData({
                              ...calculatorData,
                              global: { ...calculatorData.global, nb_eol: parseInt(e.target.value) || 0 },
                            })
                          }
                        />
                        <span className="text-xs text-muted-foreground">nb_eol</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs min-w-[100px]">Type plateforme</Label>
                        <Input
                          value={calculatorData.global.typ_eol}
                          className="w-32"
                          onChange={(e) =>
                            setCalculatorData({
                              ...calculatorData,
                              global: { ...calculatorData.global, typ_eol: e.target.value },
                            })
                          }
                        />
                        <span className="text-xs text-muted-foreground">Typ_Eol</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Turbines Section - Vertical Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Éoliennes</h3>
                      <Button onClick={addTurbine} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="border p-2 text-left text-xs font-medium min-w-[180px]">Paramètre</th>
                            <th className="border p-2 text-left text-xs font-medium">Unité</th>
                            {calculatorData.turbines.map((turbine, idx) => (
                              <th key={idx} className="border p-2 text-center min-w-[100px]">
                                <div className="flex items-center justify-between gap-1">
                                  <Input
                                    value={turbine.name}
                                    onChange={(e) => updateTurbine(idx, "name", e.target.value)}
                                    className="h-7 text-xs font-semibold text-center border-0 bg-transparent p-0"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTurbine(idx)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </th>
                            ))}
                            <th className="border p-2 text-center text-xs font-semibold bg-primary/10">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border p-2 text-xs">Plateforme + pan coupé</td>
                            <td className="border p-2 text-xs text-muted-foreground">m²</td>
                            {calculatorData.turbines.map((turbine, idx) => (
                              <td key={idx} className="border p-1">
                                <Input
                                  type="number"
                                  value={turbine.surf_PF}
                                  onChange={(e) => updateTurbine(idx, "surf_PF", parseFloat(e.target.value) || 0)}
                                  className="h-7 text-xs text-center"
                                />
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center font-semibold bg-primary/5">
                              {turbineTotals.surf_PF}
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-xs">Accès PF</td>
                            <td className="border p-2 text-xs text-muted-foreground">m²</td>
                            {calculatorData.turbines.map((turbine, idx) => (
                              <td key={idx} className="border p-1">
                                <Input
                                  type="number"
                                  value={turbine.acces_PF}
                                  onChange={(e) => updateTurbine(idx, "acces_PF", parseFloat(e.target.value) || 0)}
                                  className="h-7 text-xs text-center"
                                />
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center font-semibold bg-primary/5">
                              {turbineTotals.acces_PF}
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-xs">m³ à bouger</td>
                            <td className="border p-2 text-xs text-muted-foreground">m³</td>
                            {calculatorData.turbines.map((turbine, idx) => (
                              <td key={idx} className="border p-1">
                                <Input
                                  type="number"
                                  value={turbine.m3_bouger}
                                  onChange={(e) => updateTurbine(idx, "m3_bouger", parseFloat(e.target.value) || 0)}
                                  className="h-7 text-xs text-center"
                                />
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center font-semibold bg-primary/5">
                              {turbineTotals.m3_bouger}
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-xs">Bypass</td>
                            <td className="border p-2 text-xs text-muted-foreground">m²</td>
                            {calculatorData.turbines.map((turbine, idx) => (
                              <td key={idx} className="border p-1">
                                <Input
                                  type="number"
                                  value={turbine.bypass}
                                  onChange={(e) => updateTurbine(idx, "bypass", parseFloat(e.target.value) || 0)}
                                  className="h-7 text-xs text-center"
                                />
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center font-semibold bg-primary/5">
                              {turbineTotals.bypass}
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-xs">Fondation</td>
                            <td className="border p-2 text-xs text-muted-foreground"></td>
                            {calculatorData.turbines.map((turbine, idx) => (
                              <td key={idx} className="border p-1">
                                <Select
                                  value={turbine.fondation_type}
                                  onValueChange={(value) => updateTurbine(idx, "fondation_type", value)}
                                >
                                  <SelectTrigger className="h-7 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="en eau">En eau</SelectItem>
                                    <SelectItem value="sans eau">Sans eau</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center bg-primary/5"></td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-xs">G2AVP</td>
                            <td className="border p-2 text-xs text-muted-foreground"></td>
                            {calculatorData.turbines.map((turbine, idx) => (
                              <td key={idx} className="border p-1">
                                <Input
                                  value={turbine.g2avp}
                                  onChange={(e) => updateTurbine(idx, "g2avp", e.target.value)}
                                  className="h-7 text-xs text-center"
                                />
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center bg-primary/5"></td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-xs">Substitution</td>
                            <td className="border p-2 text-xs text-muted-foreground">m</td>
                            {calculatorData.turbines.map((turbine, idx) => (
                              <td key={idx} className="border p-1">
                                <Input
                                  type="number"
                                  value={turbine.substitution}
                                  onChange={(e) => updateTurbine(idx, "substitution", parseFloat(e.target.value) || 0)}
                                  className="h-7 text-xs text-center"
                                />
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center bg-primary/5"></td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-xs">Commentaire</td>
                            <td className="border p-2 text-xs text-muted-foreground"></td>
                            {calculatorData.turbines.map((turbine, idx) => (
                              <td key={idx} className="border p-1">
                                <Input
                                  value={turbine.commentaire}
                                  onChange={(e) => updateTurbine(idx, "commentaire", e.target.value)}
                                  className="h-7 text-xs"
                                />
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center bg-primary/5"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <Separator />

                  {/* Access Segments Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Accès</h3>
                      <Button onClick={addAccessSegment} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter tronçon
                      </Button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="border p-2 text-left text-xs font-medium min-w-[180px]">Tronçon</th>
                            <th className="border p-2 text-left text-xs font-medium">Unité</th>
                            {calculatorData.access_segments.map((segment, idx) => (
                              <th key={idx} className="border p-2 text-center min-w-[120px]">
                                <div className="flex items-center justify-between gap-1">
                                  <Input
                                    value={segment.name}
                                    onChange={(e) => updateAccessSegment(idx, "name", e.target.value)}
                                    className="h-7 text-xs font-semibold text-center border-0 bg-transparent p-0"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeAccessSegment(idx)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </th>
                            ))}
                            <th className="border p-2 text-center text-xs font-semibold bg-primary/10">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border p-2 text-xs">Longueur chemin</td>
                            <td className="border p-2 text-xs text-muted-foreground">ml</td>
                            {calculatorData.access_segments.map((segment, idx) => (
                              <td key={idx} className="border p-1">
                                <Input
                                  type="number"
                                  value={segment.longueur}
                                  onChange={(e) => updateAccessSegment(idx, "longueur", parseFloat(e.target.value) || 0)}
                                  className="h-7 text-xs text-center"
                                />
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center font-semibold bg-primary/5">
                              {accessTotals.longueur}
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-xs">Surface (5ml)</td>
                            <td className="border p-2 text-xs text-muted-foreground">m²</td>
                            {calculatorData.access_segments.map((segment, idx) => (
                              <td key={idx} className="border p-1">
                                <Input
                                  type="number"
                                  value={segment.surface}
                                  onChange={(e) => updateAccessSegment(idx, "surface", parseFloat(e.target.value) || 0)}
                                  className="h-7 text-xs text-center"
                                />
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center font-semibold bg-primary/5">
                              {accessTotals.surface}
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-xs">GNT</td>
                            <td className="border p-2 text-xs text-muted-foreground">binaire</td>
                            {calculatorData.access_segments.map((segment, idx) => (
                              <td key={idx} className="border p-1 text-center">
                                <input
                                  type="checkbox"
                                  checked={segment.gnt}
                                  onChange={(e) => updateAccessSegment(idx, "gnt", e.target.checked)}
                                  className="h-4 w-4"
                                />
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center bg-primary/5"></td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-xs">Bicouche</td>
                            <td className="border p-2 text-xs text-muted-foreground">m²</td>
                            {calculatorData.access_segments.map((segment, idx) => (
                              <td key={idx} className="border p-1">
                                <Input
                                  type="number"
                                  value={segment.bicouche}
                                  onChange={(e) => updateAccessSegment(idx, "bicouche", parseFloat(e.target.value) || 0)}
                                  className="h-7 text-xs text-center"
                                />
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center font-semibold bg-primary/5">
                              {accessTotals.bicouche}
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-xs">Enrobé</td>
                            <td className="border p-2 text-xs text-muted-foreground">m²</td>
                            {calculatorData.access_segments.map((segment, idx) => (
                              <td key={idx} className="border p-1">
                                <Input
                                  type="number"
                                  value={segment.enrobe}
                                  onChange={(e) => updateAccessSegment(idx, "enrobe", parseFloat(e.target.value) || 0)}
                                  className="h-7 text-xs text-center"
                                />
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center font-semibold bg-primary/5">
                              {accessTotals.enrobe}
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-xs">Renforcement</td>
                            <td className="border p-2 text-xs text-muted-foreground"></td>
                            {calculatorData.access_segments.map((segment, idx) => (
                              <td key={idx} className="border p-1">
                                <Select
                                  value={segment.renforcement}
                                  onValueChange={(value) => updateAccessSegment(idx, "renforcement", value)}
                                >
                                  <SelectTrigger className="h-7 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="refresh">Refresh</SelectItem>
                                    <SelectItem value="traitement">Traitement</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center bg-primary/5"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <Separator />

                  {/* Design Section */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Design</h3>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs min-w-[140px]">Diamètre fondation</Label>
                      <Input
                        type="number"
                        value={calculatorData.design.diametre_fondation || ""}
                        className="w-24"
                        onChange={(e) =>
                          setCalculatorData({
                            ...calculatorData,
                            design: {
                              ...calculatorData.design,
                              diametre_fondation: parseFloat(e.target.value) || null,
                            },
                          })
                        }
                      />
                      <span className="text-xs text-muted-foreground">m</span>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </div>

            {/* Variables sidebar */}
            <div className="w-80 border-l pl-4">
              <h3 className="text-sm font-semibold mb-3">Variables disponibles</h3>
              <ScrollArea className="h-[70vh]">
                <div className="space-y-2">
                  {Object.entries(
                    variables.reduce((acc, v) => {
                      if (!acc[v.category]) acc[v.category] = [];
                      acc[v.category].push(v);
                      return acc;
                    }, {} as Record<string, typeof variables>)
                  ).map(([category, vars]) => (
                    <div key={category} className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">{category}</p>
                      {vars.map((v) => (
                        <div
                          key={v.name}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono text-orange-500 truncate">{v.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{v.label}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{v.value}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                              onClick={() => copyToClipboard(v.name)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
