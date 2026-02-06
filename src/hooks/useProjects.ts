import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Project {
  id: string;
  name: string;
  department: string | null;
  n_wtg: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  quote_count?: number;
  latest_update?: string;
}

export interface QuoteVersion {
  id: string;
  project_id: string;
  version_label: string;
  type: string;
  date_creation: string;
  last_update: string;
  total_amount: number;
  comment: string | null;
  is_starred: boolean;
}

export function useProjects() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          quote_versions (
            id,
            last_update
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Calculer le compteur et la dernière date de MAJ
      return (data as any[]).map((project) => {
        const quoteVersions = project.quote_versions || [];
        const quote_count = quoteVersions.length;
        const latest_update = quoteVersions.length > 0
          ? quoteVersions.reduce((latest: string, qv: any) => {
              const qvDate = new Date(qv.last_update || 0).getTime();
              const latestDate = new Date(latest || 0).getTime();
              return qvDate > latestDate ? qv.last_update : latest;
            }, quoteVersions[0].last_update)
          : null;
        
        const { quote_versions, ...projectData } = project;
        return {
          ...projectData,
          quote_count,
          latest_update,
        } as Project;
      });
    },
  });

  const createProject = useMutation({
    mutationFn: async (newProject: Omit<Project, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("projects")
        .insert([newProject])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Projet créé",
        description: "Le projet a été créé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Projet modifié",
        description: "Le projet a été modifié avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Projet supprimé",
        description: "Le projet a été supprimé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    projects,
    isLoading,
    createProject: createProject.mutate,
    updateProject: updateProject.mutate,
    deleteProject: deleteProject.mutate,
    isCreating: createProject.isPending,
    isUpdating: updateProject.isPending,
    isDeleting: deleteProject.isPending,
  };
}

export function useQuoteVersions(projectId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ["quote-versions", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("quote_versions")
        .select("*")
        .eq("project_id", projectId)
        .order("date_creation", { ascending: false });

      if (error) throw error;
      return data as QuoteVersion[];
    },
    enabled: !!projectId,
  });

  const createQuoteVersion = useMutation({
    mutationFn: async (newVersion: Omit<QuoteVersion, "id" | "created_at" | "updated_at" | "date_creation" | "last_update">) => {
      // Create quote version
      const { data: versionData, error: versionError } = await supabase
        .from("quote_versions")
        .insert([newVersion])
        .select()
        .single();

      if (versionError) throw versionError;

      // Create default lots for this quote version
      const defaultLots = [
        { code: "terrassement", label: "Terrassement", order_index: 0 },
        { code: "renforcement_sol", label: "Renforcement de sol", order_index: 1 },
        { code: "fondations", label: "Fondations", order_index: 2 },
        { code: "electricite", label: "Électricité", order_index: 3 },
        { code: "turbinier", label: "Turbinier", order_index: 4 },
      ];

      const lotsToInsert = defaultLots.map(lot => ({
        quote_version_id: versionData.id,
        code: lot.code,
        label: lot.label,
        order_index: lot.order_index,
      }));

      const { error: lotsError } = await supabase
        .from("lots")
        .insert(lotsToInsert);

      if (lotsError) throw lotsError;

      return versionData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-versions", projectId] });
      toast({
        title: "Chiffrage créé",
        description: "Le chiffrage a été créé avec succès avec les lots de base",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteQuoteVersion = useMutation({
    mutationFn: async (versionId: string) => {
      // Récupérer les lots de ce quote_version
      const { data: lots, error: lotsError } = await supabase
        .from("lots")
        .select("id")
        .eq("quote_version_id", versionId);

      if (lotsError) throw lotsError;

      const lotIds = lots?.map((lot) => lot.id) || [];

      // Supprimer les lignes liées
      if (lotIds.length > 0) {
        const { error: linesError } = await supabase
          .from("quote_lines")
          .delete()
          .in("lot_id", lotIds);
        
        if (linesError) throw linesError;

        // Supprimer les sections liées
        const { error: sectionsError } = await supabase
          .from("quote_sections")
          .delete()
          .in("lot_id", lotIds);
        
        if (sectionsError) throw sectionsError;

        // Supprimer les lots
        const { error: lotsDeleteError } = await supabase
          .from("lots")
          .delete()
          .in("id", lotIds);
        
        if (lotsDeleteError) throw lotsDeleteError;
      }

      // Supprimer les settings
      const { error: settingsError } = await supabase
        .from("quote_settings")
        .delete()
        .eq("quote_version_id", versionId);
      
      if (settingsError) throw settingsError;

      // Supprimer les calculator_variables
      const { error: varsError } = await supabase
        .from("calculator_variables")
        .delete()
        .eq("quote_version_id", versionId);
      
      if (varsError) throw varsError;

      // Supprimer le quote_version
      const { error: versionError } = await supabase
        .from("quote_versions")
        .delete()
        .eq("id", versionId);

      if (versionError) throw versionError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-versions", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Chiffrage supprimé",
        description: "Le chiffrage a été supprimé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const duplicateQuoteVersion = useMutation({
    mutationFn: async ({ sourceVersionId, newLabel }: { sourceVersionId: string; newLabel: string }) => {
      // 1. Récupérer la version source
      const { data: sourceVersion, error: versionError } = await supabase
        .from("quote_versions")
        .select("*")
        .eq("id", sourceVersionId)
        .single();

      if (versionError) throw versionError;

      // 2. Créer la nouvelle version
      const { data: newVersion, error: newVersionError } = await supabase
        .from("quote_versions")
        .insert([{
          project_id: sourceVersion.project_id,
          version_label: newLabel,
          type: sourceVersion.type,
          comment: sourceVersion.comment,
          total_amount: sourceVersion.total_amount,
        }])
        .select()
        .single();

      if (newVersionError) throw newVersionError;

      // 3. Récupérer et copier les lots
      const { data: sourceLots, error: lotsError } = await supabase
        .from("lots")
        .select("*")
        .eq("quote_version_id", sourceVersionId)
        .order("order_index");

      if (lotsError) throw lotsError;

      const lotMapping: Record<string, string> = {};

      for (const lot of sourceLots || []) {
        const { data: newLot, error: newLotError } = await supabase
          .from("lots")
          .insert([{
            quote_version_id: newVersion.id,
            code: lot.code,
            label: lot.label,
            description: lot.description,
            header_comment: lot.header_comment,
            order_index: lot.order_index,
            is_enabled: lot.is_enabled,
          }])
          .select()
          .single();

        if (newLotError) throw newLotError;
        lotMapping[lot.id] = newLot.id;
      }

      // 4. Récupérer et copier les sections
      const { data: sourceSections, error: sectionsError } = await supabase
        .from("quote_sections")
        .select("*")
        .in("lot_id", Object.keys(lotMapping))
        .order("order_index");

      if (sectionsError) throw sectionsError;

      const sectionMapping: Record<string, string> = {};

      for (const section of sourceSections || []) {
        const { data: newSection, error: newSectionError } = await supabase
          .from("quote_sections")
          .insert([{
            lot_id: lotMapping[section.lot_id],
            name: section.name,
            is_multiple: section.is_multiple,
            multiplier: section.multiplier,
            order_index: section.order_index,
            linked_field: section.linked_field,
          }])
          .select()
          .single();

        if (newSectionError) throw newSectionError;
        sectionMapping[section.id] = newSection.id;
      }

      // 5. Récupérer et copier les lignes
      const { data: sourceLines, error: linesError } = await supabase
        .from("quote_lines")
        .select("*")
        .in("lot_id", Object.keys(lotMapping))
        .order("order_index");

      if (linesError) throw linesError;

      for (const line of sourceLines || []) {
        await supabase
          .from("quote_lines")
          .insert([{
            lot_id: lotMapping[line.lot_id],
            section_id: line.section_id ? sectionMapping[line.section_id] : null,
            code: line.code,
            designation: line.designation,
            unit: line.unit,
            quantity: line.quantity,
            quantity_formula: line.quantity_formula,
            unit_price: line.unit_price,
            total_price: line.total_price,
            price_source: line.price_source,
            linked_variable: line.linked_variable,
            comment: line.comment,
            order_index: line.order_index,
          }]);
      }

      // 6. Copier les documents de référence
      const { data: sourceDocs, error: docsError } = await supabase
        .from("reference_documents")
        .select("*")
        .eq("version_id", sourceVersionId);

      if (docsError) throw docsError;

      if (sourceDocs && sourceDocs.length > 0) {
        await supabase
          .from("reference_documents")
          .insert(
            sourceDocs.map((doc) => ({
              version_id: newVersion.id,
              label: doc.label,
              reference: doc.reference,
              comment: doc.comment,
            }))
          );
      }

      // 6. Copier les settings
      const { data: sourceSettings, error: settingsError } = await supabase
        .from("quote_settings")
        .select("*")
        .eq("quote_version_id", sourceVersionId)
        .maybeSingle();

      if (settingsError) throw settingsError;

      if (sourceSettings) {
        await supabase
          .from("quote_settings")
          .insert([{
            quote_version_id: newVersion.id,
            n_wtg: sourceSettings.n_wtg,
            n_foundations: sourceSettings.n_foundations,
            turbine_model: sourceSettings.turbine_model,
            turbine_power: sourceSettings.turbine_power,
            hub_height: sourceSettings.hub_height,
            settings: sourceSettings.settings,
            calculator_data: sourceSettings.calculator_data,
          }]);
      }

      // 7. Copier les calculator_variables
      const { data: sourceVars, error: varsError } = await supabase
        .from("calculator_variables")
        .select("*")
        .eq("quote_version_id", sourceVersionId);

      if (varsError) throw varsError;

      if (sourceVars && sourceVars.length > 0) {
        await supabase
          .from("calculator_variables")
          .insert(
            sourceVars.map((v) => ({
              quote_version_id: newVersion.id,
              project_id: v.project_id,
              variable_name: v.variable_name,
              full_name: v.full_name,
              value: v.value,
            }))
          );
      }

      return newVersion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-versions", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Chiffrage dupliqué",
        description: "Le chiffrage a été dupliqué avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const renameQuoteVersion = useMutation({
    mutationFn: async ({ versionId, newLabel }: { versionId: string; newLabel: string }) => {
      const { error } = await supabase
        .from("quote_versions")
        .update({ version_label: newLabel })
        .eq("id", versionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-versions", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Chiffrage renommé" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const toggleStarQuoteVersion = useMutation({
    mutationFn: async ({ versionId, isStarred }: { versionId: string; isStarred: boolean }) => {
      const { error } = await supabase
        .from("quote_versions")
        .update({ is_starred: isStarred })
        .eq("id", versionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-versions", projectId] });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  return {
    ...query,
    createQuoteVersion: createQuoteVersion.mutate,
    isCreatingQuote: createQuoteVersion.isPending,
    deleteQuoteVersion: deleteQuoteVersion.mutate,
    isDeletingQuote: deleteQuoteVersion.isPending,
    duplicateQuoteVersion: duplicateQuoteVersion.mutate,
    isDuplicatingQuote: duplicateQuoteVersion.isPending,
    renameQuoteVersion: renameQuoteVersion.mutate,
    isRenamingQuote: renameQuoteVersion.isPending,
    toggleStarQuoteVersion: toggleStarQuoteVersion.mutate,
  };
}
