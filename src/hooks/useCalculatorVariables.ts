import { useMemo } from "react";
import { CalculatorData, CalculatorVariable } from "@/types/bpu";
import { calculateFoundationMetrics, calculateSubstitutionVolume } from "@/lib/foundationCalculations";

/**
 * Hook to generate all available variables from Calculator data
 * and provide their current values
 */
export const useCalculatorVariables = (calculatorData: CalculatorData | null): {
  variables: CalculatorVariable[];
  getVariableValue: (varName: string) => number | null;
} => {
  const variables = useMemo(() => {
    if (!calculatorData?.global) return [];

    const vars: CalculatorVariable[] = [];

    // Global variables
    vars.push({
      name: "$nb_eol",
      value: calculatorData.global.nb_eol ?? 0,
      label: "Nombre d'éoliennes",
      category: "Global",
    });

    // Foundation/Design variables
    const design = calculatorData.design;
    const foundationMetrics = calculateFoundationMetrics(
      design?.diametre_fondation ?? null,
      design?.marge_securite ?? 1.0,
      design?.pente_talus ?? "1:1",
      design?.hauteur_cage ?? 3.5
    );

    if (foundationMetrics) {
      vars.push(
        {
          name: "$surface_fond_fouille",
          value: Math.round(foundationMetrics.surfaceFondFouille * 100) / 100,
          label: "Surface fond de fouille (m²)",
          category: "Fondation",
        },
        {
          name: "$volume_terrassement",
          value: Math.round(foundationMetrics.volumeTerrassement * 100) / 100,
          label: "Volume terrassement (m³)",
          category: "Fondation",
        }
      );
    }

    // Helper to safely convert to number
    const toNumber = (val: unknown): number => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return parseFloat(val) || 0;
      return 0;
    };

    // Per-turbine variables
    let sumVolSubstitution = 0;
    calculatorData.turbines.forEach((turbine) => {
      const surfPF = toNumber(turbine.surf_PF);
      const accesPF = toNumber(turbine.acces_PF);
      const m3Bouger = toNumber(turbine.m3_bouger);
      const bypass = toNumber(turbine.bypass);
      const substitution = toNumber(turbine.substitution);

      vars.push(
        {
          name: `$surf_PF_${turbine.name}`,
          value: surfPF,
          label: `Surface PF ${turbine.name}`,
          category: "Éoliennes",
        },
        {
          name: `$acces_PF_${turbine.name}`,
          value: accesPF,
          label: `Accès PF ${turbine.name}`,
          category: "Éoliennes",
        },
        {
          name: `$m3_bouger_${turbine.name}`,
          value: m3Bouger,
          label: `m³ à bouger ${turbine.name}`,
          category: "Éoliennes",
        },
        {
          name: `$bypass_${turbine.name}`,
          value: bypass,
          label: `Bypass ${turbine.name}`,
          category: "Éoliennes",
        }
      );

      // Volume substitution per turbine
      if (foundationMetrics && substitution > 0) {
        const volSub = calculateSubstitutionVolume(
          foundationMetrics.surfaceFondFouille,
          substitution
        );
        vars.push({
          name: `$vol_sub_${turbine.name}`,
          value: Math.round(volSub * 100) / 100,
          label: `Vol. substitution ${turbine.name} (m³)`,
          category: "Éoliennes",
        });
        sumVolSubstitution += volSub;
      }
    });

    // Totals for turbines (with safe number conversion)
    const sum_surf_PF = calculatorData.turbines.reduce((sum, t) => sum + toNumber(t.surf_PF), 0);
    const sum_acces_PF = calculatorData.turbines.reduce((sum, t) => sum + toNumber(t.acces_PF), 0);
    const sum_m3_bouger = calculatorData.turbines.reduce((sum, t) => sum + toNumber(t.m3_bouger), 0);
    const sum_bypass = calculatorData.turbines.reduce((sum, t) => sum + toNumber(t.bypass), 0);

    vars.push(
      { name: "$sum_surf_PF", value: sum_surf_PF, label: "Total Surface PF", category: "Totaux" },
      { name: "$sum_acces_PF", value: sum_acces_PF, label: "Total Accès PF", category: "Totaux" },
      { name: "$sum_m3_bouger", value: sum_m3_bouger, label: "Total m³ à bouger", category: "Totaux" },
      { name: "$sum_bypass", value: sum_bypass, label: "Total Bypass", category: "Totaux" }
    );

    // Total substitution volume - always expose even if 0
    vars.push({
      name: "$sum_vol_substitution",
      value: foundationMetrics ? Math.round(sumVolSubstitution * 100) / 100 : 0,
      label: "Total Vol. substitution (m³)",
      category: "Totaux",
    });

    // Conditional totals (fondation type)
    const nb_eol_en_eau = calculatorData.turbines.filter((t) => t.fondation_type === "en eau").length;
    const nb_eol_sans_eau = calculatorData.turbines.filter((t) => t.fondation_type === "sans eau").length;

    vars.push(
      { name: "$nb_eol_en_eau", value: nb_eol_en_eau, label: "Nb éoliennes en eau", category: "Totaux" },
      { name: "$nb_eol_sans_eau", value: nb_eol_sans_eau, label: "Nb éoliennes sans eau", category: "Totaux" }
    );

    // Access segments variables (with safe number conversion)
    calculatorData.access_segments.forEach((segment) => {
      vars.push(
        {
          name: `$longueur_${segment.name.replace(/\s+/g, "_")}`,
          value: toNumber(segment.longueur),
          label: `Longueur ${segment.name}`,
          category: "Accès",
        },
        {
          name: `$surface_${segment.name.replace(/\s+/g, "_")}`,
          value: toNumber(segment.surface),
          label: `Surface ${segment.name}`,
          category: "Accès",
        }
      );
    });

    // Totals for access segments (with safe number conversion)
    const sum_longueur = calculatorData.access_segments.reduce((sum, s) => sum + toNumber(s.longueur), 0);
    const sum_surface_chemins = calculatorData.access_segments.reduce((sum, s) => sum + toNumber(s.surface), 0);
    const sum_GNT = calculatorData.access_segments.filter((s) => s.gnt).reduce((sum, s) => sum + toNumber(s.surface), 0);
    const sum_bicouche = calculatorData.access_segments.reduce((sum, s) => sum + toNumber(s.bicouche), 0);
    const sum_enrobe = calculatorData.access_segments.reduce((sum, s) => sum + toNumber(s.enrobe), 0);

    vars.push(
      { name: "$sum_longueur_chemins", value: sum_longueur, label: "Total Longueur chemins", category: "Totaux" },
      { name: "$sum_surface_chemins", value: sum_surface_chemins, label: "Total Surface chemins", category: "Totaux" },
      { name: "$sum_GNT", value: sum_GNT, label: "Total Surface GNT", category: "Totaux" },
      { name: "$sum_bicouche", value: sum_bicouche, label: "Total Bicouche", category: "Totaux" },
      { name: "$sum_enrobe", value: sum_enrobe, label: "Total Enrobé", category: "Totaux" }
    );

    // HTA Cables variables (with safe number conversion)
    if (calculatorData.hta_cables) {
      calculatorData.hta_cables.forEach((cable) => {
        vars.push(
          {
            name: `$alu95_${cable.name.replace(/\s+/g, "_")}`,
            value: toNumber(cable.alu_95),
            label: `95² alu ${cable.name}`,
            category: "Électricité",
          },
          {
            name: `$alu150_${cable.name.replace(/\s+/g, "_")}`,
            value: toNumber(cable.alu_150),
            label: `150² alu ${cable.name}`,
            category: "Électricité",
          },
          {
            name: `$alu240_${cable.name.replace(/\s+/g, "_")}`,
            value: toNumber(cable.alu_240),
            label: `240² alu ${cable.name}`,
            category: "Électricité",
          },
          {
            name: `$alu400_${cable.name.replace(/\s+/g, "_")}`,
            value: toNumber(cable.alu_400),
            label: `400² alu ${cable.name}`,
            category: "Électricité",
          },
          {
            name: `$cu95_${cable.name.replace(/\s+/g, "_")}`,
            value: toNumber(cable.cu_95),
            label: `95² cu ${cable.name}`,
            category: "Électricité",
          },
          {
            name: `$cu150_${cable.name.replace(/\s+/g, "_")}`,
            value: toNumber(cable.cu_150),
            label: `150² cu ${cable.name}`,
            category: "Électricité",
          },
          {
            name: `$cu240_${cable.name.replace(/\s+/g, "_")}`,
            value: toNumber(cable.cu_240),
            label: `240² cu ${cable.name}`,
            category: "Électricité",
          }
        );
      });

      // Totals for HTA cables (with safe number conversion)
      const sum_alu95 = calculatorData.hta_cables.reduce((sum, c) => sum + toNumber(c.alu_95), 0);
      const sum_alu150 = calculatorData.hta_cables.reduce((sum, c) => sum + toNumber(c.alu_150), 0);
      const sum_alu240 = calculatorData.hta_cables.reduce((sum, c) => sum + toNumber(c.alu_240), 0);
      const sum_alu400 = calculatorData.hta_cables.reduce((sum, c) => sum + toNumber(c.alu_400), 0);
      const sum_cu95 = calculatorData.hta_cables.reduce((sum, c) => sum + toNumber(c.cu_95), 0);
      const sum_cu150 = calculatorData.hta_cables.reduce((sum, c) => sum + toNumber(c.cu_150), 0);
      const sum_cu240 = calculatorData.hta_cables.reduce((sum, c) => sum + toNumber(c.cu_240), 0);

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
