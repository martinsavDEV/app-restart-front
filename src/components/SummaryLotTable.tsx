import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SummaryData } from "@/hooks/useSummaryData";
import { getLotColors } from "@/lib/lotColors";
import { cn } from "@/lib/utils";

interface SummaryLotTableProps {
  data: SummaryData;
}

export const SummaryLotTable = ({ data }: SummaryLotTableProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Résumé des lots</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lot</TableHead>
              <TableHead className="text-right">Montant</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.lots.map((lot) => {
              const colors = getLotColors(lot.code || lot.label.toLowerCase().replace(/\s+/g, '_'));
              return (
                <TableRow key={lot.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", colors.bgActive)} />
                      {lot.label}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                  {lot.total.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                    })}{" "}
                    €
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="font-bold border-t-2">
              <TableCell>TOTAL CAPEX</TableCell>
              <TableCell className="text-right">
                {data.totalCapex.toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                €
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
