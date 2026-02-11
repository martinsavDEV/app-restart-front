import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SummaryData } from "@/hooks/useSummaryData";
import { useQuoteVersionUpdate } from "@/hooks/useQuoteVersionUpdate";
import { format } from "date-fns";
import { Pencil, Check, X, Loader2 } from "lucide-react";

interface SummaryHeaderProps {
  data: SummaryData;
  versionId: string;
  onUpdate?: () => void;
}

export const SummaryHeader = ({ data, versionId, onUpdate }: SummaryHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [versionLabel, setVersionLabel] = useState(data.quoteVersion?.version_label || "");
  const [nWtg, setNWtg] = useState(data.quoteSettings?.n_wtg || data.project?.n_wtg || 0);
  
  const { updateVersion, updateSettings } = useQuoteVersionUpdate();

  const handleStartEdit = () => {
    setVersionLabel(data.quoteVersion?.version_label || "");
    setNWtg(data.quoteSettings?.n_wtg || data.project?.n_wtg || 0);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      // Update version label if changed
      if (versionLabel !== data.quoteVersion?.version_label) {
        await updateVersion.mutateAsync({ versionId, versionLabel });
      }
      
      // Update n_wtg if changed
      const currentNWtg = data.quoteSettings?.n_wtg || 0;
      if (nWtg !== currentNWtg) {
        await updateSettings.mutateAsync({ versionId, nWtg });
      }
      
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  };

  const isPending = updateVersion.isPending || updateSettings.isPending;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Informations Chiffrage</h3>
            {!isEditing ? (
              <Button variant="ghost" size="icon" onClick={handleStartEdit}>
                <Pencil className="w-4 h-4" />
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleCancel}
                  disabled={isPending}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSave}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Nom du projet</Label>
                <Input
                  id="project-name"
                  value={data.project?.name || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="version-label">Nom du chiffrage</Label>
                <Input
                  id="version-label"
                  value={versionLabel}
                  onChange={(e) => setVersionLabel(e.target.value)}
                  placeholder="Ex: V1 - Initial"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="n-wtg">Nombre d'éoliennes</Label>
                <Input
                  id="n-wtg"
                  type="number"
                  min={0}
                  value={nWtg}
                  onChange={(e) => setNWtg(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Nom du projet:</span>{" "}
                <span className="text-muted-foreground">{data.project?.name || "N/A"}</span>
              </div>
              <div>
                <span className="font-medium">Nom du chiffrage:</span>{" "}
                <span className="text-muted-foreground">
                  {data.quoteVersion?.version_label || "N/A"}
                </span>
              </div>
              <div>
                <span className="font-medium">Nombre d'éoliennes:</span>{" "}
                <span className="text-muted-foreground">
                  {data.quoteSettings?.n_wtg || data.project?.n_wtg || 0}
                </span>
              </div>
              {(data.quoteSettings as any)?.calculator_data?.global?.tension_hta && (
                <div>
                  <span className="font-medium">Tension HTA:</span>{" "}
                  <span className="text-muted-foreground">
                    {(data.quoteSettings as any).calculator_data.global.tension_hta}
                  </span>
                </div>
              )}
              <div>
                <span className="font-medium">Dernière modification:</span>{" "}
                <span className="text-muted-foreground">
                  {data.quoteVersion?.last_update
                    ? format(new Date(data.quoteVersion.last_update), "dd/MM/yyyy HH:mm")
                    : "N/A"}
                </span>
              </div>
            </div>
          )}
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
