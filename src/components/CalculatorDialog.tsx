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
import { Calculator, Plus, Copy, X, Zap, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Switch } from "@/components/ui/switch";
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

const defaultHTACable = (): HTACableSegment => ({
  name: `Tronçon 1`,
  alu_95: 0, alu_150: 0, alu_240: 0, alu_300: 0, alu_400: 0,
  cu_95: 0, cu_150: 0, cu_240: 0, cu_300: 0, cu_400: 0,
});

export const CalculatorDialog = ({ open, onOpenChange, versionId }: CalculatorDialogProps) => {
  const queryClient = useQueryClient();
  
  const [calculatorData, setCalculatorData] = useState<CalculatorData>({
    global: { nb_eol: 1, typ_eol: "Vestas", tension_hta: "20kV" },
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

  // Electricity material filter
  const [showAlu, setShowAlu] = useState(true);
  const [showCu, setShowCu] = useState(true);
  const [showVariablesSidebar, setShowVariablesSidebar] = useState(true);

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
        // Migrate HTA cables: add missing fields
        const migratedCables = (data.hta_cables || []).map((c: any) => ({
          ...c,
          alu_300: c.alu_300 ?? 0,
          cu_300: c.cu_300 ?? 0,
          cu_400: c.cu_400 ?? 0,
        }));

        setCalculatorData({
          ...data,
          global: {
            ...data.global,
            tension_hta: data.global.tension_hta ?? "20kV",
          },
          hta_cables: migratedCables,
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
      queryClient.invalidateQueries({ queryKey: ["quote-settings-for-sections"] });
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

  const updateTurbineFormula = (index: number, field: string, formula: string | null) => {
    const newTurbines = [...calculatorData.turbines];
    const existing = newTurbines[index].formulas || {};
    if (formula) {
      newTurbines[index] = { ...newTurbines[index], formulas: { ...existing, [field]: formula } };
    } else {
      const { [field]: _, ...rest } = existing;
      newTurbines[index] = { ...newTurbines[index], formulas: Object.keys(rest).length > 0 ? rest : undefined };
    }
    setCalculatorData({ ...calculatorData, turbines: newTurbines });
  };

  const addAccessSegment = () => {
    const newSegment: AccessSegment = {
      name: `Tronçon ${calculatorData.access_segments.length + 1}`,
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

  const updateAccessFormula = (index: number, field: string, formula: string | null) => {
    const newSegments = [...calculatorData.access_segments];
    const existing = newSegments[index].formulas || {};
    if (formula) {
      newSegments[index] = { ...newSegments[index], formulas: { ...existing, [field]: formula } };
    } else {
      const { [field]: _, ...rest } = existing;
      newSegments[index] = { ...newSegments[index], formulas: Object.keys(rest).length > 0 ? rest : undefined };
    }
    setCalculatorData({ ...calculatorData, access_segments: newSegments });
  };

  const addHTACable = () => {
    const cable = defaultHTACable();
    cable.name = `Tronçon ${calculatorData.hta_cables.length + 1}`;
    setCalculatorData({
      ...calculatorData,
      hta_cables: [...calculatorData.hta_cables, cable],
    });
  };

  const removeHTACable = (index: number) => {
    const newCables = calculatorData.hta_cables.filter((_, i) => i !== index);
    setCalculatorData({ ...calculatorData, hta_cables: newCables });
  };

  const updateHTACable = (index: number, field: string, value: any) => {
    const newCables = [...calculatorData.hta_cables];
    newCables[index] = { ...newCables[index], [field]: value };
    setCalculatorData({ ...calculatorData, hta_cables: newCables });
  };

  const updateHTAFormula = (index: number, field: string, formula: string | null) => {
    const newCables = [...calculatorData.hta_cables];
    const existing = newCables[index].formulas || {};
    if (formula) {
      newCables[index] = { ...newCables[index], formulas: { ...existing, [field]: formula } };
    } else {
      const { [field]: _, ...rest } = existing;
      newCables[index] = { ...newCables[index], formulas: Object.keys(rest).length > 0 ? rest : undefined };
    }
    setCalculatorData({ ...calculatorData, hta_cables: newCables });
  };

  const addCustomCable = (cableIndex: number) => {
    const newCables = [...calculatorData.hta_cables];
    const cable = newCables[cableIndex];
    const customs = cable.custom_cables || [];
    newCables[cableIndex] = {
      ...cable,
      custom_cables: [...customs, { section: "500", material: "alu", length: 0 }],
    };
    setCalculatorData({ ...calculatorData, hta_cables: newCables });
  };

  const updateCustomCable = (cableIndex: number, customIndex: number, field: string, value: any) => {
    const newCables = [...calculatorData.hta_cables];
    const customs = [...(newCables[cableIndex].custom_cables || [])];
    customs[customIndex] = { ...customs[customIndex], [field]: value };
    newCables[cableIndex] = { ...newCables[cableIndex], custom_cables: customs };
    setCalculatorData({ ...calculatorData, hta_cables: newCables });
  };

  const removeCustomCable = (cableIndex: number, customIndex: number) => {
    const newCables = [...calculatorData.hta_cables];
    const customs = [...(newCables[cableIndex].custom_cables || [])];
    customs.splice(customIndex, 1);
    newCables[cableIndex] = { ...newCables[cableIndex], custom_cables: customs.length > 0 ? customs : undefined };
    setCalculatorData({ ...calculatorData, hta_cables: newCables });
  };

  // Calculate totals
  const toNum = (v: any) => (typeof v === 'number' ? v : parseFloat(v) || 0);

  const turbineTotals = {
    surf_PF: calculatorData.turbines.reduce((sum, t) => sum + toNum(t.surf_PF), 0),
    acces_PF: calculatorData.turbines.reduce((sum, t) => sum + toNum(t.acces_PF), 0),
    m3_bouger: calculatorData.turbines.reduce((sum, t) => sum + toNum(t.m3_bouger), 0),
    bypass: calculatorData.turbines.reduce((sum, t) => sum + toNum(t.bypass), 0),
  };

  const accessTotals = {
    surface: calculatorData.access_segments.reduce((sum, s) => sum + toNum(s.surface), 0),
    gnt: calculatorData.access_segments.filter((s) => s.gnt).reduce((sum, s) => sum + toNum(s.surface), 0),
    bicouche: calculatorData.access_segments.reduce((sum, s) => sum + toNum(s.bicouche), 0),
    enrobe: calculatorData.access_segments.reduce((sum, s) => sum + toNum(s.enrobe), 0),
  };

  const htaFields = ["alu_95", "alu_150", "alu_240", "alu_300", "alu_400", "cu_95", "cu_150", "cu_240", "cu_300", "cu_400"] as const;
  const visibleHtaFields = htaFields.filter(f => 
    (showAlu && f.startsWith("alu")) || (showCu && f.startsWith("cu"))
  );
  const htaTotals = Object.fromEntries(
    htaFields.map((f) => [f, calculatorData.hta_cables.reduce((sum, c) => sum + toNum((c as any)[f]), 0)])
  ) as Record<string, number>;

  const htaTotalLineaire = Object.values(htaTotals).reduce((a, b) => a + b, 0) +
    calculatorData.hta_cables.reduce((sum, c) => sum + (c.custom_cables || []).reduce((s, cc) => s + toNum(cc.length), 0), 0);

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
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculator - Variables du projet
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Chargement...</div>
        ) : (
          <div className="flex gap-4 h-full min-w-0 overflow-hidden">
            {/* Main content - Vertical table layout */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="h-[70vh] overflow-y-auto overflow-x-hidden pr-4">
                <div className="space-y-6">
                  {/* Global Section */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-primary">Paramètres globaux</h3>
                    <div className="flex gap-4 items-center flex-wrap bg-muted/30 p-3 rounded-md">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs min-w-[140px] font-medium">Nombre d'éoliennes</Label>
                        <Input
                          type="number"
                          value={calculatorData.global.nb_eol}
                          className="w-20 font-semibold"
                          onChange={(e) => {
                            const newCount = parseInt(e.target.value) || 0;
                            const currentTurbines = [...calculatorData.turbines];
                            let newTurbines = currentTurbines;
                            if (newCount > currentTurbines.length) {
                              // Add empty turbines
                              for (let i = currentTurbines.length; i < newCount; i++) {
                                newTurbines.push({
                                  name: `E${String(i + 1).padStart(2, "0")}`,
                                  surf_PF: 0,
                                  acces_PF: 0,
                                  m3_bouger: 0,
                                  bypass: 0,
                                  fondation_type: "sans eau",
                                  g2avp: "",
                                  substitution: 0,
                                  commentaire: "",
                                });
                              }
                            } else if (newCount < currentTurbines.length) {
                              newTurbines = currentTurbines.slice(0, newCount);
                            }
                            setCalculatorData({
                              ...calculatorData,
                              global: { ...calculatorData.global, nb_eol: newCount },
                              turbines: newTurbines,
                            });
                          }}
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
                      <div className="flex items-center gap-2">
                        <Label className="text-xs min-w-[100px] font-medium">Tension HTA</Label>
                        <Select
                          value={calculatorData.global.tension_hta || "20kV"}
                          onValueChange={(value) =>
                            setCalculatorData({
                              ...calculatorData,
                              global: { ...calculatorData.global, tension_hta: value },
                            })
                          }
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="20kV">20 kV</SelectItem>
                            <SelectItem value="30kV">30 kV</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground font-mono">tension_hta</span>
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

                    <div className="overflow-x-auto border rounded-md">
                      <table className="border-separate border-spacing-0 text-sm">
                        <thead>
                          <tr className="bg-primary/10">
                             <th className="border p-2 text-left text-xs font-bold min-w-[180px] sticky-col-header left-0">Paramètre</th>
                             <th className="border p-2 text-left text-xs font-bold min-w-[50px] sticky-col-header left-[180px] sticky-col-edge">Unité</th>
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
                          {[
                            { label: "Plateforme + pan coupé", unit: "m²", field: "surf_PF" as const, totalKey: "surf_PF" as const, varPrefix: "surf_PF" },
                            { label: "Accès PF", unit: "m²", field: "acces_PF" as const, totalKey: "acces_PF" as const, varPrefix: "acces_PF" },
                            { label: "m³ à bouger", unit: "m³", field: "m3_bouger" as const, totalKey: "m3_bouger" as const, varPrefix: "m3_bouger" },
                            { label: "Bypass", unit: "m²", field: "bypass" as const, totalKey: "bypass" as const, varPrefix: "bypass" },
                          ].map((row) => (
                            <tr key={row.field}>
                               <td className="border p-2 text-xs sticky-col left-0">{row.label}</td>
                               <td className="border p-2 text-xs text-muted-foreground sticky-col left-[180px] sticky-col-edge">{row.unit}</td>
                              {calculatorData.turbines.map((turbine, idx) => (
                                <td key={idx} className="border p-1">
                                  <NumericInput
                                    value={turbine[row.field] as number}
                                    onValueChange={(val) => updateTurbine(idx, row.field, val)}
                                    className="h-7 text-xs text-center"
                                    title={`Variable: $${row.varPrefix}_${turbine.name}`}
                                  />
                                </td>
                              ))}
                              <td className="border p-2 text-xs text-center font-semibold bg-primary/5" title={`Variable: $sum_${row.varPrefix}`}>
                                {turbineTotals[row.totalKey]}
                              </td>
                            </tr>
                          ))}
                          <tr>
                             <td className="border p-2 text-xs sticky-col left-0">Fondation</td>
                             <td className="border p-2 text-xs text-muted-foreground sticky-col left-[180px] sticky-col-edge"></td>
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
                             <td className="border p-2 text-xs sticky-col left-0">G2AVP</td>
                             <td className="border p-2 text-xs text-muted-foreground sticky-col left-[180px] sticky-col-edge"></td>
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
                             <td className="border p-2 text-xs sticky-col left-0">Substitution</td>
                             <td className="border p-2 text-xs text-muted-foreground sticky-col left-[180px] sticky-col-edge">m</td>
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
                          {foundationMetrics && (
                            <tr className="bg-emerald-50 dark:bg-emerald-900/10">
                               <td className="border p-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 sticky-col-accent left-0">
                                 Vol. substitution
                               </td>
                               <td className="border p-2 text-xs text-muted-foreground sticky-col-accent left-[180px] sticky-col-edge">m³</td>
                              {calculatorData.turbines.map((turbine, idx) => {
                                const volSub = calculateSubstitutionVolume(foundationMetrics.surfaceFondFouille, turbine.substitution);
                                return (
                                  <td key={idx} className="border p-2 text-xs text-center font-mono text-emerald-700 dark:text-emerald-400">
                                    {turbine.substitution > 0 ? formatNumber(volSub, 0) : "-"}
                                  </td>
                                );
                              })}
                              <td className="border p-2 text-xs text-center font-bold bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" title="Variable: $sum_vol_substitution">
                                {formatNumber(calculatorData.turbines.reduce((sum, t) => sum + calculateSubstitutionVolume(foundationMetrics.surfaceFondFouille, t.substitution), 0), 0)}
                              </td>
                            </tr>
                          )}
                          <tr>
                             <td className="border p-2 text-xs sticky-col left-0">Commentaire</td>
                             <td className="border p-2 text-xs text-muted-foreground sticky-col left-[180px] sticky-col-edge"></td>
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

                    <div className="overflow-x-auto border rounded-md">
                      <table className="w-full border-separate border-spacing-0 text-sm">
                        <thead>
                          <tr className="bg-primary/10">
                             <th className="border p-2 text-left text-xs font-bold min-w-[180px] sticky-col-header left-0">Tronçon</th>
                             <th className="border p-2 text-left text-xs font-bold min-w-[50px] sticky-col-header left-[180px] sticky-col-edge">Unité</th>
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
                             <td className="border p-2 text-xs sticky-col left-0">Surface chemin</td>
                             <td className="border p-2 text-xs text-muted-foreground sticky-col left-[180px] sticky-col-edge">m²</td>
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
                             <td className="border p-2 text-xs sticky-col left-0">GNT</td>
                             <td className="border p-2 text-xs text-muted-foreground sticky-col left-[180px] sticky-col-edge">m²</td>
                            {calculatorData.access_segments.map((segment, idx) => (
                              <td key={idx} className="border p-1">
                                <div className="flex items-center gap-1 justify-center">
                                  <input
                                    type="checkbox"
                                    checked={segment.gnt}
                                    onChange={(e) => updateAccessSegment(idx, "gnt", e.target.checked)}
                                    className="h-4 w-4"
                                  />
                                  {segment.gnt && (
                                    <span className="text-xs font-mono text-muted-foreground">
                                      {toNum(segment.surface)}
                                    </span>
                                  )}
                                </div>
                              </td>
                            ))}
                            <td className="border p-2 text-xs text-center font-semibold bg-primary/5" title="Variable: $sum_GNT">
                              {accessTotals.gnt}
                            </td>
                          </tr>
                          <tr>
                             <td className="border p-2 text-xs sticky-col left-0">Bicouche</td>
                             <td className="border p-2 text-xs text-muted-foreground sticky-col left-[180px] sticky-col-edge">m²</td>
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
                             <td className="border p-2 text-xs sticky-col left-0">Enrobé</td>
                             <td className="border p-2 text-xs text-muted-foreground sticky-col left-[180px] sticky-col-edge">m²</td>
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
                             <td className="border p-2 text-xs sticky-col left-0">Renforcement</td>
                             <td className="border p-2 text-xs text-muted-foreground sticky-col left-[180px] sticky-col-edge"></td>
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
                        <h3 className="text-sm font-bold text-primary">Électricité - Câbles HTA ({calculatorData.global.tension_hta || "20kV"})</h3>
                        <div className="flex items-center gap-3 ml-4">
                          <div className="flex items-center gap-1.5">
                            <Switch checked={showAlu} onCheckedChange={setShowAlu} className="scale-75" />
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Alu</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Switch checked={showCu} onCheckedChange={setShowCu} className="scale-75" />
                            <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Cuivre</span>
                          </div>
                        </div>
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
                            {visibleHtaFields.map((f) => (
                              <th key={f} className={cn("border p-2 text-center text-xs font-bold", f.startsWith("alu") ? "bg-blue-100 dark:bg-blue-900/30" : "bg-orange-100 dark:bg-orange-900/30")}>
                                {f.replace("alu_", "").replace("cu_", "")}² {f.startsWith("alu") ? "alu" : "cu"}
                              </th>
                            ))}
                            <th className="border p-2 text-center text-xs font-bold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Sum row */}
                          <tr className="bg-primary/20 font-bold">
                            <td className="border p-2 text-xs font-bold">Somme (ml)</td>
                            {visibleHtaFields.map((f) => (
                              <td key={f} className={cn("border p-2 text-xs text-center", f.startsWith("alu") ? "bg-blue-50 dark:bg-blue-900/10" : "bg-orange-50 dark:bg-orange-900/10")}>
                                {htaTotals[f]}
                              </td>
                            ))}
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
                              {visibleHtaFields.map((f) => (
                                <td key={f} className={cn("border p-1", f.startsWith("alu") ? "bg-blue-50/50 dark:bg-blue-900/5" : "bg-orange-50/50 dark:bg-orange-900/5")}>
                                  <NumericInput
                                    value={toNum((cable as any)[f])}
                                    onValueChange={(val) => updateHTACable(idx, f, val)}
                                    className="h-7 text-xs text-center"
                                    title={`Variable: $${f.replace("_", "")}_${cable.name.replace(/\s+/g, "_")}`}
                                  />
                                </td>
                              ))}
                              <td className="border p-1 text-center">
                                <div className="flex items-center gap-1 justify-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => addCustomCable(idx)}
                                    className="h-6 w-6 p-0"
                                    title="Ajouter section custom"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeHTACable(idx)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {/* Custom cables rows */}
                          {calculatorData.hta_cables.map((cable, cIdx) =>
                            (cable.custom_cables || []).map((cc, ccIdx) => (
                              <tr key={`custom-${cIdx}-${ccIdx}`} className="bg-purple-50/50 dark:bg-purple-900/5">
                                <td className="border p-1 text-xs text-muted-foreground pl-4">
                                  ↳ {cable.name}
                                </td>
                                <td colSpan={visibleHtaFields.length} className="border p-1">
                                  <div className="flex items-center gap-2">
                                    <NumericInput
                                      value={parseFloat(cc.section) || 0}
                                      onValueChange={(val) => updateCustomCable(cIdx, ccIdx, "section", String(val))}
                                      className="h-7 text-xs w-20 text-center"
                                    />
                                    <span className="text-xs">mm²</span>
                                    <Select
                                      value={cc.material}
                                      onValueChange={(val) => updateCustomCable(cIdx, ccIdx, "material", val)}
                                    >
                                      <SelectTrigger className="h-7 text-xs w-20">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="alu">Alu</SelectItem>
                                        <SelectItem value="cu">Cuivre</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <NumericInput
                                      value={cc.length}
                                      onValueChange={(val) => updateCustomCable(cIdx, ccIdx, "length", val)}
                                      className="h-7 text-xs w-24 text-center"
                                    />
                                    <span className="text-xs">ml</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeCustomCable(cIdx, ccIdx)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </td>
                                <td className="border p-1"></td>
                              </tr>
                            ))
                          )}
                          {/* Total linéaire row */}
                          <tr className="bg-emerald-50 dark:bg-emerald-900/10 font-bold">
                            <td className="border p-2 text-xs font-bold text-emerald-700 dark:text-emerald-400" colSpan={visibleHtaFields.length + 1}>
                              Total linéaire câbles HTA
                            </td>
                            <td className="border p-2 text-xs text-center font-bold text-emerald-700 dark:text-emerald-400" title="Variable: $sum_lineaire_hta">
                              {htaTotalLineaire} ml
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
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
              </div>

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

            {/* Variables sidebar toggle */}
            {showVariablesSidebar && <div className="w-80 border-l pl-4">
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
            </div>}
            <Button
              variant="ghost"
              size="sm"
              className="self-start mt-1 p-1.5"
              onClick={() => setShowVariablesSidebar(!showVariablesSidebar)}
              title={showVariablesSidebar ? "Masquer les variables" : "Afficher les variables"}
            >
              {showVariablesSidebar ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
