import { useState, useEffect } from "react";
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
import { Link2, Link2Off } from "lucide-react";
import { CalculatorVariable } from "@/types/bpu";

interface SectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (name: string, isMultiple: boolean, multiplier: number, linkedField?: string) => void;
  variables?: CalculatorVariable[];
}

export const SectionDialog = ({ open, onOpenChange, onConfirm, variables = [] }: SectionDialogProps) => {
  const [name, setName] = useState("");
  const [isMultiple, setIsMultiple] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [useVariable, setUseVariable] = useState(false);
  const [linkedField, setLinkedField] = useState("");
  const [variableSearch, setVariableSearch] = useState("");

  // Filter variables for the dropdown (only show numeric-ish variables)
  const filteredVariables = variables.filter((v) => {
    const searchTerm = variableSearch.replace(/^\$/, "").toLowerCase();
    return (
      v.name.toLowerCase().includes(searchTerm) ||
      v.label.toLowerCase().includes(searchTerm)
    );
  });

  const handleConfirm = () => {
    if (!name.trim()) return;
    const finalLinkedField = isMultiple && useVariable && linkedField ? linkedField : undefined;
    onConfirm(name, isMultiple, multiplier, finalLinkedField);
    setName("");
    setIsMultiple(false);
    setMultiplier(1);
    setUseVariable(false);
    setLinkedField("");
    setVariableSearch("");
    onOpenChange(false);
  };

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setName("");
      setIsMultiple(false);
      setMultiplier(1);
      setUseVariable(false);
      setLinkedField("");
      setVariableSearch("");
    }
  }, [open]);

  const selectedVariable = variables.find((v) => v.name === linkedField);

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
                if (value === "unique") {
                  setMultiplier(1);
                  setUseVariable(false);
                  setLinkedField("");
                }
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
            <div className="space-y-4 pl-4 border-l-2 border-primary/20">
              <div className="space-y-2">
                <Label>Source du multiplicateur</Label>
                <RadioGroup
                  value={useVariable ? "variable" : "fixed"}
                  onValueChange={(value) => {
                    setUseVariable(value === "variable");
                    if (value === "fixed") {
                      setLinkedField("");
                    }
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed" className="font-normal cursor-pointer flex items-center gap-2">
                      <Link2Off className="h-3 w-3" />
                      Valeur fixe
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="variable" id="variable" />
                    <Label htmlFor="variable" className="font-normal cursor-pointer flex items-center gap-2">
                      <Link2 className="h-3 w-3 text-orange-500" />
                      Lié à une variable Calculator
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {!useVariable && (
                <div className="space-y-2">
                  <Label htmlFor="multiplier">Multiplicateur</Label>
                  <Input
                    id="multiplier"
                    type="text"
                    inputMode="numeric"
                    value={multiplier}
                    onChange={(e) => setMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
                    placeholder="Nombre d'unités"
                  />
                  <p className="text-xs text-muted-foreground">
                    Le total de cette section sera multiplié par ce nombre
                  </p>
                </div>
              )}

              {useVariable && (
                <div className="space-y-2">
                  <Label htmlFor="variable-select">Variable</Label>
                  <Input
                    id="variable-search"
                    value={variableSearch}
                    onChange={(e) => setVariableSearch(e.target.value)}
                    placeholder="Rechercher une variable..."
                    className="mb-2"
                  />
                  <div className="max-h-40 overflow-y-auto border rounded-md bg-background">
                    {filteredVariables.length === 0 ? (
                      <div className="p-3 text-xs text-muted-foreground text-center">
                        {variables.length === 0
                          ? "Aucune variable disponible. Configurez d'abord le Calculator."
                          : "Aucune variable correspondante"}
                      </div>
                    ) : (
                      filteredVariables.map((v) => (
                        <button
                          key={v.name}
                          type="button"
                          onClick={() => {
                            setLinkedField(v.name);
                            setVariableSearch("");
                          }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center justify-between ${
                            linkedField === v.name ? "bg-primary/10 text-primary" : ""
                          }`}
                        >
                          <span className="font-mono">{v.name}</span>
                          <span className="text-muted-foreground tabular-nums">{v.value}</span>
                        </button>
                      ))
                    )}
                  </div>
                  {selectedVariable && (
                    <div className="flex items-center gap-2 p-2 bg-orange-500/10 border border-orange-500/30 rounded-md">
                      <Link2 className="h-4 w-4 text-orange-500" />
                      <span className="text-xs font-mono text-orange-700 dark:text-orange-300">
                        {selectedVariable.name}
                      </span>
                      <span className="text-xs text-muted-foreground">= {selectedVariable.value}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    💡 La valeur sera résolue automatiquement depuis le Calculator
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!name.trim() || (isMultiple && useVariable && !linkedField)}
          >
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
