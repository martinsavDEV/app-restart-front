import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Copy, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTemplates } from "@/hooks/useTemplates";
import { TemplateEditorDialog } from "./TemplateEditorDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const LOT_TABS = [
  { value: "fondation", label: "Fondations" },
  { value: "terrassement", label: "Terrassement" },
  { value: "renforcement", label: "Renforcement" },
  { value: "electricite", label: "Électricité" },
  { value: "turbine", label: "Turbine" },
];

export const TemplatesView = () => {
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate } = useTemplates();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("fondation");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const calculateTemplateTotal = (templateLines: any) => {
    if (!templateLines?.sections) return 0;
    return templateLines.sections.reduce((lotTotal: number, section: any) => {
      const sectionTotal = section.lines.reduce((sum: number, line: any) => sum + (line.quantity * line.unitPrice), 0);
      return lotTotal + sectionTotal;
    }, 0);
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setEditorOpen(true);
  };

  const handleEdit = (template: any) => {
    setEditingTemplate(template);
    setEditorOpen(true);
  };

  const handleSave = (template: { code: string; label: string; description?: string; template_lines: any }) => {
    if (editingTemplate) {
      updateTemplate.mutate({ id: editingTemplate.id, template });
    } else {
      createTemplate.mutate(template);
    }
  };

  const handleDelete = (id: string) => {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      deleteTemplate.mutate(templateToDelete);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleDuplicate = (id: string) => {
    duplicateTemplate.mutate(id);
  };

  const getTemplatesByLot = (lotCode: string) => {
    return templates?.filter(t => t.code === lotCode) || [];
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-sm text-muted-foreground">Chargement des templates...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Templates</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Modèles de chiffrage réutilisables
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          {LOT_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {LOT_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-3">
            <div className="grid gap-3">
              {getTemplatesByLot(tab.value).length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Aucun template pour ce lot
                    </p>
                    <Button size="sm" variant="outline" className="mt-3" onClick={handleCreateNew}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer le premier template
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                getTemplatesByLot(tab.value).map((template) => {
                  const templateLines = template.template_lines as any;
                  const sections = templateLines?.sections || [];
                  return (
                    <Card key={template.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-sm">{template.label}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {template.description}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-foreground">
                              {formatCurrency(calculateTemplateTotal(templateLines))}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {sections.length} sections
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {sections.map((section: any) => {
                            const sectionTotal = section.lines.reduce((sum: number, line: any) => sum + (line.quantity * line.unitPrice), 0);
                            return (
                              <div key={section.id} className="flex items-center justify-between py-1.5 border-l-2 border-border pl-3">
                                <div>
                                  <div className="text-xs font-medium">{section.title}</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {section.lines.length} lignes
                                  </div>
                                </div>
                                <div className="text-xs font-medium">
                                  {formatCurrency(sectionTotal)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 pt-3 border-t flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(template)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Éditer
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDuplicate(template.id)}>
                            <Copy className="h-3 w-3 mr-1" />
                            Dupliquer
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(template.id)}>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <TemplateEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editingTemplate}
        onSave={handleSave}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce template ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
