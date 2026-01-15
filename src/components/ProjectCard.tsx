import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Wind } from "lucide-react";

interface Project {
  id: string;
  name: string;
  department?: string | null;
  n_wtg?: number | null;
  description?: string | null;
  quote_versions?: { id: string; last_update: string | null }[];
}

interface ProjectCardProps {
  project: Project;
  isActive: boolean;
  onClick: () => void;
  estimatedBudget?: number;
}

export const ProjectCard = ({ project, isActive, onClick, estimatedBudget }: ProjectCardProps) => {
  // Get initials from project name
  const initials = project.name
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");

  const nbVersions = project.quote_versions?.length || 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-lg transition-all duration-200",
        "bg-card border border-border hover:border-accent/50",
        "text-left group",
        isActive && "border-accent bg-accent/5"
      )}
    >
      {/* Thumbnail */}
      <div
        className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
          "bg-muted text-muted-foreground font-semibold text-sm",
          isActive && "bg-accent/20 text-accent"
        )}
      >
        {initials || "PR"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">{project.name}</span>
          {isActive && (
            <Badge variant="outline" className="bg-status-active-bg text-status-active border-0 text-[10px] px-1.5 py-0">
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

      {/* Budget & Versions */}
      <div className="text-right shrink-0">
        {estimatedBudget ? (
          <div className="font-mono text-sm font-medium text-foreground">
            {(estimatedBudget / 1000000).toFixed(1)}M €
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">-</div>
        )}
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {nbVersions} version{nbVersions !== 1 ? "s" : ""}
        </div>
      </div>
    </button>
  );
};
