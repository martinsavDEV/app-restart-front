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
            {data.lots.map((lot) => (
              <TableRow key={lot.id}>
                <TableCell className="font-medium">{lot.label}</TableCell>
                <TableCell className="text-right">
                  {lot.total.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  €
                </TableCell>
              </TableRow>
            ))}
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
