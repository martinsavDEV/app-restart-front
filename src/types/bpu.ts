import { z } from "zod";

export const bpuLineSchema = z.object({
  id: z.string(),
  designation: z.string().min(1, "La désignation est requise").max(200),
  quantity: z.number().min(0, "La quantité doit être positive"),
  unit: z.string().min(1, "L'unité est requise").max(20),
  unitPrice: z.number().min(0, "Le prix unitaire doit être positif"),
  priceSource: z.string().optional(),
});

export type BPULine = z.infer<typeof bpuLineSchema>;

export interface WorkSection {
  id: string;
  title: string;
  description?: string;
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
