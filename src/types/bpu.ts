import { z } from "zod";

export const bpuLineSchema = z.object({
  id: z.string(),
  designation: z.string().min(1, "La désignation est requise").max(200),
  quantity: z.union([z.number().min(0, "La quantité doit être positive"), z.string()]),
  unit: z.string().min(1, "L'unité est requise").max(20),
  unitPrice: z.number().min(0, "Le prix unitaire doit être positif"),
  priceSource: z.string().optional(),
  linkedVariable: z.string().optional(),
  quantity_formula: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
});

export type BPULine = z.infer<typeof bpuLineSchema>;

export interface WorkSection {
  id: string;
  title: string;
  description?: string;
  is_multiple?: boolean;
  multiplier?: number;
  lines: BPULine[];
}

export interface WorkLot {
  id: string;
  name: string;
  description: string;
  sections: WorkSection[];
}

export interface CAPEXSummary {
  terrassement: number;
  reinforcement: number;
  foundations: number;
  electricity: number;
  turbine: number;
  subtotal: number;
  contingency: number;
  total: number;
}

// Calculator Types
export interface TurbineData {
  name: string; // E01, E02, etc.
  surf_PF: number;
  acces_PF: number;
  m3_bouger: number;
  bypass: number;
  fondation_type: string; // "en eau" | "sans eau"
  g2avp: string;
  substitution: number;
  commentaire: string;
}

export interface AccessSegment {
  name: string; // "Accès E03", "E03-E01", etc.
  longueur?: number; // deprecated, kept for backward compat
  surface: number;
  renforcement: string; // "refresh" | "traitement"
  gnt: boolean;
  bicouche: number;
  enrobe: number;
}

export interface HTACableSegment {
  name: string; // "PDL E03", "E03 E01", etc.
  alu_95: number;
  alu_150: number;
  alu_240: number;
  alu_300: number;
  alu_400: number;
  cu_95: number;
  cu_150: number;
  cu_240: number;
  cu_300: number;
  cu_400: number;
  custom_cables?: Array<{ section: string; material: string; length: number }>;
}

export interface CalculatorData {
  global: {
    nb_eol: number;
    typ_eol: string;
    tension_hta?: string; // "20kV" | "30kV"
  };
  turbines: TurbineData[];
  access_segments: AccessSegment[];
  hta_cables: HTACableSegment[];
  design: {
    diametre_fondation: number | null;
    marge_securite: number;      // 1.0 ou 1.5 ou valeur custom
    pente_talus: string;         // "1:1" | "3:2" | ratio custom
    hauteur_cage: number;        // défaut 3.5m
  };
}

export interface CalculatorVariable {
  name: string; // $surf_PF_E01
  value: number;
  label: string; // "Surface PF E01"
  category: string; // "Éoliennes", "Accès", "Totaux"
}
