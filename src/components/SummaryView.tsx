import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText, Loader2, MessageSquare } from "lucide-react";
import { useSummaryData } from "@/hooks/useSummaryData";
import { SummaryHeader } from "./SummaryHeader";
import { SummaryLotTable } from "./SummaryLotTable";
import { SummaryLotDetail } from "./SummaryLotDetail";
import { QuoteComments } from "./QuoteComments";
import { exportCapexToCSV } from "@/lib/csvUtils";
import { exportCapexToPDF } from "@/lib/pdfExport";
import { toast } from "sonner";

interface SummaryViewProps {
  projectId: string | null;
  projectName: string | null;
  versionId: string | null;
}

export const SummaryView = ({ projectId, versionId }: SummaryViewProps) => {
  const { data, isLoading, error, refetch } = useSummaryData(projectId, versionId);

  const handleExportCSV = () => {
    if (!data) return;
    try {
      exportCapexToCSV(data);
      toast.success("Export CSV réussi");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Erreur lors de l'export CSV");
    }
  };

  const handleExportPDF = () => {
    if (!data) return;
    try {
      exportCapexToPDF(data);
      toast.success("Export PDF réussi");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Erreur lors de l'export PDF");
    }
  };

  if (!projectId || !versionId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
          <p className="text-lg text-muted-foreground">
            Veuillez sélectionner un projet et une version de chiffrage
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <p className="text-lg text-destructive">
            Erreur lors du chargement des données
          </p>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header with export buttons */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Résumé du chiffrage</h1>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={handleExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Project info and reference documents - Editable */}
        <SummaryHeader data={data} versionId={versionId} onUpdate={refetch} />

        {/* Comments section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Commentaires</h3>
            </div>
            <QuoteComments quoteVersionId={versionId} />
          </CardContent>
        </Card>

        {/* Lot summary */}
        <SummaryLotTable data={data} />

        {/* Detailed breakdown per lot */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Détail par lot</h2>
          {data.lots.map((lot) => (
            <SummaryLotDetail key={lot.id} lot={lot} />
          ))}
        </div>
      </div>
    </div>
  );
};
