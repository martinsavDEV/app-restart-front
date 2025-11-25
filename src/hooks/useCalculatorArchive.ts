import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalculatorVariable } from "@/types/bpu";
import { toast } from "sonner";

/**
 * Hook to archive Calculator variables to the calculator_variables table
 * for historical traceability
 */
export const useCalculatorArchive = () => {
  const queryClient = useQueryClient();

  const archiveVariables = useMutation({
    mutationFn: async ({
      variables,
      quoteVersionId,
      projectId,
      projectName,
      versionLabel,
    }: {
      variables: CalculatorVariable[];
      quoteVersionId: string;
      projectId: string;
      projectName: string;
      versionLabel: string;
    }) => {
      // Delete existing archives for this quote version to avoid duplicates
      await supabase
        .from("calculator_variables")
        .delete()
        .eq("quote_version_id", quoteVersionId);

      // Create archive entries with full names
      const archiveData = variables.map((variable) => ({
        variable_name: variable.name,
        full_name: `${variable.name.replace("$", "")}_${projectName}_${versionLabel}`,
        value: variable.value,
        quote_version_id: quoteVersionId,
        project_id: projectId,
      }));

      const { error } = await supabase
        .from("calculator_variables")
        .insert(archiveData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calculator-variables"] });
    },
    onError: (error) => {
      console.error("Error archiving calculator variables:", error);
      toast.error("Erreur lors de l'archivage des variables");
    },
  });

  return {
    archiveVariables: archiveVariables.mutate,
    isArchiving: archiveVariables.isPending,
  };
};
