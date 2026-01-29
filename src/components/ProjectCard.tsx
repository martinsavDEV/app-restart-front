import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Wind } from "lucide-react";

interface Project {
  id: string;
  name: string;
  department?: string | null;
  n_wtg?: number | null;
  description?: string | null;
  quote_count?: number;
  latest_update?: string | null;
}

interface ProjectCardProps {
  project: Project;
  isActive: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProjectCard = ({
  project,
  isActive,
  onClick,
  onEdit,
  onDelete,
}: ProjectCardProps) => {
  // Get initials from project name
  const initials = project.name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");

  const nbVersions = project.quote_count || 0;
  
  // Format the latest update date
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-lg transition-all duration-200",
        "bg-card border border-border hover:border-accent/50",
        "group relative",
        isActive && "border-accent bg-accent/5"
      )}
    >
      {/* Clickable area */}
      <button
        onClick={onClick}
        className="absolute inset-0 z-0"
        aria-label={`Sélectionner le projet ${project.name}`}
      />

      {/* Thumbnail */}
      <div
        className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 z-10",
          "bg-muted text-muted-foreground font-semibold text-sm",
          isActive && "bg-accent/20 text-accent"
        )}
      >
        {initials || "PR"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">{project.name}</span>
          {isActive && (
            <Badge
              variant="outline"
              className="bg-status-active-bg text-status-active border-0 text-[10px] px-1.5 py-0"
            >
              Actif
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {project.department && <span>{project.department}</span>}
          {project.n_wtg && (
            <span className="flex items-center gap-1">
              <Wind className="w-3 h-3" />
              {project.n_wtg} éoliennes
            </span>
          )}
        </div>
      </div>

      {/* Versions & Last Update */}
      <div className="text-right shrink-0 z-10 pointer-events-none">
        <div className="text-xs font-medium text-foreground">
          {nbVersions} version{nbVersions !== 1 ? "s" : ""}
        </div>
        {project.latest_update ? (
          <div className="text-[11px] text-muted-foreground mt-0.5">
            MAJ: {formatDate(project.latest_update)}
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground mt-0.5">-</div>
        )}
      </div>

      {/* Actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 z-20 shrink-0",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "hover:bg-muted"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
