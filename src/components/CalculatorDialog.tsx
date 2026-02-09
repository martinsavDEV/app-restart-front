import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Calculator, Plus, Copy, X, Zap } from "lucide-react";
import { CalculatorData, TurbineData, AccessSegment, HTACableSegment } from "@/types/bpu";
import { useCalculatorVariables } from "@/hooks/useCalculatorVariables";
import { FoundationDiagram } from "@/components/FoundationDiagram";
import { calculateFoundationMetrics, calculateSubstitutionVolume, formatNumber } from "@/lib/foundationCalculations";
import { cn } from "@/lib/utils";
import { parseLocaleNumber } from "@/lib/numpadDecimal";

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
    hta_cables: [],
    design: {
      diametre_fondation: null,
      marge_securite: 1.0,
      pente_talus: "1:1",
      hauteur_cage: 3.5,
    },
  });

  // Custom margin/slope input mode
  const [customMargin, setCustomMargin] = useState(false);
  const [customSlope, setCustomSlope] = useState(false);

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
        setCalculatorData({
          ...data,
          hta_cables: data.hta_cables || [],
          design: {
            diametre_fondation: data.design.diametre_fondation ?? null,
            marge_securite: data.design.marge_securite ?? 1.0,
            pente_talus: data.design.pente_talus ?? "1:1",
            hauteur_cage: data.design.hauteur_cage ?? 3.5,
          },
        } as CalculatorData);

        // Check if custom margin/slope values are used
        const marge = data.design.marge_securite;
        if (marge !== undefined && marge !== 1.0 && marge !== 1.5) {
          setCustomMargin(true);
        }
        const pente = data.design.pente_talus;
        if (pente !== undefined && pente !== "1:1" && pente !== "3:2") {
          setCustomSlope(true);
        }
      }
      // Otherwise, keep default values initialized in useState
    }
  }, [settings]);

  // Calculate foundation metrics
  const foundationMetrics = useMemo(() => {
    return calculateFoundationMetrics(
      calculatorData.design.diametre_fondation,
      calculatorData.design.marge_securite,
      calculatorData.design.pente_talus,
      calculatorData.design.hauteur_cage
    );
  }, [calculatorData.design]);

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
      queryClient.invalidateQueries({ queryKey: ["quote-pricing"] });
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

  const addHTACable = () => {
    const newCable: HTACableSegment = {
      name: `Tronçon ${calculatorData.hta_cables.length + 1}`,
      alu_95: 0,
      alu_150: 0,
      alu_240: 0,
      alu_400: 0,
      cu_95: 0,
      cu_150: 0,
      cu_240: 0,
    };
    setCalculatorData({
      ...calculatorData,
      hta_cables: [...calculatorData.hta_cables, newCable],
    });
  };

  const removeHTACable = (index: number) => {
    const newCables = calculatorData.hta_cables.filter((_, i) => i !== index);
    setCalculatorData({ ...calculatorData, hta_cables: newCables });
  };

  const updateHTACable = (index: number, field: keyof HTACableSegment, value: any) => {
    const newCables = [...calculatorData.hta_cables];
    newCables[index] = { ...newCables[index], [field]: value };
    setCalculatorData({ ...calculatorData, hta_cables: newCables });
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

  const htaTotals = {
    alu_95: calculatorData.hta_cables.reduce((sum, c) => sum + c.alu_95, 0),
    alu_150: calculatorData.hta_cables.reduce((sum, c) => sum + c.alu_150, 0),
    alu_240: calculatorData.hta_cables.reduce((sum, c) => sum + c.alu_240, 0),
    alu_400: calculatorData.hta_cables.reduce((sum, c) => sum + c.alu_400, 0),
    cu_95: calculatorData.hta_cables.reduce((sum, c) => sum + c.cu_95, 0),
    cu_150: calculatorData.hta_cables.reduce((sum, c) => sum + c.cu_150, 0),
    cu_240: calculatorData.hta_cables.reduce((sum, c) => sum + c.cu_240, 0),
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
                    <h3 className="text-sm font-bold text-primary">Paramètres globaux</h3>
                    <div className="flex gap-4 items-center bg-muted/30 p-3 rounded-md">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs min-w-[140px] font-medium">Nombre d'éoliennes</Label>
                        <Input
                          type="number"
                          value={calculatorData.global.nb_eol}
                          className="w-20 font-semibold"
                          onChange={(e) =>
                            setCalculatorData({
                              ...calculatorData,
                              global: { ...calculatorData.global, nb_eol: parseInt(e.target.value) || 0 },
                            })
                          }
                        />
                        <span className="text-xs text-muted-foreground font-mono">nb_eol</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs min-w-[100px] font-medium">Type plateforme</Label>
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
                        <span className="text-xs text-muted-foreground font-mono">Typ_Eol</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Turbines Section - Vertical Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-primary">Éoliennes</h3>
                      <Button onClick={addTurbine} size="sm" variant="outline" className="font-semibold">
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-primary/10">
                            <th className="border p-2 text-left text-xs font-bold min-w-[180px]">Paramètre</th>
                            <th className="border p-2 text-left text-xs font-bold">Unité</th>
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
                            <th className="border p-2 text-center text-xs font-bold bg-primary/20">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border p-2 text-xs">Plateforme + pan coupé</td>
                            <td className="border p-2 text-xs text-muted-foreground">m²</td>
                            {calculatorData.turbines.map((turbine, idx) => (
                              <td key={idx} className="border p-1">
                                <NumericInput
                                  value={turbine.surf_PF}
                                  onValueChange={(val) => updateTurbine(idx, "surf_PF", val)}
                                  className="h-7 text-xs text-center"
                                  title={`Variable: $surf_PF_${turbine.name}`}
                                />
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center font-semibold bg-primary/5" title="Variable: $sum_surf_PF">
                              {turbineTotals.surf_PF}
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-xs">Accès PF</td>
                            <td className="border p-2 text-xs text-muted-foreground">m²</td>
                            {calculatorData.turbines.map((turbine, idx) => (
                              <td key={idx} className="border p-1">
                                <NumericInput
                                  value={turbine.acces_PF}
                                  onValueChange={(val) => updateTurbine(idx, "acces_PF", val)}
                                  className="h-7 text-xs text-center"
                                  title={`Variable: $acces_PF_${turbine.name}`}
                                />
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center font-semibold bg-primary/5" title="Variable: $sum_acces_PF">
                              {turbineTotals.acces_PF}
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-xs">m³ à bouger</td>
                            <td className="border p-2 text-xs text-muted-foreground">m³</td>
                            {calculatorData.turbines.map((turbine, idx) => (
                              <td key={idx} className="border p-1">
                                <NumericInput
                                  value={turbine.m3_bouger}
                                  onValueChange={(val) => updateTurbine(idx, "m3_bouger", val)}
                                  className="h-7 text-xs text-center"
                                  title={`Variable: $m3_bouger_${turbine.name}`}
                                />
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center font-semibold bg-primary/5" title="Variable: $sum_m3_bouger">
                              {turbineTotals.m3_bouger}
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-xs">Bypass</td>
                            <td className="border p-2 text-xs text-muted-foreground">m²</td>
                            {calculatorData.turbines.map((turbine, idx) => (
                              <td key={idx} className="border p-1">
                                <NumericInput
                                  value={turbine.bypass}
                                  onValueChange={(val) => updateTurbine(idx, "bypass", val)}
                                  className="h-7 text-xs text-center"
                                  title={`Variable: $bypass_${turbine.name}`}
                                />
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center font-semibold bg-primary/5" title="Variable: $sum_bypass">
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
                                <NumericInput
                                  value={turbine.substitution}
                                  onValueChange={(val) => updateTurbine(idx, "substitution", val)}
                                  className="h-7 text-xs text-center"
                                  title={`Variable: $vol_sub_${turbine.name} (volume calculé)`}
                                />
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center bg-primary/5"></td>
                          </tr>
                          {/* Volume substitution - calculated row */}
                          {foundationMetrics && (
                            <tr className="bg-emerald-50 dark:bg-emerald-900/10">
                              <td className="border p-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                Vol. substitution
                              </td>
                              <td className="border p-2 text-xs text-muted-foreground">m³</td>
                              {calculatorData.turbines.map((turbine, idx) => {
                                const volSub = calculateSubstitutionVolume(
                                  foundationMetrics.surfaceFondFouille,
                                  turbine.substitution
                                );
                                return (
                                  <td
                                    key={idx}
                                    className="border p-2 text-xs text-center font-mono text-emerald-700 dark:text-emerald-400"
                                  >
                                    {turbine.substitution > 0 ? formatNumber(volSub, 0) : "-"}
                                  </td>
                                );
                              })}
                              <td className="border p-2 text-xs text-center font-bold bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" title="Variable: $sum_vol_substitution">
                                {formatNumber(
                                  calculatorData.turbines.reduce(
                                    (sum, t) =>
                                      sum + calculateSubstitutionVolume(foundationMetrics.surfaceFondFouille, t.substitution),
                                    0
                                  ),
                                  0
                                )}
                              </td>
                            </tr>
                          )}
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
                      <h3 className="text-sm font-bold text-primary">Accès</h3>
                      <Button onClick={addAccessSegment} size="sm" variant="outline" className="font-semibold">
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter tronçon
                      </Button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-primary/10">
                            <th className="border p-2 text-left text-xs font-bold min-w-[180px]">Tronçon</th>
                            <th className="border p-2 text-left text-xs font-bold">Unité</th>
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
                            <th className="border p-2 text-center text-xs font-bold bg-primary/20">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border p-2 text-xs">Longueur chemin</td>
                            <td className="border p-2 text-xs text-muted-foreground">ml</td>
                            {calculatorData.access_segments.map((segment, idx) => (
                              <td key={idx} className="border p-1">
                                <NumericInput
                                  value={segment.longueur}
                                  onValueChange={(val) => updateAccessSegment(idx, "longueur", val)}
                                  className="h-7 text-xs text-center"
                                  title={`Variable: $longueur_${segment.name.replace(/\s+/g, "_")}`}
                                />
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center font-semibold bg-primary/5" title="Variable: $sum_longueur_chemins">
                              {accessTotals.longueur}
                            </td>
                          </tr>
                          <tr>
                            <td className="border p-2 text-xs">Surface (5ml)</td>
                            <td className="border p-2 text-xs text-muted-foreground">m²</td>
                            {calculatorData.access_segments.map((segment, idx) => (
                              <td key={idx} className="border p-1">
                                <NumericInput
                                  value={segment.surface}
                                  onValueChange={(val) => updateAccessSegment(idx, "surface", val)}
                                  className="h-7 text-xs text-center"
                                  title={`Variable: $surface_${segment.name.replace(/\s+/g, "_")}`}
                                />
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center font-semibold bg-primary/5" title="Variable: $sum_surface_chemins">
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
                                <NumericInput
                                  value={segment.bicouche}
                                  onValueChange={(val) => updateAccessSegment(idx, "bicouche", val)}
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
                                <NumericInput
                                  value={segment.enrobe}
                                  onValueChange={(val) => updateAccessSegment(idx, "enrobe", val)}
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

                  {/* Electricity Section - HTA Cables */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-bold text-primary">Électricité - Câbles HTA</h3>
                      </div>
                      <Button onClick={addHTACable} size="sm" variant="outline" className="font-semibold">
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter tronçon
                      </Button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-primary/10">
                            <th className="border p-2 text-left text-xs font-bold min-w-[120px]">PDL</th>
                            <th className="border p-2 text-center text-xs font-bold bg-blue-100 dark:bg-blue-900/30">95² alu</th>
                            <th className="border p-2 text-center text-xs font-bold bg-blue-100 dark:bg-blue-900/30">150² alu</th>
                            <th className="border p-2 text-center text-xs font-bold bg-blue-100 dark:bg-blue-900/30">240² alu</th>
                            <th className="border p-2 text-center text-xs font-bold bg-blue-100 dark:bg-blue-900/30">400² alu</th>
                            <th className="border p-2 text-center text-xs font-bold bg-orange-100 dark:bg-orange-900/30">95² cuivre</th>
                            <th className="border p-2 text-center text-xs font-bold bg-orange-100 dark:bg-orange-900/30">150² cuivre</th>
                            <th className="border p-2 text-center text-xs font-bold bg-orange-100 dark:bg-orange-900/30">240² cuivre</th>
                            <th className="border p-2 text-center text-xs font-bold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Sum row */}
                          <tr className="bg-primary/20 font-bold">
                            <td className="border p-2 text-xs font-bold">Somme (ml)</td>
                            <td className="border p-2 text-xs text-center bg-blue-50 dark:bg-blue-900/10">{htaTotals.alu_95}</td>
                            <td className="border p-2 text-xs text-center bg-blue-50 dark:bg-blue-900/10">{htaTotals.alu_150}</td>
                            <td className="border p-2 text-xs text-center bg-blue-50 dark:bg-blue-900/10">{htaTotals.alu_240}</td>
                            <td className="border p-2 text-xs text-center bg-blue-50 dark:bg-blue-900/10">{htaTotals.alu_400}</td>
                            <td className="border p-2 text-xs text-center bg-orange-50 dark:bg-orange-900/10">{htaTotals.cu_95}</td>
                            <td className="border p-2 text-xs text-center bg-orange-50 dark:bg-orange-900/10">{htaTotals.cu_150}</td>
                            <td className="border p-2 text-xs text-center bg-orange-50 dark:bg-orange-900/10">{htaTotals.cu_240}</td>
                            <td className="border p-2"></td>
                          </tr>
                          {/* Data rows */}
                          {calculatorData.hta_cables.map((cable, idx) => (
                            <tr key={idx}>
                              <td className="border p-1">
                                <Input
                                  value={cable.name}
                                  onChange={(e) => updateHTACable(idx, "name", e.target.value)}
                                  className="h-7 text-xs"
                                />
                              </td>
                              <td className="border p-1 bg-blue-50/50 dark:bg-blue-900/5">
                                <NumericInput
                                  value={cable.alu_95}
                                  onValueChange={(val) => updateHTACable(idx, "alu_95", val)}
                                  className="h-7 text-xs text-center"
                                  title={`Variable: $alu95_${cable.name.replace(/\s+/g, "_")}`}
                                />
                              </td>
                              <td className="border p-1 bg-blue-50/50 dark:bg-blue-900/5">
                                <NumericInput
                                  value={cable.alu_150}
                                  onValueChange={(val) => updateHTACable(idx, "alu_150", val)}
                                  className="h-7 text-xs text-center"
                                  title={`Variable: $alu150_${cable.name.replace(/\s+/g, "_")}`}
                                />
                              </td>
                              <td className="border p-1 bg-blue-50/50 dark:bg-blue-900/5">
                                <NumericInput
                                  value={cable.alu_240}
                                  onValueChange={(val) => updateHTACable(idx, "alu_240", val)}
                                  className="h-7 text-xs text-center"
                                  title={`Variable: $alu240_${cable.name.replace(/\s+/g, "_")}`}
                                />
                              </td>
                              <td className="border p-1 bg-blue-50/50 dark:bg-blue-900/5">
                                <NumericInput
                                  value={cable.alu_400}
                                  onValueChange={(val) => updateHTACable(idx, "alu_400", val)}
                                  className="h-7 text-xs text-center"
                                  title={`Variable: $alu400_${cable.name.replace(/\s+/g, "_")}`}
                                />
                              </td>
                              <td className="border p-1 bg-orange-50/50 dark:bg-orange-900/5">
                                <NumericInput
                                  value={cable.cu_95}
                                  onValueChange={(val) => updateHTACable(idx, "cu_95", val)}
                                  className="h-7 text-xs text-center"
                                  title={`Variable: $cu95_${cable.name.replace(/\s+/g, "_")}`}
                                />
                              </td>
                              <td className="border p-1 bg-orange-50/50 dark:bg-orange-900/5">
                                <NumericInput
                                  value={cable.cu_150}
                                  onValueChange={(val) => updateHTACable(idx, "cu_150", val)}
                                  className="h-7 text-xs text-center"
                                  title={`Variable: $cu150_${cable.name.replace(/\s+/g, "_")}`}
                                />
                              </td>
                              <td className="border p-1 bg-orange-50/50 dark:bg-orange-900/5">
                                <NumericInput
                                  value={cable.cu_240}
                                  onValueChange={(val) => updateHTACable(idx, "cu_240", val)}
                                  className="h-7 text-xs text-center"
                                  title={`Variable: $cu240_${cable.name.replace(/\s+/g, "_")}`}
                                />
                              </td>
                              <td className="border p-1 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeHTACable(idx)}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <Separator />

                  {/* Fondation Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-primary">Fondation</h3>
                    
                    {/* Input parameters */}
                    <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-md">
                      {/* Diamètre fondation */}
                      <div className="flex items-center gap-2">
                        <Label className="text-xs min-w-[140px] font-medium">Diamètre fondation</Label>
                        <NumericInput
                          value={calculatorData.design.diametre_fondation ?? 0}
                          onValueChange={(val) =>
                            setCalculatorData({
                              ...calculatorData,
                              design: {
                                ...calculatorData.design,
                                diametre_fondation: val || null,
                              },
                            })
                          }
                          className="w-24 font-semibold"
                        />
                        <span className="text-xs text-muted-foreground font-mono">m</span>
                      </div>

                      {/* Marge de sécurité */}
                      <div className="flex items-center gap-2">
                        <Label className="text-xs min-w-[140px] font-medium">Marge de sécurité</Label>
                        {!customMargin ? (
                          <Select
                            value={String(calculatorData.design.marge_securite)}
                            onValueChange={(value) => {
                              if (value === "custom") {
                                setCustomMargin(true);
                              } else {
                                setCalculatorData({
                                  ...calculatorData,
                                  design: {
                                    ...calculatorData.design,
                                    marge_securite: parseFloat(value),
                                  },
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 m</SelectItem>
                              <SelectItem value="1.5">1.5 m</SelectItem>
                              <SelectItem value="custom">Custom...</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-1">
                            <NumericInput
                              value={calculatorData.design.marge_securite}
                              onValueChange={(val) =>
                                setCalculatorData({
                                  ...calculatorData,
                                  design: {
                                    ...calculatorData.design,
                                    marge_securite: val || 1.0,
                                  },
                                })
                              }
                              className="w-20 font-semibold"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => {
                                setCustomMargin(false);
                                setCalculatorData({
                                  ...calculatorData,
                                  design: { ...calculatorData.design, marge_securite: 1.0 },
                                });
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground font-mono">m</span>
                      </div>

                      {/* Pente talus */}
                      <div className="flex items-center gap-2">
                        <Label className="text-xs min-w-[140px] font-medium">Pente talus</Label>
                        {!customSlope ? (
                          <Select
                            value={calculatorData.design.pente_talus}
                            onValueChange={(value) => {
                              if (value === "custom") {
                                setCustomSlope(true);
                              } else {
                                setCalculatorData({
                                  ...calculatorData,
                                  design: {
                                    ...calculatorData.design,
                                    pente_talus: value,
                                  },
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1:1">1:1</SelectItem>
                              <SelectItem value="3:2">3:2</SelectItem>
                              <SelectItem value="custom">Custom...</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Input
                              type="text"
                              value={calculatorData.design.pente_talus}
                              className="w-20 font-semibold font-mono"
                              placeholder="x:y"
                              onChange={(e) =>
                                setCalculatorData({
                                  ...calculatorData,
                                  design: {
                                    ...calculatorData.design,
                                    pente_talus: e.target.value,
                                  },
                                })
                              }
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => {
                                setCustomSlope(false);
                                setCalculatorData({
                                  ...calculatorData,
                                  design: { ...calculatorData.design, pente_talus: "1:1" },
                                });
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Hauteur cage ancrage */}
                      <div className="flex items-center gap-2">
                        <Label className="text-xs min-w-[140px] font-medium">Hauteur cage ancrage</Label>
                        <NumericInput
                          value={calculatorData.design.hauteur_cage}
                          onValueChange={(val) =>
                            setCalculatorData({
                              ...calculatorData,
                              design: {
                                ...calculatorData.design,
                                hauteur_cage: val || 3.5,
                              },
                            })
                          }
                          className="w-24 font-semibold"
                        />
                        <span className="text-xs text-muted-foreground font-mono">m</span>
                      </div>
                    </div>

                    {/* Calculated results */}
                    {foundationMetrics && (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-md border border-emerald-200 dark:border-emerald-800">
                        <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-3 uppercase tracking-wide">
                          Résultats calculés
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Surface fond de fouille</span>
                            <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">
                              {formatNumber(foundationMetrics.surfaceFondFouille, 1)} m²
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Volume terrassement</span>
                            <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">
                              {formatNumber(foundationMetrics.volumeTerrassement, 1)} m³
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Foundation diagram */}
                    {foundationMetrics && calculatorData.design.diametre_fondation && (
                      <FoundationDiagram
                        diametre={calculatorData.design.diametre_fondation}
                        marge={calculatorData.design.marge_securite}
                        hauteurCage={calculatorData.design.hauteur_cage}
                        penteTalus={calculatorData.design.pente_talus}
                        rayonBas={foundationMetrics.rayonBas}
                        rayonHaut={foundationMetrics.rayonHaut}
                      />
                    )}
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
              <h3 className="text-sm font-bold text-primary mb-3">Variables disponibles</h3>
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
                      <p className="text-xs font-bold text-foreground/70 uppercase tracking-wide">{category}</p>
                      {vars.map((v) => (
                        <div
                          key={v.name}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono text-orange-600 dark:text-orange-400 truncate font-semibold">{v.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{v.label}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">{v.value}</span>
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
