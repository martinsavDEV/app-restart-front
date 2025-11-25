import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { parseCSV, validateData } from "@/lib/csvUtils";
import { toast } from "sonner";

interface CSVImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (data: any[], metadata: ImportMetadata) => void;
  lotCode: string;
  lotLabel: string;
}

export interface ImportMetadata {
  importedBy: string;
  importDate: string;
  reference: string;
}

export const CSVImportDialog = ({ open, onClose, onImport, lotCode, lotLabel }: CSVImportDialogProps) => {
  const [importedBy, setImportedBy] = useState("");
  const [importDate, setImportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Veuillez sélectionner un fichier CSV");
      return;
    }

    if (!importedBy.trim()) {
      toast.error("Veuillez indiquer qui importe les données");
      return;
    }

    if (!reference.trim()) {
      toast.error("Veuillez indiquer une référence");
      return;
    }

    setIsProcessing(true);

    try {
      const data = await parseCSV(file);
      
      // Validate required columns
      const validation = validateData(data, ["item", "unit", "unit_price"]);
      
      if (!validation.valid) {
        toast.error(`Erreur de validation: ${validation.errors.join(", ")}`);
        setIsProcessing(false);
        return;
      }

      // Add lot_code to each item
      const enrichedData = data.map(item => ({
        ...item,
        lot_code: lotCode,
        price_reference: reference,
        date_modif: importDate,
        unit_price: parseFloat(item.unit_price)
      }));

      onImport(enrichedData, {
        importedBy,
        importDate,
        reference
      });

      toast.success(`${enrichedData.length} prix importés avec succès`);
      
      // Reset form
      setImportedBy("");
      setReference("");
      setFile(null);
      onClose();
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Erreur lors de l'import du fichier CSV");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importer des prix - {lotLabel}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="importedBy">Importé par</Label>
            <Input
              id="importedBy"
              value={importedBy}
              onChange={(e) => setImportedBy(e.target.value)}
              placeholder="Jean Dupont"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="importDate">Date d'import</Label>
            <Input
              id="importDate"
              type="date"
              value={importDate}
              onChange={(e) => setImportDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Référence chantier</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="MSA 2025"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="csvFile">Fichier CSV</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                Fichier sélectionné: {file.name}
              </p>
            )}
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
            <p className="font-medium mb-1">Format CSV attendu:</p>
            <code className="text-xs">item_id,item,unit,unit_price</code>
            <p className="mt-1">Exemple: FO-001,Installation de chantier,ft,35000</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Annuler
          </Button>
          <Button onClick={handleImport} disabled={isProcessing}>
            {isProcessing ? "Import en cours..." : "Importer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
