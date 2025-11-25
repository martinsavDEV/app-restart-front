import { Card, CardContent } from "@/components/ui/card";
import { SummaryData } from "@/hooks/useSummaryData";
import { format } from "date-fns";

interface SummaryHeaderProps {
  data: SummaryData;
}

export const SummaryHeader = ({ data }: SummaryHeaderProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Informations Projet</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Nom du projet:</span>{" "}
              <span className="text-muted-foreground">{data.project?.name || "N/A"}</span>
            </div>
            <div>
              <span className="font-medium">Nombre d'éoliennes:</span>{" "}
              <span className="text-muted-foreground">
                {data.quoteSettings?.n_wtg || data.project?.n_wtg || 0}
              </span>
            </div>
            <div>
              <span className="font-medium">Version:</span>{" "}
              <span className="text-muted-foreground">
                {data.quoteVersion?.version_label || "N/A"}
              </span>
            </div>
            <div>
              <span className="font-medium">Dernière modification:</span>{" "}
              <span className="text-muted-foreground">
                {data.quoteVersion?.last_update
                  ? format(new Date(data.quoteVersion.last_update), "dd/MM/yyyy HH:mm")
                  : "N/A"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Documents de référence</h3>
          {data.referenceDocuments.length > 0 ? (
            <div className="space-y-1 text-sm">
              {data.referenceDocuments.map((doc) => (
                <div key={doc.id} className="text-muted-foreground">
                  <span className="font-medium">{doc.label}:</span> {doc.reference || "N/A"}
                  {doc.comment && <span className="text-xs ml-2">({doc.comment})</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun document de référence</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
