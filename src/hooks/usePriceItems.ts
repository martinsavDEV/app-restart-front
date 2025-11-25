import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PriceItem {
  id: string;
  item_id?: string;
  item: string;
  unit: string;
  unit_price: number;
  date_modif?: string;
  lot_code: string;
  price_reference?: string;
  created_at: string;
  updated_at: string;
}

export const usePriceItems = (lotCode?: string) => {
  const queryClient = useQueryClient();

  const { data: priceItems, isLoading } = useQuery({
    queryKey: ["price-items", lotCode],
    queryFn: async () => {
      let query = supabase
        .from("price_items")
        .select("*")
        .order("item");

      if (lotCode) {
        query = query.eq("lot_code", lotCode);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PriceItem[];
    },
  });

  const createPriceItem = useMutation({
    mutationFn: async (newItem: Omit<PriceItem, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("price_items").insert(newItem);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-items"] });
      toast.success("Prix ajouté");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout");
      console.error(error);
    },
  });

  const updatePriceItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PriceItem> & { id: string }) => {
      const { error } = await supabase
        .from("price_items")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-items"] });
      toast.success("Prix mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });

  const deletePriceItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("price_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-items"] });
      toast.success("Prix supprimé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });

  return {
    priceItems: priceItems || [],
    isLoading,
    createPriceItem: createPriceItem.mutate,
    updatePriceItem: updatePriceItem.mutate,
    deletePriceItem: deletePriceItem.mutate,
    isCreating: createPriceItem.isPending,
    isUpdating: updatePriceItem.isPending,
    isDeleting: deletePriceItem.isPending,
  };
};
