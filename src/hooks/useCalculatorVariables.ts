import { useMemo } from "react";
import { CalculatorData, CalculatorVariable } from "@/types/bpu";

/**
 * Hook to generate all available variables from Calculator data
 * and provide their current values
 */
export const useCalculatorVariables = (calculatorData: CalculatorData | null): {
  variables: CalculatorVariable[];
  getVariableValue: (varName: string) => number | null;
} => {
  const variables = useMemo(() => {
    if (!calculatorData) return [];

    const vars: CalculatorVariable[] = [];

    // Global variables
    vars.push({
      name: "$nb_eol",
      value: calculatorData.global.nb_eol,
      label: "Nombre d'éoliennes",
      category: "Global",
    });

    // Per-turbine variables
    calculatorData.turbines.forEach((turbine) => {
      vars.push(
        {
          name: `$surf_PF_${turbine.name}`,
          value: turbine.surf_PF,
          label: `Surface PF ${turbine.name}`,
          category: "Éoliennes",
        },
        {
          name: `$acces_PF_${turbine.name}`,
          value: turbine.acces_PF,
          label: `Accès PF ${turbine.name}`,
          category: "Éoliennes",
        },
        {
          name: `$m3_bouger_${turbine.name}`,
          value: turbine.m3_bouger,
          label: `m³ à bouger ${turbine.name}`,
          category: "Éoliennes",
        },
        {
          name: `$bypass_${turbine.name}`,
          value: turbine.bypass,
          label: `Bypass ${turbine.name}`,
          category: "Éoliennes",
        }
      );
    });

    // Totals for turbines
    const sum_surf_PF = calculatorData.turbines.reduce((sum, t) => sum + t.surf_PF, 0);
    const sum_acces_PF = calculatorData.turbines.reduce((sum, t) => sum + t.acces_PF, 0);
    const sum_m3_bouger = calculatorData.turbines.reduce((sum, t) => sum + t.m3_bouger, 0);
    const sum_bypass = calculatorData.turbines.reduce((sum, t) => sum + t.bypass, 0);

    vars.push(
      { name: "$sum_surf_PF", value: sum_surf_PF, label: "Total Surface PF", category: "Totaux" },
      { name: "$sum_acces_PF", value: sum_acces_PF, label: "Total Accès PF", category: "Totaux" },
      { name: "$sum_m3_bouger", value: sum_m3_bouger, label: "Total m³ à bouger", category: "Totaux" },
      { name: "$sum_bypass", value: sum_bypass, label: "Total Bypass", category: "Totaux" }
    );

    // Conditional totals (fondation type)
    const nb_eol_en_eau = calculatorData.turbines.filter((t) => t.fondation_type === "en eau").length;
    const nb_eol_sans_eau = calculatorData.turbines.filter((t) => t.fondation_type === "sans eau").length;

    vars.push(
      { name: "$nb_eol_en_eau", value: nb_eol_en_eau, label: "Nb éoliennes en eau", category: "Totaux" },
      { name: "$nb_eol_sans_eau", value: nb_eol_sans_eau, label: "Nb éoliennes sans eau", category: "Totaux" }
    );

    // Access segments variables
    calculatorData.access_segments.forEach((segment) => {
      vars.push(
        {
          name: `$longueur_${segment.name.replace(/\s+/g, "_")}`,
          value: segment.longueur,
          label: `Longueur ${segment.name}`,
          category: "Accès",
        },
        {
          name: `$surface_${segment.name.replace(/\s+/g, "_")}`,
          value: segment.surface,
          label: `Surface ${segment.name}`,
          category: "Accès",
        }
      );
    });

    // Totals for access segments
    const sum_longueur = calculatorData.access_segments.reduce((sum, s) => sum + s.longueur, 0);
    const sum_surface_chemins = calculatorData.access_segments.reduce((sum, s) => sum + s.surface, 0);
    const sum_GNT = calculatorData.access_segments.filter((s) => s.gnt).reduce((sum, s) => sum + s.surface, 0);
    const sum_bicouche = calculatorData.access_segments.reduce((sum, s) => sum + s.bicouche, 0);
    const sum_enrobe = calculatorData.access_segments.reduce((sum, s) => sum + s.enrobe, 0);

    vars.push(
      { name: "$sum_longueur_chemins", value: sum_longueur, label: "Total Longueur chemins", category: "Totaux" },
      { name: "$sum_surface_chemins", value: sum_surface_chemins, label: "Total Surface chemins", category: "Totaux" },
      { name: "$sum_GNT", value: sum_GNT, label: "Total Surface GNT", category: "Totaux" },
      { name: "$sum_bicouche", value: sum_bicouche, label: "Total Bicouche", category: "Totaux" },
      { name: "$sum_enrobe", value: sum_enrobe, label: "Total Enrobé", category: "Totaux" }
    );

    // HTA Cables variables
    if (calculatorData.hta_cables) {
      calculatorData.hta_cables.forEach((cable) => {
        vars.push(
          {
            name: `$alu95_${cable.name.replace(/\s+/g, "_")}`,
            value: cable.alu_95,
            label: `95² alu ${cable.name}`,
            category: "Électricité",
          },
          {
            name: `$alu150_${cable.name.replace(/\s+/g, "_")}`,
            value: cable.alu_150,
            label: `150² alu ${cable.name}`,
            category: "Électricité",
          },
          {
            name: `$alu240_${cable.name.replace(/\s+/g, "_")}`,
            value: cable.alu_240,
            label: `240² alu ${cable.name}`,
            category: "Électricité",
          },
          {
            name: `$alu400_${cable.name.replace(/\s+/g, "_")}`,
            value: cable.alu_400,
            label: `400² alu ${cable.name}`,
            category: "Électricité",
          },
          {
            name: `$cu95_${cable.name.replace(/\s+/g, "_")}`,
            value: cable.cu_95,
            label: `95² cu ${cable.name}`,
            category: "Électricité",
          },
          {
            name: `$cu150_${cable.name.replace(/\s+/g, "_")}`,
            value: cable.cu_150,
            label: `150² cu ${cable.name}`,
            category: "Électricité",
          },
          {
            name: `$cu240_${cable.name.replace(/\s+/g, "_")}`,
            value: cable.cu_240,
            label: `240² cu ${cable.name}`,
            category: "Électricité",
          }
        );
      });

      // Totals for HTA cables
      const sum_alu95 = calculatorData.hta_cables.reduce((sum, c) => sum + c.alu_95, 0);
      const sum_alu150 = calculatorData.hta_cables.reduce((sum, c) => sum + c.alu_150, 0);
      const sum_alu240 = calculatorData.hta_cables.reduce((sum, c) => sum + c.alu_240, 0);
      const sum_alu400 = calculatorData.hta_cables.reduce((sum, c) => sum + c.alu_400, 0);
      const sum_cu95 = calculatorData.hta_cables.reduce((sum, c) => sum + c.cu_95, 0);
      const sum_cu150 = calculatorData.hta_cables.reduce((sum, c) => sum + c.cu_150, 0);
      const sum_cu240 = calculatorData.hta_cables.reduce((sum, c) => sum + c.cu_240, 0);

      vars.push(
        { name: "$sum_alu95", value: sum_alu95, label: "Total 95² alu (ml)", category: "Totaux" },
        { name: "$sum_alu150", value: sum_alu150, label: "Total 150² alu (ml)", category: "Totaux" },
        { name: "$sum_alu240", value: sum_alu240, label: "Total 240² alu (ml)", category: "Totaux" },
        { name: "$sum_alu400", value: sum_alu400, label: "Total 400² alu (ml)", category: "Totaux" },
        { name: "$sum_cu95", value: sum_cu95, label: "Total 95² cu (ml)", category: "Totaux" },
        { name: "$sum_cu150", value: sum_cu150, label: "Total 150² cu (ml)", category: "Totaux" },
        { name: "$sum_cu240", value: sum_cu240, label: "Total 240² cu (ml)", category: "Totaux" }
      );
    }

    return vars;
  }, [calculatorData]);

  const getVariableValue = (varName: string): number | null => {
    const variable = variables.find((v) => v.name === varName);
    return variable?.value ?? null;
  };

  return { variables, getVariableValue };
};
