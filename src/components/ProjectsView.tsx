import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Loader2, Plus, Search } from "lucide-react";
import { useProjects, useQuoteVersions, type Project } from "@/hooks/useProjects";
import { ProjectDialog } from "./ProjectDialog";
import { QuoteVersionDialog } from "./QuoteVersionDialog";
import { DuplicateQuoteDialog } from "./DuplicateQuoteDialog";
import { ProjectCard } from "./ProjectCard";
import { ProjectDetailPanel } from "./ProjectDetailPanel";

interface ProjectsViewProps {
  onOpenPricing?: (projectId: string, projectName: string, versionId: string, versionLabel?: string) => void;
}

export function ProjectsView({ onOpenPricing }: ProjectsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [deleteQuoteDialogOpen, setDeleteQuoteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const [duplicateQuoteDialogOpen, setDuplicateQuoteDialogOpen] = useState(false);
  const [quoteToDuplicate, setQuoteToDuplicate] = useState<{ id: string; label: string } | null>(null);

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

  const {
    data: quoteVersions = [],
    isLoading: isLoadingVersions,
    createQuoteVersion,
    isCreatingQuote,
    deleteQuoteVersion,
    isDeletingQuote,
    duplicateQuoteVersion,
    isDuplicatingQuote,
  } = useQuoteVersions(selectedProjectId);

  const filteredProjects = projects.filter((project) => {
    const normalizedQuery = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(normalizedQuery) ||
      (project.department?.toLowerCase() || "").includes(normalizedQuery)
    );
  });

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

  // Auto-select first project if none selected
  if (!selectedProjectId && filteredProjects.length > 0 && !isLoading) {
    setSelectedProjectId(filteredProjects[0].id);
  }

  const handleOpenPricing = (versionId: string) => {
    if (selectedProject && onOpenPricing) {
      const version = quoteVersions.find(v => v.id === versionId);
      onOpenPricing(selectedProject.id, selectedProject.name, versionId, version?.version_label);
    }
  };

  const handleCreateQuote = () => {
    setQuoteDialogOpen(true);
  };

  const handleSubmitQuoteVersion = (data: any) => {
    createQuoteVersion(data, {
      onSuccess: (newVersion: any) => {
        setQuoteDialogOpen(false);
        if (selectedProject && onOpenPricing) {
          onOpenPricing(selectedProject.id, selectedProject.name, newVersion.id, newVersion.version_label);
        }
      },
    });
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      if (selectedProjectId === projectToDelete) {
        setSelectedProjectId(null);
      }
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

  const handleConfirmDeleteQuote = () => {
    if (quoteToDelete) {
      deleteQuoteVersion(quoteToDelete);
      setDeleteQuoteDialogOpen(false);
      setQuoteToDelete(null);
    }
  };

  const handleSubmitDuplicateQuote = (newLabel: string) => {
    if (quoteToDuplicate) {
      duplicateQuoteVersion(
        { sourceVersionId: quoteToDuplicate.id, newLabel },
        {
          onSuccess: () => {
            setDuplicateQuoteDialogOpen(false);
            setQuoteToDuplicate(null);
          },
        }
      );
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden h-full">
      {/* Left column: Project list */}
      <section className="flex-1 flex flex-col overflow-hidden border-r border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <h1 className="text-base font-semibold text-foreground">Portefeuille Projets</h1>
          <Button
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={handleCreateProject}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nouveau
          </Button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input
              placeholder="Rechercher par nom, département..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50 border-border text-sm"
            />
          </div>
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {searchQuery
                ? "Aucun projet trouvé"
                : "Aucun projet. Créez votre premier projet."}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  isActive={selectedProjectId === project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  onEdit={() => {
                    setEditingProject(project);
                    setDialogOpen(true);
                  }}
                  onDelete={() => {
                    setProjectToDelete(project.id);
                    setDeleteDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Right column: Project detail panel */}
      <section className="w-[420px] bg-card flex flex-col shrink-0 overflow-y-auto">
        {selectedProject ? (
          <ProjectDetailPanel
            project={selectedProject}
            versions={quoteVersions}
            activeVersionId={quoteVersions[0]?.id}
            onOpenPricing={handleOpenPricing}
            onCreateVersion={handleCreateQuote}
            isLoadingVersions={isLoadingVersions}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Sélectionnez un projet
          </div>
        )}
      </section>

      {/* Dialogs */}
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
        projectId={selectedProjectId || ""}
        isLoading={isCreatingQuote}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression du projet</AlertDialogTitle>
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

      <AlertDialog open={deleteQuoteDialogOpen} onOpenChange={setDeleteQuoteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce chiffrage ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteQuote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingQuote}
            >
              {isDeletingQuote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DuplicateQuoteDialog
        open={duplicateQuoteDialogOpen}
        onOpenChange={setDuplicateQuoteDialogOpen}
        onSubmit={handleSubmitDuplicateQuote}
        sourceLabel={quoteToDuplicate?.label || ""}
        isLoading={isDuplicatingQuote}
      />
    </div>
  );
}
