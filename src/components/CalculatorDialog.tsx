import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Calculator, Plus, Trash2, Copy } from "lucide-react";
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
      return data as QuoteSettings | null;
    },
    enabled: !!versionId && open,
  });

  // Initialize form when settings are loaded
  useEffect(() => {
    if (settings?.calculator_data) {
      setCalculatorData(settings.calculator_data as CalculatorData);
    }
  }, [settings]);

  // Get all available variables
  const { variables } = useCalculatorVariables(calculatorData);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const settingsData = {
        calculator_data: calculatorData,
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${text} copié`);
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh]">
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
            {/* Main content */}
            <div className="flex-1">
              <Tabs defaultValue="turbines" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="global">Global</TabsTrigger>
                  <TabsTrigger value="turbines">Éoliennes</TabsTrigger>
                  <TabsTrigger value="access">Accès</TabsTrigger>
                  <TabsTrigger value="design">Design</TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[60vh] mt-4">
                  {/* Global Tab */}
                  <TabsContent value="global" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nombre d'éoliennes</Label>
                        <Input
                          type="number"
                          value={calculatorData.global.nb_eol}
                          onChange={(e) =>
                            setCalculatorData({
                              ...calculatorData,
                              global: { ...calculatorData.global, nb_eol: parseInt(e.target.value) || 0 },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type de plateforme</Label>
                        <Input
                          value={calculatorData.global.typ_eol}
                          onChange={(e) =>
                            setCalculatorData({
                              ...calculatorData,
                              global: { ...calculatorData.global, typ_eol: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Turbines Tab */}
                  <TabsContent value="turbines" className="space-y-4">
                    <Button onClick={addTurbine} size="sm" className="mb-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une éolienne
                    </Button>

                    {calculatorData.turbines.map((turbine, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Input
                            className="w-32 font-semibold"
                            value={turbine.name}
                            onChange={(e) => updateTurbine(index, "name", e.target.value)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTurbine(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <Label className="text-xs">Surface PF (m²)</Label>
                            <Input
                              type="number"
                              value={turbine.surf_PF}
                              onChange={(e) => updateTurbine(index, "surf_PF", parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Accès PF (m²)</Label>
                            <Input
                              type="number"
                              value={turbine.acces_PF}
                              onChange={(e) => updateTurbine(index, "acces_PF", parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">m³ à bouger</Label>
                            <Input
                              type="number"
                              value={turbine.m3_bouger}
                              onChange={(e) => updateTurbine(index, "m3_bouger", parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Bypass (m²)</Label>
                            <Input
                              type="number"
                              value={turbine.bypass}
                              onChange={(e) => updateTurbine(index, "bypass", parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Type fondation</Label>
                            <Select
                              value={turbine.fondation_type}
                              onValueChange={(value) => updateTurbine(index, "fondation_type", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="en eau">En eau</SelectItem>
                                <SelectItem value="sans eau">Sans eau</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">G2AVP</Label>
                            <Input
                              value={turbine.g2avp}
                              onChange={(e) => updateTurbine(index, "g2avp", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Substitution (m)</Label>
                            <Input
                              type="number"
                              value={turbine.substitution}
                              onChange={(e) => updateTurbine(index, "substitution", parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Commentaire</Label>
                            <Input
                              value={turbine.commentaire}
                              onChange={(e) => updateTurbine(index, "commentaire", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  {/* Access Tab */}
                  <TabsContent value="access" className="space-y-4">
                    <Button onClick={addAccessSegment} size="sm" className="mb-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un tronçon
                    </Button>

                    {calculatorData.access_segments.map((segment, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Input
                            className="w-48 font-semibold"
                            value={segment.name}
                            onChange={(e) => updateAccessSegment(index, "name", e.target.value)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAccessSegment(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs">Longueur (ml)</Label>
                            <Input
                              type="number"
                              value={segment.longueur}
                              onChange={(e) => updateAccessSegment(index, "longueur", parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Surface (m²)</Label>
                            <Input
                              type="number"
                              value={segment.surface}
                              onChange={(e) => updateAccessSegment(index, "surface", parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Renforcement</Label>
                            <Select
                              value={segment.renforcement}
                              onValueChange={(value) => updateAccessSegment(index, "renforcement", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="refresh">Refresh</SelectItem>
                                <SelectItem value="traitement">Traitement</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Bicouche (m²)</Label>
                            <Input
                              type="number"
                              value={segment.bicouche}
                              onChange={(e) => updateAccessSegment(index, "bicouche", parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Enrobé (m²)</Label>
                            <Input
                              type="number"
                              value={segment.enrobe}
                              onChange={(e) => updateAccessSegment(index, "enrobe", parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-6">
                            <input
                              type="checkbox"
                              checked={segment.gnt}
                              onChange={(e) => updateAccessSegment(index, "gnt", e.target.checked)}
                              className="h-4 w-4"
                            />
                            <Label className="text-xs">GNT</Label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  {/* Design Tab */}
                  <TabsContent value="design" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Diamètre fondation (m)</Label>
                      <Input
                        type="number"
                        value={calculatorData.design.diametre_fondation || ""}
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
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>

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
              <ScrollArea className="h-[65vh]">
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
