import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuoteVersionCard } from "@/components/QuoteVersionCard";
import { QuoteComments } from "@/components/QuoteComments";
import { Plus, FileDown, FileText, MapPin, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuoteVersion {
  id: string;
  version_label: string;
  total_amount?: number | null;
  date_creation?: string | null;
  last_update?: string | null;
  comment?: string | null;
  type?: string | null;
  is_starred?: boolean;
  n_wtg?: number | null;
  turbine_power?: number | null;
  turbine_model?: string | null;
}

interface Project {
  id: string;
  name: string;
  department?: string | null;
  description?: string | null;
}

interface ProjectDetailPanelProps {
  project: Project;
  versions: QuoteVersion[];
  onOpenPricing: (versionId: string) => void;
  onCreateVersion: () => void;
  onDuplicateVersion?: (versionId: string, label: string) => void;
  onRenameVersion?: (versionId: string, label: string) => void;
  onDeleteVersion?: (versionId: string) => void;
  onToggleStarVersion?: (versionId: string, isStarred: boolean) => void;
  isLoadingVersions?: boolean;
}

export const ProjectDetailPanel = ({
  project,
  versions,
  onOpenPricing,
  onCreateVersion,
  onDuplicateVersion,
  onRenameVersion,
  onDeleteVersion,
  onToggleStarVersion,
  isLoadingVersions,
}: ProjectDetailPanelProps) => {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  useEffect(() => {
    if (versions.length > 0 && !selectedVersionId) {
      setSelectedVersionId(versions[0].id);
    }
  }, [versions, selectedVersionId]);

  const selectedVersion = versions.find(v => v.id === selectedVersionId);

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
        {project.description && (
          <p className="text-sm text-muted-foreground mt-3">{project.description}</p>
        )}
      </div>

      {/* Versions list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">
              Versions de chiffrage
              <span className="ml-1.5 text-muted-foreground font-normal">({versions.length})</span>
            </h3>
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
                <div key={version.id}>
                  <QuoteVersionCard
                    version={version}
                    isSelected={version.id === selectedVersionId}
                    onSelect={() => setSelectedVersionId(version.id)}
                    onOpen={() => onOpenPricing(version.id)}
                    onDuplicate={() => onDuplicateVersion?.(version.id, version.version_label)}
                    onRename={() => onRenameVersion?.(version.id, version.version_label)}
                    onDelete={() => onDeleteVersion?.(version.id)}
                    onToggleStar={() => onToggleStarVersion?.(version.id, !version.is_starred)}
                  />
                  {version.id === selectedVersionId && (
                    <div className="mt-2 ml-2 border-l-2 border-primary/30 pl-3 pb-1">
                      <div className="flex items-center gap-1.5 mb-2">
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Commentaires</span>
                      </div>
                      <QuoteComments quoteVersionId={version.id} compact />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Collapsible comments section */}
        <div className="p-6">
          <Collapsible open={!!selectedVersionId}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-left mb-3">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground flex-1">
                Commentaires
                {selectedVersion && (
                  <span className="text-muted-foreground font-normal ml-1">
                    — {selectedVersion.version_label}
                  </span>
                )}
              </h3>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                selectedVersionId && "rotate-180"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <QuoteComments quoteVersionId={selectedVersionId} compact />
            </CollapsibleContent>
          </Collapsible>
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
