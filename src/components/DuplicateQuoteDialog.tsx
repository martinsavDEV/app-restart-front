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
import { Loader2 } from "lucide-react";

interface DuplicateQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (newLabel: string) => void;
  sourceLabel: string;
  isLoading?: boolean;
}

export function DuplicateQuoteDialog({
  open,
  onOpenChange,
  onSubmit,
  sourceLabel,
  isLoading = false,
}: DuplicateQuoteDialogProps) {
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    if (open) {
      // Proposer un label par défaut basé sur le label source
      setNewLabel(`${sourceLabel} - Copie`);
    }
  }, [open, sourceLabel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLabel.trim()) {
      onSubmit(newLabel);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Dupliquer le chiffrage</DialogTitle>
            <DialogDescription>
              Créer une copie complète du chiffrage "{sourceLabel}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="label">Nom de la nouvelle version</Label>
              <Input
                id="label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Ex: V3 - Budget définitif"
                required
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
            <Button type="submit" disabled={isLoading || !newLabel.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Dupliquer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
