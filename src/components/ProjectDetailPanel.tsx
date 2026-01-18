import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuoteVersionCard } from "@/components/QuoteVersionCard";
import { ProjectComments } from "@/components/ProjectComments";
import { Plus, FileDown, FileText, Wind, MapPin, Zap, MessageSquare } from "lucide-react";

interface QuoteVersion {
  id: string;
  version_label: string;
  total_amount?: number | null;
  date_creation?: string | null;
  last_update?: string | null;
  comment?: string | null;
  type?: string | null;
}

interface Project {
  id: string;
  name: string;
  department?: string | null;
  n_wtg?: number | null;
  description?: string | null;
}

interface ProjectDetailPanelProps {
  project: Project;
  versions: QuoteVersion[];
  activeVersionId?: string | null;
  onOpenPricing: (versionId: string) => void;
  onCreateVersion: () => void;
  isLoadingVersions?: boolean;
}

export const ProjectDetailPanel = ({
  project,
  versions,
  activeVersionId,
  onOpenPricing,
  onCreateVersion,
  isLoadingVersions,
}: ProjectDetailPanelProps) => {
  // Calculate estimated power
  const estimatedPower = project.n_wtg ? project.n_wtg * 3 : null; // Assuming 3MW per turbine

  // Get active version
  const activeVersion = versions.find((v) => v.id === activeVersionId) || versions[0];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{project.name}</h2>
            {project.department && (
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                {project.department}
              </div>
            )}
          </div>
          <Badge variant="outline" className="bg-status-active-bg text-status-active border-0">
            Actif
          </Badge>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-muted-foreground mt-3">{project.description}</p>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wide">Puissance</span>
            </div>
            <div className="font-mono text-lg font-semibold text-foreground">
              {estimatedPower ? `${estimatedPower} MW` : "-"}
            </div>
          </div>

          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Wind className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wide">Éoliennes</span>
            </div>
            <div className="font-mono text-lg font-semibold text-foreground">
              {project.n_wtg || "-"}
            </div>
          </div>

          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
              Versions
            </div>
            <div className="font-mono text-lg font-semibold text-foreground">
              {versions.length}
            </div>
          </div>
        </div>
      </div>

      {/* Versions list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">Versions de chiffrage</h3>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={onCreateVersion}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Nouvelle v.
            </Button>
          </div>

          {isLoadingVersions ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Chargement...
            </div>
          ) : versions.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Aucune version de chiffrage
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <QuoteVersionCard
                  key={version.id}
                  version={version}
                  isActive={version.id === activeVersion?.id}
                  onOpen={() => onOpenPricing(version.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Comments section */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">Commentaires</h3>
          </div>
          <ProjectComments projectId={project.id} />
        </div>
      </div>

      {/* Actions footer */}
      <div className="p-4 border-t border-border flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-xs">
          <FileDown className="w-3.5 h-3.5 mr-1.5" />
          Export XLSX
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-xs">
          <FileText className="w-3.5 h-3.5 mr-1.5" />
          Générer PDF
        </Button>
      </div>
    </div>
  );
};
