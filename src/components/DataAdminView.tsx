import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV, downloadTemplate, parseCSV, validateData } from "@/lib/csvUtils";

const tableConfigs = {
  projects: {
    label: "Projets",
    columns: ["name", "department", "n_wtg", "description"],
    requiredColumns: ["name"],
  },
  quote_versions: {
    label: "Versions de chiffrage",
    columns: ["project_id", "version_label", "type", "comment", "total_amount"],
    requiredColumns: ["project_id", "version_label"],
  },
  reference_documents: {
    label: "Documents de référence",
    columns: ["version_id", "label", "reference", "comment"],
    requiredColumns: ["version_id", "label"],
  },
  user_roles: {
    label: "Rôles utilisateurs",
    columns: ["user_id", "role"],
    requiredColumns: ["user_id", "role"],
  },
};

export const DataAdminView = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<keyof typeof tableConfigs>("projects");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);

  // Fetch data for all tables
  const { data: projects, refetch: refetchProjects } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: quoteVersions, refetch: refetchQuoteVersions } = useQuery({
    queryKey: ["admin-quote-versions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("quote_versions").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: referenceDocs, refetch: refetchReferenceDocs } = useQuery({
    queryKey: ["admin-reference-documents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reference_documents").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: userRoles, refetch: refetchUserRoles } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const getCurrentData = () => {
    switch (activeTab) {
      case "projects": return projects || [];
      case "quote_versions": return quoteVersions || [];
      case "reference_documents": return referenceDocs || [];
      case "user_roles": return userRoles || [];
    }
  };

  const refetchCurrentData = () => {
    switch (activeTab) {
      case "projects": return refetchProjects();
      case "quote_versions": return refetchQuoteVersions();
      case "reference_documents": return refetchReferenceDocs();
      case "user_roles": return refetchUserRoles();
    }
  };

  const handleExport = () => {
    const data = getCurrentData();
    const config = tableConfigs[activeTab];
    exportToCSV(data, activeTab, config.columns);
    toast({ title: "Export réussi", description: `${data.length} lignes exportées` });
  };

  const handleDownloadTemplate = () => {
    const config = tableConfigs[activeTab];
    downloadTemplate(config.columns, activeTab);
    toast({ title: "Template téléchargé" });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseCSV(file);
      setImportFile(file);
      setPreviewData(data);
      toast({ title: "Fichier chargé", description: `${data.length} lignes à importer` });
    } catch (error) {
      toast({ 
        title: "Erreur", 
        description: error instanceof Error ? error.message : "Erreur de parsing",
        variant: "destructive"
      });
    }
  };

  const handleImport = async () => {
    if (!previewData) return;

    const config = tableConfigs[activeTab];
    const validation = validateData(previewData, config.requiredColumns);

    if (!validation.valid) {
      toast({
        title: "Erreurs de validation",
        description: validation.errors.join(", "),
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.from(activeTab).insert(previewData);
      
      if (error) throw error;

      toast({ title: "Import réussi", description: `${previewData.length} lignes ajoutées` });
      setPreviewData(null);
      setImportFile(null);
      refetchCurrentData();
    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive"
      });
    }
  };

  const renderTable = (data: any[], columns: string[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col}>{col}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
              Aucune donnée
            </TableCell>
          </TableRow>
        ) : (
          data.map((row, i) => (
            <TableRow key={i}>
              {columns.map((col) => (
                <TableCell key={col}>{row[col]?.toString() || "-"}</TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Administration des données</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Import/Export CSV pour toutes les tables
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as keyof typeof tableConfigs)}>
        <TabsList>
          {Object.entries(tableConfigs).map(([key, config]) => (
            <TabsTrigger key={key} value={key}>
              {config.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(tableConfigs).map(([key, config]) => (
          <TabsContent key={key} value={key}>
            <div className="space-y-4">
              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                  <CardDescription>Export et import de données CSV</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button onClick={handleExport} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Exporter CSV
                    </Button>
                    <Button onClick={handleDownloadTemplate} variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      Télécharger Template
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="cursor-pointer"
                    />
                    {importFile && (
                      <Button onClick={handleImport}>
                        <Upload className="mr-2 h-4 w-4" />
                        Importer {previewData?.length || 0} lignes
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Preview Import */}
              {previewData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Aperçu des données à importer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderTable(previewData.slice(0, 10), config.columns)}
                    {previewData.length > 10 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        ... et {previewData.length - 10} lignes supplémentaires
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Current Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Données actuelles</CardTitle>
                  <CardDescription>
                    {getCurrentData().length} lignes dans la table
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderTable(getCurrentData(), config.columns)}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
