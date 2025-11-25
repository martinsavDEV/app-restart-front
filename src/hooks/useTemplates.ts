import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WorkLot } from "@/types/bpu";
import { useToast } from "@/hooks/use-toast";

export const useTemplates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lot_templates")
        .select("*")
        .order("code", { ascending: true })
        .order("label", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (template: { code: string; label: string; description?: string; template_lines: WorkLot }) => {
      const { data, error } = await supabase
        .from("lot_templates")
        .insert({
          code: template.code,
          label: template.label,
          description: template.description || null,
          template_lines: template.template_lines as any,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({
        title: "Template créé",
        description: "Le template a été créé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le template: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, template }: { id: string; template: { code: string; label: string; description?: string; template_lines: WorkLot } }) => {
      const { data, error } = await supabase
        .from("lot_templates")
        .update({
          code: template.code,
          label: template.label,
          description: template.description || null,
          template_lines: template.template_lines as any,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({
        title: "Template mis à jour",
        description: "Le template a été modifié avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le template: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lot_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({
        title: "Template supprimé",
        description: "Le template a été supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le template: " + error.message,
        variant: "destructive",
      });
    },
  });

  const duplicateTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { data: original, error: fetchError } = await supabase
        .from("lot_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from("lot_templates")
        .insert({
          code: original.code,
          label: `${original.label} (copie)`,
          description: original.description,
          template_lines: original.template_lines,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast({
        title: "Template dupliqué",
        description: "Le template a été dupliqué avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de dupliquer le template: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
  };
};
