import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, Pencil, Trash2, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjects, useQuoteVersions, type Project } from "@/hooks/useProjects";
import { ProjectDialog } from "./ProjectDialog";
import { QuoteVersionDialog } from "./QuoteVersionDialog";

interface ProjectsViewProps {
  onOpenPricing?: (projectId: string, projectName: string, versionId: string) => void;
}

export function ProjectsView({ onOpenPricing }: ProjectsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [selectedProjectForQuote, setSelectedProjectForQuote] = useState<string | null>(null);

  const {
    projects,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
    isCreating,
    isUpdating,
    isDeleting,
  } = useProjects();

  const { data: quoteVersions = [], createQuoteVersion, isCreatingQuote } = useQuoteVersions(expandedProjectId);

  const filteredProjects = projects.filter((project) => {
    const normalizedQuery = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(normalizedQuery) ||
      (project.department?.toLowerCase() || "").includes(normalizedQuery)
    );
  });

  const handleProjectClick = (projectId: string) => {
    setExpandedProjectId((prev) => (prev === projectId ? null : projectId));
  };

  const handleOpenPricing = (project: Project, versionId: string) => {
    if (onOpenPricing) {
      onOpenPricing(project.id, project.name, versionId);
    }
  };

  const handleCreateQuote = (projectId: string) => {
    setSelectedProjectForQuote(projectId);
    setQuoteDialogOpen(true);
  };

  const handleSubmitQuoteVersion = (data: any) => {
    createQuoteVersion(data, {
      onSuccess: (newVersion: any) => {
        setQuoteDialogOpen(false);
        // Open pricing view with the new quote version
        const project = projects.find(p => p.id === selectedProjectForQuote);
        if (project && onOpenPricing) {
          onOpenPricing(project.id, project.name, newVersion.id);
        }
      }
    });
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setDialogOpen(true);
  };

  const handleEditProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setDialogOpen(true);
  };

  const handleDeleteClick = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleSubmitProject = (data: Partial<Project>) => {
    if (editingProject) {
      updateProject(data as Project & { id: string });
    } else {
      createProject(data as Omit<Project, "id" | "created_at" | "updated_at">);
    }
    setDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    return (amount / 1_000_000).toFixed(2) + " M€";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-lg font-semibold">Projets éoliens</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Vue portefeuille, sélection du projet à chiffrer
          </p>
        </div>
        <Button size="sm" onClick={handleCreateProject}>
          + Nouveau projet
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Liste des projets et chiffrages</CardTitle>
          <CardDescription className="text-xs">
            Parcours rapide des projets et accès direct aux versions de chiffrage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Rechercher par nom, département..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[260px] h-9 text-xs"
            />
          </div>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery
                ? "Aucun projet trouvé"
                : "Aucun projet. Créez votre premier projet."}
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredProjects.map((project) => {
                const projectVersions =
                  expandedProjectId === project.id ? quoteVersions : [];

                return (
                  <Collapsible
                    key={project.id}
                    open={expandedProjectId === project.id}
                    onOpenChange={() => handleProjectClick(project.id)}
                  >
                    <Card
                      className={cn(
                        "border shadow-sm transition-all duration-200",
                        expandedProjectId === project.id &&
                          "border-primary/30 bg-accent-soft"
                      )}
                    >
                      <CollapsibleTrigger asChild>
                        <CardHeader className="pb-2 cursor-pointer hover:bg-accent/50 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              <CardTitle className="text-sm leading-tight">
                                {project.name}
                              </CardTitle>
                              <CardDescription className="text-xs text-muted-foreground">
                                {project.department || "Département non spécifié"}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right text-xs">
                                <div className="font-semibold">
                                  {project.n_wtg} éolienne{project.n_wtg > 1 ? "s" : ""}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => handleEditProject(project, e)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={(e) => handleDeleteClick(project.id, e)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                  expandedProjectId === project.id && "rotate-180"
                                )}
                              />
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                        <CardContent className="pt-0 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-[11px] uppercase text-muted-foreground font-medium">
                              Chiffrages du projet ({projectVersions.length})
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px]"
                              onClick={() => handleCreateQuote(project.id)}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Nouveau chiffrage
                            </Button>
                          </div>
                          {projectVersions.length === 0 ? (
                            <div className="text-xs text-muted-foreground py-2">
                              Aucune version de chiffrage
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {projectVersions.map((version) => (
                                <div
                                  key={version.id}
                                  className={cn(
                                    "flex items-center justify-between gap-4 rounded-md border px-3 py-2",
                                    "hover:border-primary/40 transition-colors"
                                  )}
                                >
                                  <div className="space-y-0.5">
                                    <div className="text-xs font-semibold">
                                      {version.version_label}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                      {version.comment || "Pas de commentaire"}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                      {formatDate(version.date_creation)}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <div className="text-xs font-semibold">
                                        {formatAmount(version.total_amount)}
                                      </div>
                                      <div className="text-[11px] text-muted-foreground">
                                        CAPEX
                                      </div>
                                    </div>
                                    {onOpenPricing && (
                                      <Button
                                        size="sm"
                                        className="h-8 text-[11px]"
                                        onClick={() =>
                                          handleOpenPricing(project, version.id)
                                        }
                                      >
                                        Ouvrir le chiffrage
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmitProject}
        project={editingProject}
        isLoading={isCreating || isUpdating}
      />

      <QuoteVersionDialog
        open={quoteDialogOpen}
        onOpenChange={setQuoteDialogOpen}
        onSubmit={handleSubmitQuoteVersion}
        projectId={selectedProjectForQuote || ""}
        isLoading={isCreatingQuote}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est
              irréversible et supprimera également toutes les versions de chiffrage
              associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
