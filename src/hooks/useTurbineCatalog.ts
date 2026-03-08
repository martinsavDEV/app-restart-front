import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TurbineCatalogEntry {
  id: string;
  manufacturer: string;
  model: string;
  created_at: string;
}

export interface FoundationHistoryEntry {
  id: string;
  turbine_id: string;
  hub_height: number | null;
  diametre_fondation: number | null;
  marge_securite: number | null;
  pente_talus: string | null;
  hauteur_cage: number | null;
  project_name: string | null;
  notes: string | null;
  created_at: string;
}

export const useTurbineCatalog = () => {
  const queryClient = useQueryClient();

  const catalogQuery = useQuery({
    queryKey: ["turbine-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turbine_catalog")
        .select("*")
        .order("manufacturer")
        .order("model");
      if (error) throw error;
      return data as TurbineCatalogEntry[];
    },
  });

  const addTurbineModel = useMutation({
    mutationFn: async (entry: { manufacturer: string; model: string }) => {
      const { data, error } = await supabase
        .from("turbine_catalog")
        .insert(entry)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turbine-catalog"] });
    },
  });

  const deleteTurbineModel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("turbine_catalog").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["turbine-catalog"] });
      queryClient.invalidateQueries({ queryKey: ["foundation-history"] });
    },
  });

  return { catalogQuery, addTurbineModel, deleteTurbineModel };
};

export const useFoundationHistory = (turbineId: string | null) => {
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ["foundation-history", turbineId],
    queryFn: async () => {
      if (!turbineId) return [];
      const { data, error } = await supabase
        .from("foundation_history")
        .select("*")
        .eq("turbine_id", turbineId)
        .order("hub_height", { ascending: true });
      if (error) throw error;
      return data as FoundationHistoryEntry[];
    },
    enabled: !!turbineId,
  });

  const addHistory = useMutation({
    mutationFn: async (entry: Omit<FoundationHistoryEntry, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("foundation_history")
        .insert(entry)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foundation-history", turbineId] });
    },
  });

  const updateHistory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FoundationHistoryEntry> & { id: string }) => {
      const { error } = await supabase
        .from("foundation_history")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foundation-history", turbineId] });
    },
  });

  const deleteHistory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("foundation_history").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foundation-history", turbineId] });
    },
  });

  return { historyQuery, addHistory, updateHistory, deleteHistory };
};
