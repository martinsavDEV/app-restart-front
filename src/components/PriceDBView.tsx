import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePriceItems } from "@/hooks/usePriceItems";
import { Plus, Upload, Download, Trash2, Search } from "lucide-react";
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
import { getLotColors } from "@/lib/lotColors";
import { cn } from "@/lib/utils";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "recent" | "old">("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const { priceItems, isLoading, updatePriceItem, createPriceItem, deletePriceItem } = usePriceItems(activeLot);

  const currentLot = LOTS.find(lot => lot.code === activeLot);

  // Filter items by search query and date
  const filteredPriceItems = priceItems.filter(item => {
    // Search filter
    const matchesSearch = searchQuery === "" ||
      item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.price_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.item_id?.toLowerCase().includes(searchQuery.toLowerCase());

    // Date filter
    if (dateFilter === "all") return matchesSearch;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const modifDate = item.date_modif ? new Date(item.date_modif) : null;
    
    if (dateFilter === "recent") {
      return matchesSearch && modifDate && modifDate >= thirtyDaysAgo;
    } else {
      return matchesSearch && (!modifDate || modifDate < thirtyDaysAgo);
    }
  });

  // Selection helpers
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItems(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredPriceItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredPriceItems.map(item => item.id)));
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedItems) {
        deletePriceItem(id);
      }
      setSelectedItems(new Set());
      setBulkDeleteDialogOpen(false);
      toast.success(`${selectedItems.size} prix supprimés`);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  // Reset selection when changing lot
  const handleLotChange = (lot: string) => {
    setActiveLot(lot);
    setSelectedItems(new Set());
    setSearchQuery("");
  };

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
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-3">
      <div>
        <h1 className="text-lg font-semibold">Base de prix</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Gestion des prix unitaires par lot
        </p>
      </div>

      <Tabs value={activeLot} onValueChange={handleLotChange}>
        <TabsList className="w-full justify-start bg-transparent gap-2 flex-wrap">
          {LOTS.map(lot => {
            const colors = getLotColors(lot.code);
            const isActive = activeLot === lot.code;
            return (
              <TabsTrigger 
                key={lot.code} 
                value={lot.code} 
                className={cn(
                  "text-xs font-semibold px-4 py-2 rounded-lg border-2 transition-all data-[state=active]:shadow-none",
                  isActive 
                    ? `${colors.bgActive} ${colors.textActive} border-transparent shadow-lg` 
                    : `${colors.bg} ${colors.text} ${colors.border} hover:shadow-md`
                )}
              >
                {lot.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {LOTS.map(lot => (
          <TabsContent key={lot.code} value={lot.code} className="space-y-3">
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input
                  placeholder="Rechercher par désignation, référence, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as "all" | "recent" | "old")}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Date modif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes dates</SelectItem>
                  <SelectItem value="recent">Récentes (&lt;30j)</SelectItem>
                  <SelectItem value="old">Anciennes (&gt;30j)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Selection actions */}
            {selectedItems.size > 0 && (
              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
                <span className="text-sm font-medium">
                  {selectedItems.size} sélectionné{selectedItems.size > 1 ? "s" : ""}
                </span>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => setBulkDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer la sélection
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{lot.label}</p>
                <p className="text-xs text-muted-foreground">
                  {filteredPriceItems.length} prix unitaires{searchQuery || dateFilter !== "all" ? ` (sur ${priceItems.length})` : ""}
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
                ) : filteredPriceItems.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {searchQuery || dateFilter !== "all" 
                      ? "Aucun prix correspondant aux filtres."
                      : "Aucun prix pour ce lot. Importez un fichier CSV ou ajoutez des prix manuellement."}
                  </div>
                ) : (
                  <div className="overflow-auto max-h-[calc(100vh-420px)]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs font-medium w-[40px]">
                            <Checkbox
                              checked={selectedItems.size === filteredPriceItems.length && filteredPriceItems.length > 0}
                              onCheckedChange={toggleSelectAll}
                            />
                          </TableHead>
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
                        {filteredPriceItems.map((item) => (
                          <TableRow key={item.id} className="h-8 group">
                            <TableCell className="py-1">
                              <Checkbox
                                checked={selectedItems.has(item.id)}
                                onCheckedChange={() => toggleSelection(item.id)}
                              />
                            </TableCell>
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

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {selectedItems.size} prix ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer {selectedItems.size} prix
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
};
