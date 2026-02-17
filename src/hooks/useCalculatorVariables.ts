import { useMemo } from "react";
import { CalculatorData, CalculatorVariable } from "@/types/bpu";
import { calculateFoundationMetrics, calculateSubstitutionVolume } from "@/lib/foundationCalculations";

/** Helper to safely convert to number */
const toNumber = (val: unknown): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  return 0;
};

/**
 * Pure function to compute all calculator variables from CalculatorData.
 * Can be used outside of React (e.g. in useSummaryData for exports).
 */
export const computeCalculatorVariables = (calculatorData: CalculatorData | null): CalculatorVariable[] => {
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

  // Per-turbine variables
  let sumVolSubstitution = 0;
  calculatorData.turbines.forEach((turbine) => {
    const surfPF = toNumber(turbine.surf_PF);
    const accesPF = toNumber(turbine.acces_PF);
    const m3Bouger = toNumber(turbine.m3_bouger);
    const bypass = toNumber(turbine.bypass);
    const substitution = toNumber(turbine.substitution);

    vars.push(
      { name: `$surf_PF_${turbine.name}`, value: surfPF, label: `Surface PF ${turbine.name}`, category: "Éoliennes" },
      { name: `$acces_PF_${turbine.name}`, value: accesPF, label: `Accès PF ${turbine.name}`, category: "Éoliennes" },
      { name: `$m3_bouger_${turbine.name}`, value: m3Bouger, label: `m³ à bouger ${turbine.name}`, category: "Éoliennes" },
      { name: `$bypass_${turbine.name}`, value: bypass, label: `Bypass ${turbine.name}`, category: "Éoliennes" }
    );

    if (foundationMetrics && substitution > 0) {
      const volSub = calculateSubstitutionVolume(foundationMetrics.surfaceFondFouille, substitution);
      vars.push({
        name: `$vol_sub_${turbine.name}`,
        value: Math.round(volSub * 100) / 100,
        label: `Vol. substitution ${turbine.name} (m³)`,
        category: "Éoliennes",
      });
      sumVolSubstitution += volSub;
    }
  });

  // Totals for turbines
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

  // Access segments variables
  calculatorData.access_segments.forEach((segment) => {
    const segName = segment.name.replace(/\s+/g, "_");
    vars.push(
      { name: `$surface_${segName}`, value: toNumber(segment.surface), label: `Surface ${segment.name}`, category: "Accès" }
    );
    const gntValue = segment.gnt ? toNumber(segment.surface) : 0;
    vars.push(
      { name: `$gnt_${segName}`, value: gntValue, label: `GNT ${segment.name} (m²)`, category: "Accès" }
    );
  });

  // Totals for access segments
  const sum_surface_chemins = calculatorData.access_segments.reduce((sum, s) => sum + toNumber(s.surface), 0);
  const sum_GNT = calculatorData.access_segments.filter((s) => s.gnt).reduce((sum, s) => sum + toNumber(s.surface), 0);
  const sum_bicouche = calculatorData.access_segments.reduce((sum, s) => sum + toNumber(s.bicouche), 0);
  const sum_enrobe = calculatorData.access_segments.reduce((sum, s) => sum + toNumber(s.enrobe), 0);

  vars.push(
    { name: "$sum_surface_chemins", value: sum_surface_chemins, label: "Total Surface chemins", category: "Totaux" },
    { name: "$sum_GNT", value: sum_GNT, label: "Total Surface GNT (m²)", category: "Totaux" },
    { name: "$sum_bicouche", value: sum_bicouche, label: "Total Bicouche", category: "Totaux" },
    { name: "$sum_enrobe", value: sum_enrobe, label: "Total Enrobé", category: "Totaux" }
  );

  // HTA Cables variables
  if (calculatorData.hta_cables) {
    let totalLineaire = 0;

    calculatorData.hta_cables.forEach((cable) => {
      const cName = cable.name.replace(/\s+/g, "_");
      const fields = [
        { key: "alu_95", varPrefix: "alu95", label: "95² alu" },
        { key: "alu_150", varPrefix: "alu150", label: "150² alu" },
        { key: "alu_240", varPrefix: "alu240", label: "240² alu" },
        { key: "alu_300", varPrefix: "alu300", label: "300² alu" },
        { key: "alu_400", varPrefix: "alu400", label: "400² alu" },
        { key: "cu_95", varPrefix: "cu95", label: "95² cu" },
        { key: "cu_150", varPrefix: "cu150", label: "150² cu" },
        { key: "cu_240", varPrefix: "cu240", label: "240² cu" },
        { key: "cu_300", varPrefix: "cu300", label: "300² cu" },
        { key: "cu_400", varPrefix: "cu400", label: "400² cu" },
      ] as const;

      fields.forEach(({ key, varPrefix, label }) => {
        const val = toNumber((cable as any)[key]);
        vars.push({
          name: `$${varPrefix}_${cName}`,
          value: val,
          label: `${label} ${cable.name}`,
          category: "Électricité",
        });
      });

      // Custom cables per segment
      if (cable.custom_cables) {
        cable.custom_cables.forEach((cc) => {
          vars.push({
            name: `$custom_${cc.section}_${cc.material}_${cName}`,
            value: toNumber(cc.length),
            label: `${cc.section}² ${cc.material} ${cable.name}`,
            category: "Électricité",
          });
        });
      }
    });

    // Totals for HTA cables
    const sumFields = [
      { key: "alu_95", name: "$sum_alu95", label: "Total 95² alu (ml)" },
      { key: "alu_150", name: "$sum_alu150", label: "Total 150² alu (ml)" },
      { key: "alu_240", name: "$sum_alu240", label: "Total 240² alu (ml)" },
      { key: "alu_300", name: "$sum_alu300", label: "Total 300² alu (ml)" },
      { key: "alu_400", name: "$sum_alu400", label: "Total 400² alu (ml)" },
      { key: "cu_95", name: "$sum_cu95", label: "Total 95² cu (ml)" },
      { key: "cu_150", name: "$sum_cu150", label: "Total 150² cu (ml)" },
      { key: "cu_240", name: "$sum_cu240", label: "Total 240² cu (ml)" },
      { key: "cu_300", name: "$sum_cu300", label: "Total 300² cu (ml)" },
      { key: "cu_400", name: "$sum_cu400", label: "Total 400² cu (ml)" },
    ] as const;

    sumFields.forEach(({ key, name, label }) => {
      const total = calculatorData.hta_cables.reduce((sum, c) => sum + toNumber((c as any)[key]), 0);
      vars.push({ name, value: total, label, category: "Totaux" });
      totalLineaire += total;
    });

    // Custom cable totals
    const customTotals: Record<string, number> = {};
    calculatorData.hta_cables.forEach((cable) => {
      if (cable.custom_cables) {
        cable.custom_cables.forEach((cc) => {
          const key = `${cc.section}_${cc.material}`;
          customTotals[key] = (customTotals[key] || 0) + toNumber(cc.length);
          totalLineaire += toNumber(cc.length);
        });
      }
    });

    Object.entries(customTotals).forEach(([key, value]) => {
      const [section, material] = key.split("_");
      vars.push({
        name: `$sum_custom_${key}`,
        value,
        label: `Total ${section}² ${material} (ml)`,
        category: "Totaux",
      });
    });

    vars.push({
      name: "$sum_lineaire_hta",
      value: totalLineaire,
      label: "Total linéaire HTA (ml)",
      category: "Totaux",
    });
  }

  return vars;
};

/**
 * Hook to generate all available variables from Calculator data
 * and provide their current values
 */
export const useCalculatorVariables = (calculatorData: CalculatorData | null): {
  variables: CalculatorVariable[];
  getVariableValue: (varName: string) => number | null;
} => {
  const variables = useMemo(() => computeCalculatorVariables(calculatorData), [calculatorData]);

  const getVariableValue = (varName: string): number | null => {
    const variable = variables.find((v) => v.name === varName);
    return variable?.value ?? null;
  };

  return { variables, getVariableValue };
};
