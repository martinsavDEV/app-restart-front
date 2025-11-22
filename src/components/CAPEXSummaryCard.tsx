import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CAPEXSummary } from "@/types/bpu";

interface CAPEXSummaryCardProps {
  summary: CAPEXSummary;
  contingencyRate?: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
};

export const CAPEXSummaryCard = ({ summary, contingencyRate = 10 }: CAPEXSummaryCardProps) => {
  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Résumé CAPEX</CardTitle>
        <CardDescription className="text-xs">Total par lot + aléas / provisions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-0.5 text-xs">
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Terrassement</span>
            <span className="tabular-nums">{formatCurrency(summary.terrassement)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Renforcement de sol</span>
            <span className="tabular-nums">{formatCurrency(summary.reinforcement)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Fondations</span>
            <span className="tabular-nums">{formatCurrency(summary.foundations)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Électricité</span>
            <span className="tabular-nums">{formatCurrency(summary.electricity)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Turbinier</span>
            <span className="tabular-nums">{formatCurrency(summary.turbine)}</span>
          </div>
          <div className="h-px bg-border my-2" />
          <div className="flex justify-between py-1 font-medium">
            <span>Total lots</span>
            <span className="tabular-nums">{formatCurrency(summary.subtotal)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Aléas ({contingencyRate}%)</span>
            <span className="tabular-nums">{formatCurrency(summary.contingency)}</span>
          </div>
          <div className="h-px bg-border my-2" />
          <div className="flex justify-between py-1.5 font-semibold text-sm text-accent">
            <span>CAPEX TOTAL</span>
            <span className="tabular-nums">{formatCurrency(summary.total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
