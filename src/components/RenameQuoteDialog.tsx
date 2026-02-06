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

interface RenameQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (newLabel: string) => void;
  currentLabel: string;
  isLoading?: boolean;
}

export function RenameQuoteDialog({
  open,
  onOpenChange,
  onSubmit,
  currentLabel,
  isLoading = false,
}: RenameQuoteDialogProps) {
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    if (open) {
      setNewLabel(currentLabel);
    }
  }, [open, currentLabel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLabel.trim() && newLabel !== currentLabel) {
      onSubmit(newLabel.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Renommer le chiffrage</DialogTitle>
            <DialogDescription>
              Modifier le nom du chiffrage "{currentLabel}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rename-label">Nouveau nom</Label>
              <Input
                id="rename-label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Ex: V2 - Budget révisé"
                required
                autoFocus
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
            <Button type="submit" disabled={isLoading || !newLabel.trim() || newLabel === currentLabel}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Renommer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
