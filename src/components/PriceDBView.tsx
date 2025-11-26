import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePriceItems } from "@/hooks/usePriceItems";
import { Plus, Upload, Download, Trash2 } from "lucide-react";
import { EditableCell } from "./EditableCell";
import { EditableCellText } from "./EditableCellText";
import { CSVImportDialog, ImportMetadata } from "./CSVImportDialog";
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
import { downloadTemplate } from "@/lib/csvUtils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const LOTS = [
  { code: "terrassement", label: "Terrassement" },
  { code: "renforcement_sol", label: "Renforcement de sol" },
  { code: "fondations", label: "Fondations" },
  { code: "electricite", label: "Électricité" },
  { code: "turbinier", label: "Turbinier" }
];

export const PriceDBView = () => {
  const [activeLot, setActiveLot] = useState("fondations");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const { priceItems, isLoading, updatePriceItem, createPriceItem, deletePriceItem } = usePriceItems(activeLot);

  const currentLot = LOTS.find(lot => lot.code === activeLot);

  const handleDownloadTemplate = () => {
    const columns = ["item_id", "item", "unit", "unit_price"];
    downloadTemplate(columns, `prix_${activeLot}_template.csv`);
    toast.success("Template CSV téléchargé");
  };

  const handleImport = async (data: any[], metadata: ImportMetadata) => {
    try {
      const { error } = await supabase
        .from("price_items")
        .insert(data);

      if (error) throw error;
      
      toast.success(`${data.length} prix importés avec succès`);
      window.location.reload();
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Erreur lors de l'import");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const handleAddNewPrice = () => {
    createPriceItem({
      lot_code: activeLot,
      item: "Nouvelle désignation",
      unit: "u",
      unit_price: 0,
      price_reference: "MSA 2025",
      date_modif: new Date().toISOString(),
    });
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      deletePriceItem(itemToDelete);
      setItemToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <div>
          <h1 className="text-lg font-semibold">Base de prix</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Historiques & tendances des prix unitaires
          </p>
        </div>
        <div className="text-center py-8 text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div>
        <h1 className="text-lg font-semibold">Base de prix</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Gestion des prix unitaires par lot
        </p>
      </div>

      <Tabs value={activeLot} onValueChange={setActiveLot}>
        <TabsList className="grid w-full grid-cols-5">
          {LOTS.map(lot => (
            <TabsTrigger key={lot.code} value={lot.code} className="text-xs">
              {lot.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {LOTS.map(lot => (
          <TabsContent key={lot.code} value={lot.code} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{lot.label}</p>
                <p className="text-xs text-muted-foreground">
                  {priceItems.length} prix unitaires
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Template CSV
                </Button>
                <Button size="sm" variant="outline" onClick={() => setImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Importer CSV
                </Button>
                <Button size="sm" onClick={handleAddNewPrice}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau prix
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Prix unitaires - {lot.label}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Chargement...
                  </div>
                ) : priceItems.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Aucun prix pour ce lot. Importez un fichier CSV ou ajoutez des prix manuellement.
                  </div>
                ) : (
                  <div className="overflow-auto max-h-[calc(100vh-320px)]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs font-medium w-[80px]">ID</TableHead>
                          <TableHead className="text-xs font-medium w-[280px]">Désignation</TableHead>
                          <TableHead className="text-xs font-medium w-[80px]">Unité</TableHead>
                          <TableHead className="text-xs font-medium w-[120px] text-right">Prix unitaire</TableHead>
                          <TableHead className="text-xs font-medium w-[120px]">Référence</TableHead>
                          <TableHead className="text-xs font-medium w-[100px]">Date modif</TableHead>
                          <TableHead className="text-xs font-medium w-[60px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {priceItems.map((item) => (
                          <TableRow key={item.id} className="h-8 group">
                            <TableCell className="py-1 text-xs text-muted-foreground">
                              {item.item_id || "-"}
                            </TableCell>
                            <TableCell className="py-1">
                              <EditableCellText
                                value={item.item}
                                onChange={(value) => updatePriceItem({ id: item.id, item: value })}
                              />
                            </TableCell>
                            <TableCell className="py-1">
                              <EditableCellText
                                value={item.unit}
                                onChange={(value) => updatePriceItem({ id: item.id, unit: value })}
                              />
                            </TableCell>
                            <TableCell className="py-1 text-right">
                              <EditableCell
                                value={item.unit_price}
                                onChange={(value) => updatePriceItem({ id: item.id, unit_price: value })}
                                format={formatCurrency}
                                align="right"
                              />
                            </TableCell>
                            <TableCell className="py-1">
                              <EditableCellText
                                value={item.price_reference || ""}
                                onChange={(value) => updatePriceItem({ id: item.id, price_reference: value })}
                                placeholder="Réf..."
                              />
                            </TableCell>
                            <TableCell className="py-1">
                              <EditableCellText
                                value={item.date_modif ? new Date(item.date_modif).toISOString().split('T')[0] : ""}
                                onChange={(value) => updatePriceItem({ id: item.id, date_modif: value ? new Date(value).toISOString() : null })}
                                placeholder="Date..."
                              />
                            </TableCell>
                            <TableCell className="py-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteClick(item.id)}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <CSVImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImport}
        lotCode={activeLot}
        lotLabel={currentLot?.label || ""}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce prix ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
