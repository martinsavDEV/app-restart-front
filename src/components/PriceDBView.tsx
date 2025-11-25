import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePriceItems } from "@/hooks/usePriceItems";
import { Plus, Upload } from "lucide-react";
import { EditableCell } from "./EditableCell";
import { EditableCellText } from "./EditableCellText";

export const PriceDBView = () => {
  const { priceItems, isLoading, updatePriceItem } = usePriceItems("fondation");

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Base de prix - Fondations</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {priceItems.length} prix unitaires
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importer CSV
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau prix
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Prix unitaires - Lot Fondations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[calc(100vh-240px)]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-medium w-[300px]">Désignation</TableHead>
                  <TableHead className="text-xs font-medium w-[80px]">Unité</TableHead>
                  <TableHead className="text-xs font-medium w-[120px] text-right">Prix unitaire</TableHead>
                  <TableHead className="text-xs font-medium w-[100px]">Date modif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceItems.map((item) => (
                  <TableRow key={item.id} className="h-8">
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
                    <TableCell className="py-1 text-xs text-muted-foreground">
                      {formatDate(item.date_modif)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
