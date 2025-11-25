import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface SectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string, isMultiple: boolean, multiplier: number) => void;
}

export const SectionDialog = ({ open, onOpenChange, onConfirm }: SectionDialogProps) => {
  const [name, setName] = useState("");
  const [isMultiple, setIsMultiple] = useState(false);
  const [multiplier, setMultiplier] = useState(1);

  const handleConfirm = () => {
    if (!name.trim()) return;
    onConfirm(name, isMultiple, multiplier);
    setName("");
    setIsMultiple(false);
    setMultiplier(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une section</DialogTitle>
          <DialogDescription>
            Définissez les propriétés de la nouvelle section
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="section-name">Nom de la section</Label>
            <Input
              id="section-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Fondations, Terrassement..."
            />
          </div>

          <div className="space-y-2">
            <Label>Type de section</Label>
            <RadioGroup
              value={isMultiple ? "multiple" : "unique"}
              onValueChange={(value) => {
                setIsMultiple(value === "multiple");
                if (value === "unique") setMultiplier(1);
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unique" id="unique" />
                <Label htmlFor="unique" className="font-normal cursor-pointer">
                  Section unique (total simple)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="multiple" id="multiple" />
                <Label htmlFor="multiple" className="font-normal cursor-pointer">
                  Section multiple (avec multiplicateur)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {isMultiple && (
            <div className="space-y-2">
              <Label htmlFor="multiplier">Multiplicateur</Label>
              <Input
                id="multiplier"
                type="number"
                min="1"
                value={multiplier}
                onChange={(e) => setMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
                placeholder="Nombre d'unités"
              />
              <p className="text-xs text-muted-foreground">
                Le total de cette section sera multiplié par ce nombre
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={!name.trim()}>
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
