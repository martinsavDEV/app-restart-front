import { useState } from "react";
import { useQuoteComments, QuoteComment } from "@/hooks/useQuoteComments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Trash2, Pencil, X, Check, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface QuoteCommentsProps {
  quoteVersionId: string | null;
  compact?: boolean;
}

export const QuoteComments = ({ quoteVersionId, compact = false }: QuoteCommentsProps) => {
  const { comments, isLoading, createComment, updateComment, deleteComment, currentUserId } = 
    useQuoteComments(quoteVersionId);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    try {
      await createComment.mutateAsync(newComment.trim());
      setNewComment("");
    } catch (error) {
      console.error("Error creating comment:", error);
    }
  };

  const handleStartEdit = (comment: QuoteComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    
    try {
      await updateComment.mutateAsync({ id, content: editContent.trim() });
      setEditingId(null);
      setEditContent("");
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteComment.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const getInitials = (name: string | null) => {
    if (name) {
      const parts = name.split(" ");
      return parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  if (!quoteVersionId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ajouter un commentaire..."
          className={cn("flex-1 resize-none text-xs", compact ? "min-h-[36px] py-1.5 px-2" : "min-h-[80px]")}
          rows={compact ? 1 : undefined}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!newComment.trim() || createComment.isPending}
          className={cn("shrink-0", compact && "h-8 w-8")}
        >
          {createComment.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </Button>
      </form>

      {/* Comments list */}
      {comments.length > 0 && (
        <div className={cn("space-y-2", compact && "max-h-36 overflow-y-auto space-y-1.5")}>
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={cn("flex gap-2 rounded-md bg-background/50", compact ? "p-1.5" : "p-3 gap-3 bg-muted/50 rounded-lg")}
            >
              {!compact && (
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent shrink-0">
                  {getInitials(comment.user_name)}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={cn("font-medium text-foreground", compact ? "text-[11px]" : "text-sm")}>
                    {comment.user_name || "Utilisateur"}
                  </span>
                  <span className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-[11px]")}>
                    {format(new Date(comment.created_at), "dd/MM à HH:mm", { locale: fr })}
                  </span>
                </div>
                
                {editingId === comment.id ? (
                  <div className="mt-1 space-y-1">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[36px] text-xs py-1 px-2"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-6 px-1.5">
                        <X className="w-3 h-3" />
                      </Button>
                      <Button size="sm" onClick={() => handleSaveEdit(comment.id)} disabled={updateComment.isPending} className="h-6 px-1.5">
                        <Check className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className={cn("text-foreground/80 whitespace-pre-wrap", compact ? "text-[11px] mt-0.5" : "text-sm mt-1")}>
                    {comment.content}
                  </p>
                )}
              </div>

              {comment.user_id === currentUserId && editingId !== comment.id && (
                <div className="flex gap-0.5 shrink-0">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => handleStartEdit(comment)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(comment.id)} disabled={deleteComment.isPending}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
