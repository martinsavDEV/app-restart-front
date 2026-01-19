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

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const parts = name.split(" ");
      return parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
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
    <div className="space-y-4">
      {/* Comments list */}
      <div className={cn("space-y-3", compact && "max-h-48 overflow-y-auto")}>
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            Aucun commentaire
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent shrink-0">
                {getInitials(comment.user_name, comment.user_email)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-foreground">
                    {comment.user_name || comment.user_email.split("@")[0]}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {format(new Date(comment.created_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
                  </span>
                </div>
                
                {editingId === comment.id ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[60px] text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        className="h-7 px-2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={updateComment.isPending}
                        className="h-7 px-2"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                )}
              </div>

              {comment.user_id === currentUserId && editingId !== comment.id && (
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => handleStartEdit(comment)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(comment.id)}
                    disabled={deleteComment.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ajouter un commentaire..."
          className={cn("flex-1 resize-none", compact ? "min-h-[60px]" : "min-h-[80px]")}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!newComment.trim() || createComment.isPending}
          className="shrink-0"
        >
          {createComment.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
};
