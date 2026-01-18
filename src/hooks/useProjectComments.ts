import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ProjectComment {
  id: string;
  project_id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  content: string;
  created_at: string;
}

export function useProjectComments(projectId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["project-comments", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("project_comments")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProjectComment[];
    },
    enabled: !!projectId,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!projectId || !user) throw new Error("Projet ou utilisateur manquant");

      const { data, error } = await supabase
        .from("project_comments")
        .insert({
          project_id: projectId,
          user_id: user.id,
          user_email: user.email || "unknown@email.com",
          user_name: user.user_metadata?.full_name || null,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-comments", projectId] });
      toast.success("Commentaire ajouté");
    },
    onError: (error) => {
      console.error("Error creating comment:", error);
      toast.error("Erreur lors de l'ajout du commentaire");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("project_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-comments", projectId] });
      toast.success("Commentaire supprimé");
    },
    onError: (error) => {
      console.error("Error deleting comment:", error);
      toast.error("Erreur lors de la suppression du commentaire");
    },
  });

  return {
    comments,
    isLoading,
    createComment: createCommentMutation.mutate,
    isCreating: createCommentMutation.isPending,
    deleteComment: deleteCommentMutation.mutate,
    isDeleting: deleteCommentMutation.isPending,
    currentUserId: user?.id,
  };
}
