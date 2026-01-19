import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface QuoteComment {
  id: string;
  quote_version_id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  content: string;
  created_at: string;
}

export function useQuoteComments(quoteVersionId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: comments = [], isLoading, error } = useQuery({
    queryKey: ["quote_comments", quoteVersionId],
    queryFn: async () => {
      if (!quoteVersionId) return [];
      
      const { data, error } = await supabase
        .from("quote_comments")
        .select("*")
        .eq("quote_version_id", quoteVersionId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as QuoteComment[];
    },
    enabled: !!quoteVersionId,
  });

  const createComment = useMutation({
    mutationFn: async (content: string) => {
      if (!quoteVersionId || !user) throw new Error("Missing required data");
      
      const { data, error } = await supabase
        .from("quote_comments")
        .insert({
          quote_version_id: quoteVersionId,
          user_id: user.id,
          user_email: user.email || "",
          user_name: user.user_metadata?.full_name || user.email?.split("@")[0] || null,
          content,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote_comments", quoteVersionId] });
    },
  });

  const updateComment = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data, error } = await supabase
        .from("quote_comments")
        .update({ content })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote_comments", quoteVersionId] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("quote_comments")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote_comments", quoteVersionId] });
    },
  });

  return {
    comments,
    isLoading,
    error,
    createComment,
    updateComment,
    deleteComment,
    currentUserId: user?.id,
  };
}
