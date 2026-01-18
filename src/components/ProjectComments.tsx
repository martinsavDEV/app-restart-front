import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useProjectComments, type ProjectComment } from "@/hooks/useProjectComments";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Send, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectCommentsProps {
  projectId: string;
}

const CommentItem = ({
  comment,
  canDelete,
  onDelete,
  isDeleting,
}: {
  comment: ProjectComment;
  canDelete: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}) => {
  const displayName = comment.user_name || comment.user_email.split("@")[0];
  const initials = displayName
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  return (
    <div className="flex gap-3 p-3 rounded-lg bg-muted/50 group">
      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent shrink-0">
        {initials || "U"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-foreground truncate">
            {displayName}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {format(new Date(comment.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
          </span>
        </div>
        <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
            "text-muted-foreground hover:text-destructive"
          )}
          onClick={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </Button>
      )}
    </div>
  );
};

export const ProjectComments = ({ projectId }: ProjectCommentsProps) => {
  const [newComment, setNewComment] = useState("");
  const {
    comments,
    isLoading,
    createComment,
    isCreating,
    deleteComment,
    isDeleting,
    currentUserId,
  } = useProjectComments(projectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    createComment(newComment.trim(), {
      onSuccess: () => setNewComment(""),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          placeholder="Ajouter un commentaire..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[60px] resize-none text-sm"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() || isCreating}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-1.5" />
            )}
            Envoyer
          </Button>
        </div>
      </form>

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucun commentaire pour le moment
        </p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              canDelete={comment.user_id === currentUserId}
              onDelete={() => deleteComment(comment.id)}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  );
};
