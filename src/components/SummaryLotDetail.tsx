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

interface SummaryLotDetailProps {
  lot: SummaryData["lots"][0];
}

export const SummaryLotDetail = ({ lot }: SummaryLotDetailProps) => {
  const colors = getLotColors(lot.code || lot.label.toLowerCase().replace(/\s+/g, '_'));
  
  return (
    <Card className={cn("border-l-4", colors.border)}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className={cn("text-lg font-semibold flex items-center gap-2", colors.text)}>
            <div className={cn("w-3 h-3 rounded-full", colors.bgActive)} />
            LOT: {lot.label.toUpperCase()}
          </h3>
          <span className="text-lg font-bold">
            Total: {lot.total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
          </span>
        </div>
        
        {/* Lot header comment */}
        {lot.header_comment && (
          <p className="text-sm text-muted-foreground italic mb-4 flex items-center gap-2">
            <span>💬</span>
            {lot.header_comment}
          </p>
        )}

        <div className="space-y-6">
          {lot.sections.map((section) => (
            <div key={section.id} className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">
                {section.name}
                {section.is_multiple && (
                  <span className="text-muted-foreground ml-2">(x{section.multiplier})</span>
                )}
              </h4>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Désignation</TableHead>
                    <TableHead className="text-center w-20">Qté</TableHead>
                    <TableHead className="text-center w-20">Unité</TableHead>
                    <TableHead className="text-right w-28">P.U.</TableHead>
                    <TableHead className="text-right w-28">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        {line.designation}
                        {line.comment && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({line.comment})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{line.quantity}</TableCell>
                      <TableCell className="text-center">{line.unit}</TableCell>
                      <TableCell className="text-right">
                        {line.unit_price.toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        €
                      </TableCell>
                      <TableCell className="text-right">
                        {line.total_price.toLocaleString("fr-FR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        €
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold bg-muted/50">
                    <TableCell colSpan={4} className="text-right">
                      Sous-total section:
                    </TableCell>
                    <TableCell className="text-right">
                      {section.subtotal.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      €
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
