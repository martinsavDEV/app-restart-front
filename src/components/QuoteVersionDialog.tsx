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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface QuoteVersion {
  id?: string;
  project_id: string;
  version_label: string;
  type?: string;
  comment?: string;
  total_amount?: number;
}

interface QuoteVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<QuoteVersion>) => void;
  quoteVersion?: QuoteVersion | null;
  projectId: string;
  isLoading?: boolean;
}

export const QuoteVersionDialog = ({
  open,
  onOpenChange,
  onSubmit,
  quoteVersion,
  projectId,
  isLoading = false,
}: QuoteVersionDialogProps) => {
  const [formData, setFormData] = useState<Partial<QuoteVersion>>({
    project_id: projectId,
    version_label: "",
    type: "Budget préliminaire",
    comment: "",
    total_amount: 0,
  });

  useEffect(() => {
    if (quoteVersion) {
      setFormData(quoteVersion);
    } else {
      setFormData({
        project_id: projectId,
        version_label: "",
        type: "Budget préliminaire",
        comment: "",
        total_amount: 0,
      });
    }
  }, [quoteVersion, projectId, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {quoteVersion ? "Modifier le chiffrage" : "Nouveau chiffrage"}
            </DialogTitle>
            <DialogDescription>
              {quoteVersion
                ? "Modifier les informations du chiffrage"
                : "Créer une nouvelle version de chiffrage pour ce projet"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="version_label">Version *</Label>
              <Input
                id="version_label"
                placeholder="Ex: v1.0, Budget initial, etc."
                value={formData.version_label}
                onChange={(e) =>
                  setFormData({ ...formData, version_label: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Budget préliminaire">Budget préliminaire</SelectItem>
                  <SelectItem value="Offre commerciale">Offre commerciale</SelectItem>
                  <SelectItem value="Budget final">Budget final</SelectItem>
                  <SelectItem value="Révision">Révision</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comment">Commentaire</Label>
              <Textarea
                id="comment"
                placeholder="Description ou notes sur cette version..."
                value={formData.comment || ""}
                onChange={(e) =>
                  setFormData({ ...formData, comment: e.target.value })
                }
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
              {quoteVersion ? "Enregistrer" : "Créer le chiffrage"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
