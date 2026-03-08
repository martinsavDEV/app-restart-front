import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useQuoteCommentCounts(versionIds: string[]) {
  return useQuery({
    queryKey: ["quote_comment_counts", versionIds],
    queryFn: async () => {
      if (versionIds.length === 0) return new Map<string, number>();

      const { data, error } = await supabase
        .from("quote_comments")
        .select("quote_version_id")
        .in("quote_version_id", versionIds);

      if (error) throw error;

      const counts = new Map<string, number>();
      for (const row of data || []) {
        counts.set(row.quote_version_id, (counts.get(row.quote_version_id) || 0) + 1);
      }
      return counts;
    },
    enabled: versionIds.length > 0,
  });
}
