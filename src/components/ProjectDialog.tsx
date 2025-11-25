import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { Project } from "@/hooks/useProjects";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (project: Partial<Project>) => void;
  project?: Project | null;
  isLoading?: boolean;
}

export function ProjectDialog({
  open,
  onOpenChange,
  onSubmit,
  project,
  isLoading,
}: ProjectDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    n_wtg: 1,
    description: "",
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        department: project.department || "",
        n_wtg: project.n_wtg,
        description: project.description || "",
      });
    } else {
      setFormData({
        name: "",
        department: "",
        n_wtg: 1,
        description: "",
      });
    }
  }, [project, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      department: formData.department || null,
      description: formData.description || null,
    };

    if (project) {
      onSubmit({ id: project.id, ...dataToSubmit });
    } else {
      onSubmit(dataToSubmit);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {project ? "Modifier le projet" : "Nouveau projet"}
            </DialogTitle>
            <DialogDescription>
              {project
                ? "Modifiez les informations du projet"
                : "Créez un nouveau projet éolien"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nom du projet *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: 41 - Parc éolien La Besse"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Département</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                placeholder="Ex: Centre-Val de Loire"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="n_wtg">Nombre d'éoliennes *</Label>
              <Input
                id="n_wtg"
                type="number"
                min="1"
                value={formData.n_wtg}
                onChange={(e) =>
                  setFormData({ ...formData, n_wtg: parseInt(e.target.value) || 1 })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description du projet..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {project ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
