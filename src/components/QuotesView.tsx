import { useEffect, useState } from "react";
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
  projectName?: string;
  initialSelectedVersionId?: string;
  onVersionChange?: (versionId: string) => void;
}

const quoteVersions: QuoteVersion[] = [
  {
    id: "v3",
    name: "V3 – Révision accès",
    date: "14/03/2025",
    author: "Martin Savouré",
    capex: "18,35 M€",
    comment: "Étude d'accès mise à jour",
  },
  {
    id: "v2",
    name: "V2 – Offre turbinier",
    date: "02/02/2025",
    author: "Martin Savouré",
    capex: "18,10 M€",
    comment: "Intègre la dernière offre fournisseur",
  },
  {
    id: "v1",
    name: "V1 – Études préliminaires",
    date: "15/11/2024",
    author: "Martin Savouré",
    capex: "17,60 M€",
    comment: "Hypothèses de base",
  },
];

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
  projectName,
  initialSelectedVersionId,
  onVersionChange,
}: QuotesViewProps) => {
  const [selectedVersion, setSelectedVersion] = useState(
    initialSelectedVersionId || "v3"
  );
  const [versionDocuments, setVersionDocuments] = useState<
    Record<string, ReferenceDocument[]>
  >(() => {
    const initialMapping: Record<string, ReferenceDocument[]> = {};
    quoteVersions.forEach((version) => {
      const versionDocs = referenceDocumentsByVersion[version.id] || [];
      initialMapping[version.id] = versionDocs.map((doc) => ({ ...doc }));
    });
    return initialMapping;
  });
  const [documents, setDocuments] = useState(referenceDocuments);

  useEffect(() => {
    if (initialSelectedVersionId) {
      setSelectedVersion(initialSelectedVersionId);
    }
  }, [initialSelectedVersionId]);

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersion(versionId);
    setVersionDocuments((prev) => {
      if (prev[versionId]) return prev;
      const fallbackDocs = referenceDocumentsByVersion[versionId] || [];
      return { ...prev, [versionId]: fallbackDocs.map((doc) => ({ ...doc })) };
    });
    onVersionChange?.(versionId);
  };

  const handleDocumentCommentChange = (id: string, comment: string) => {
    setVersionDocuments((prev) => {
      const docsForSelectedVersion = prev[selectedVersion] || [];
      const updatedDocs = docsForSelectedVersion.map((doc) =>
        doc.id === id ? { ...doc, comment } : doc
      );
      return { ...prev, [selectedVersion]: updatedDocs };
    });
  };

  const documents = versionDocuments[selectedVersion] || [];
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, comment } : doc))
    );
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
                {quoteVersions.map((version) => (
                  <tr
                    key={version.id}
                    onClick={() => handleVersionSelect(version.id)}
                    className={cn(
                      "border-b hover:bg-muted/30 transition-colors cursor-pointer",
                      selectedVersion === version.id && "bg-accent-soft"
                    )}
                  >
                    <td className="py-3 px-2 font-medium">{version.name}</td>
                    <td className="py-3 px-2">{version.date}</td>
                    <td className="py-3 px-2">{version.author}</td>
                    <td className="py-3 px-2 font-semibold">{version.capex}</td>
                    <td className="py-3 px-2 text-muted-foreground">{version.comment}</td>
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
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b align-top">
                    <td className="py-3 px-2 font-medium">{doc.label}</td>
                    <td className="py-3 px-2">{doc.reference}</td>
                    <td className="py-3 px-2">
                      <Textarea
                        placeholder="Ajouter un commentaire ou un point de vigilance"
                        value={doc.comment}
                        onChange={(e) => handleDocumentCommentChange(doc.id, e.target.value)}
                        className="text-xs"
                        rows={2}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
