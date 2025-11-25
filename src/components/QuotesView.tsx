import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface QuoteVersion {
  id: string;
  name: string;
  date: string;
  author: string;
  capex: string;
  comment: string;
}

interface ReferenceDocument {
  id: string;
  label: string;
  reference: string;
  comment: string;
}

interface QuotesViewProps {
  projectId?: string;
  projectName?: string;
  initialSelectedVersionId?: string;
  onVersionChange?: (versionId: string) => void;
}

const referenceDocumentsByVersion: Record<string, ReferenceDocument[]> = {
  v3: [
    {
      id: "layout",
      label: "Plan layout indice",
      reference: "PE-LAY-012 – Indice C",
      comment: "",
    },
    {
      id: "access",
      label: "Étude d'accès",
      reference: "EA-TR-004 – Indice B",
      comment: "",
    },
    {
      id: "single-line",
      label: "Unifilaire HTA",
      reference: "ELEC-UNI-006 – Indice A",
      comment: "",
    },
    {
      id: "soil",
      label: "Étude de sol",
      reference: "GEO-SOND-009 – Indice D",
      comment: "",
    },
  ],
  v2: [
    {
      id: "layout",
      label: "Plan layout indice",
      reference: "PE-LAY-009 – Indice B",
      comment: "",
    },
    {
      id: "access",
      label: "Étude d'accès",
      reference: "EA-TR-003 – Indice A",
      comment: "",
    },
    {
      id: "single-line",
      label: "Unifilaire HTA",
      reference: "ELEC-UNI-004 – Indice A",
      comment: "",
    },
    {
      id: "soil",
      label: "Étude de sol",
      reference: "GEO-SOND-009 – Indice C",
      comment: "",
    },
  ],
  v1: [
    {
      id: "layout",
      label: "Plan layout indice",
      reference: "PE-LAY-006 – Indice A",
      comment: "",
    },
    {
      id: "access",
      label: "Étude d'accès",
      reference: "EA-TR-001 – Indice A",
      comment: "",
    },
    {
      id: "single-line",
      label: "Unifilaire HTA",
      reference: "ELEC-UNI-002 – Indice A",
      comment: "",
    },
    {
      id: "soil",
      label: "Étude de sol",
      reference: "GEO-SOND-009 – Indice B",
      comment: "",
    },
  ],
};

export const QuotesView = ({
  projectId,
  projectName,
  initialSelectedVersionId,
  onVersionChange,
}: QuotesViewProps) => {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(
    initialSelectedVersionId || null
  );

  // Fetch quote versions from Supabase
  const { data: quoteVersions } = useQuery({
    queryKey: ["quote-versions", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("quote_versions")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch reference documents for selected version
  const { data: referenceDocuments } = useQuery({
    queryKey: ["reference-documents", selectedVersion],
    queryFn: async () => {
      if (!selectedVersion) return [];
      const { data, error } = await supabase
        .from("reference_documents")
        .select("*")
        .eq("version_id", selectedVersion);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedVersion,
  });

  useEffect(() => {
    if (initialSelectedVersionId) {
      setSelectedVersion(initialSelectedVersionId);
    } else if (quoteVersions && quoteVersions.length > 0 && !selectedVersion) {
      setSelectedVersion(quoteVersions[0].id);
    }
  }, [initialSelectedVersionId, quoteVersions, selectedVersion]);

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersion(versionId);
    onVersionChange?.(versionId);
  };

  const handleDocumentCommentChange = async (id: string, comment: string) => {
    await supabase
      .from("reference_documents")
      .update({ comment })
      .eq("id", id);
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "0,00 €";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fr-FR");
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-lg font-semibold">Versions de chiffrage</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Historique des CAPEX par version pour {projectName || "41 - Parc éolien La Besse"}
          </p>
        </div>
        <Button size="sm">+ Nouvelle version (copier la dernière)</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Liste des versions</CardTitle>
          <CardDescription className="text-xs">
            V1 Études préliminaires, V2 Offre turbinier, V3 Révision accès, etc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                    Version
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                    Date
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                    Auteur
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                    CAPEX total
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                    Commentaire
                  </th>
                </tr>
              </thead>
              <tbody>
                {quoteVersions?.map((version) => (
                  <tr
                    key={version.id}
                    onClick={() => handleVersionSelect(version.id)}
                    className={cn(
                      "border-b hover:bg-muted/30 transition-colors cursor-pointer",
                      selectedVersion === version.id && "bg-accent-soft"
                    )}
                  >
                    <td className="py-3 px-2 font-medium">{version.version_label}</td>
                    <td className="py-3 px-2">{formatDate(version.date_creation)}</td>
                    <td className="py-3 px-2">-</td>
                    <td className="py-3 px-2 font-semibold tabular-nums">{formatCurrency(version.total_amount)}</td>
                    <td className="py-3 px-2 text-muted-foreground">{version.comment || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Documents de référence</CardTitle>
          <CardDescription className="text-xs">
            Plans layout, études d'accès, unifilaires, sols, etc. attachés à la version sélectionnée
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                    Document
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                    Référence / indice
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase w-[320px]">
                    Commentaire
                  </th>
                </tr>
              </thead>
              <tbody>
                {referenceDocuments?.map((doc) => (
                  <tr key={doc.id} className="border-b align-top">
                    <td className="py-3 px-2 font-medium">{doc.label}</td>
                    <td className="py-3 px-2">{doc.reference || "-"}</td>
                    <td className="py-3 px-2">
                      <Textarea
                        placeholder="Ajouter un commentaire ou un point de vigilance"
                        value={doc.comment || ""}
                        onChange={(e) => handleDocumentCommentChange(doc.id, e.target.value)}
                        className="text-xs"
                        rows={2}
                      />
                    </td>
                  </tr>
                ))}
                {(!referenceDocuments || referenceDocuments.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-xs text-muted-foreground">
                      Aucun document de référence pour cette version
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
