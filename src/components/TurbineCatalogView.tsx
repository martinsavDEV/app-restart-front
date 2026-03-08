import { useState } from "react";
import { useTurbineCatalog, useFoundationHistory, TurbineCatalogEntry } from "@/hooks/useTurbineCatalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Wind, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MANUFACTURERS = ["Vestas", "Nordex", "Enercon", "Siemens Gamesa", "GE"];

export const TurbineCatalogView = () => {
  const { catalogQuery, addTurbineModel, deleteTurbineModel } = useTurbineCatalog();
  const [selectedTurbine, setSelectedTurbine] = useState<TurbineCatalogEntry | null>(null);
  const [addModelOpen, setAddModelOpen] = useState(false);
  const [newManufacturer, setNewManufacturer] = useState("Vestas");
  const [newModel, setNewModel] = useState("");
  const [addHistoryOpen, setAddHistoryOpen] = useState(false);

  const { historyQuery, addHistory, deleteHistory } = useFoundationHistory(selectedTurbine?.id || null);

  // New history form state
  const [histForm, setHistForm] = useState({
    hub_height: "",
    diametre_fondation: "",
    marge_securite: "",
    pente_talus: "1:1",
    hauteur_cage: "",
    project_name: "",
    notes: "",
  });

  const handleAddModel = async () => {
    if (!newModel.trim()) {
      toast.error("Le modèle est requis");
      return;
    }
    try {
      await addTurbineModel.mutateAsync({ manufacturer: newManufacturer, model: newModel.trim() });
      toast.success("Modèle ajouté");
      setAddModelOpen(false);
      setNewModel("");
    } catch {
      toast.error("Erreur (modèle peut-être déjà existant)");
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (!confirm("Supprimer ce modèle et tout son historique ?")) return;
    try {
      await deleteTurbineModel.mutateAsync(id);
      if (selectedTurbine?.id === id) setSelectedTurbine(null);
      toast.success("Modèle supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleAddHistory = async () => {
    if (!selectedTurbine) return;
    try {
      await addHistory.mutateAsync({
        turbine_id: selectedTurbine.id,
        hub_height: histForm.hub_height ? parseFloat(histForm.hub_height) : null,
        diametre_fondation: histForm.diametre_fondation ? parseFloat(histForm.diametre_fondation) : null,
        marge_securite: histForm.marge_securite ? parseFloat(histForm.marge_securite) : null,
        pente_talus: histForm.pente_talus || null,
        hauteur_cage: histForm.hauteur_cage ? parseFloat(histForm.hauteur_cage) : null,
        project_name: histForm.project_name || null,
        notes: histForm.notes || null,
      });
      toast.success("Historique ajouté");
      setAddHistoryOpen(false);
      setHistForm({ hub_height: "", diametre_fondation: "", marge_securite: "", pente_talus: "1:1", hauteur_cage: "", project_name: "", notes: "" });
    } catch {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      await deleteHistory.mutateAsync(id);
      toast.success("Entrée supprimée");
    } catch {
      toast.error("Erreur");
    }
  };

  // Group catalog by manufacturer
  const grouped = (catalogQuery.data || []).reduce<Record<string, TurbineCatalogEntry[]>>((acc, t) => {
    (acc[t.manufacturer] = acc[t.manufacturer] || []).push(t);
    return acc;
  }, {});

  return (
    <div className="flex h-full">
      {/* Left panel: catalog list */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Wind className="h-5 w-5 text-accent" />
            Catalogue éoliennes
          </h2>
          <Button size="sm" variant="outline" onClick={() => setAddModelOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {Object.entries(grouped).map(([mfr, models]) => (
              <div key={mfr} className="mb-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">{mfr}</div>
                {models.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTurbine(t)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors",
                      selectedTurbine?.id === t.id
                        ? "bg-accent/10 text-accent font-medium"
                        : "hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <span>{t.model}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  </button>
                ))}
              </div>
            ))}
            {catalogQuery.data?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun modèle enregistré</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right panel: history for selected turbine */}
      <div className="flex-1 p-6 overflow-y-auto">
        {selectedTurbine ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {selectedTurbine.manufacturer} {selectedTurbine.model}
                </h2>
                <p className="text-sm text-muted-foreground">Historique des designs de fondation</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setAddHistoryOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter un design
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteModel(selectedTurbine.id)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </div>

            {historyQuery.data && historyQuery.data.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>HH (m)</TableHead>
                        <TableHead>Ø Fondation (m)</TableHead>
                        <TableHead>Marge sécu.</TableHead>
                        <TableHead>Pente talus</TableHead>
                        <TableHead>H. cage (m)</TableHead>
                        <TableHead>Projet réf.</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyQuery.data.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell className="font-medium">{h.hub_height ?? "—"}</TableCell>
                          <TableCell>{h.diametre_fondation ?? "—"}</TableCell>
                          <TableCell>{h.marge_securite ?? "—"}</TableCell>
                          <TableCell>{h.pente_talus ?? "—"}</TableCell>
                          <TableCell>{h.hauteur_cage ?? "—"}</TableCell>
                          <TableCell>
                            {h.project_name ? (
                              <Badge variant="secondary" className="font-normal">{h.project_name}</Badge>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{h.notes || "—"}</TableCell>
                          <TableCell>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDeleteHistory(h.id)}>
                              <Trash2 className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground text-sm">
                  Aucun historique de fondation pour ce modèle
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <Wind className="h-12 w-12 mx-auto opacity-20" />
              <p>Sélectionnez un modèle d'éolienne</p>
            </div>
          </div>
        )}
      </div>

      {/* Add model dialog */}
      <Dialog open={addModelOpen} onOpenChange={setAddModelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un modèle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fabricant</Label>
              <Select value={newManufacturer} onValueChange={setNewManufacturer}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MANUFACTURERS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Modèle</Label>
              <Input value={newModel} onChange={(e) => setNewModel(e.target.value)} placeholder="V150, N163..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModelOpen(false)}>Annuler</Button>
            <Button onClick={handleAddModel} disabled={addTurbineModel.isPending}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add history dialog */}
      <Dialog open={addHistoryOpen} onOpenChange={setAddHistoryOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un design historique</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Hub Height (m)</Label>
              <Input value={histForm.hub_height} onChange={(e) => setHistForm({ ...histForm, hub_height: e.target.value })} type="number" />
            </div>
            <div>
              <Label>Ø Fondation (m)</Label>
              <Input value={histForm.diametre_fondation} onChange={(e) => setHistForm({ ...histForm, diametre_fondation: e.target.value })} type="number" />
            </div>
            <div>
              <Label>Marge sécurité</Label>
              <Input value={histForm.marge_securite} onChange={(e) => setHistForm({ ...histForm, marge_securite: e.target.value })} type="number" step="0.1" />
            </div>
            <div>
              <Label>Pente talus</Label>
              <Select value={histForm.pente_talus} onValueChange={(v) => setHistForm({ ...histForm, pente_talus: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">1:1</SelectItem>
                  <SelectItem value="3:2">3:2</SelectItem>
                  <SelectItem value="2:1">2:1</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Hauteur cage (m)</Label>
              <Input value={histForm.hauteur_cage} onChange={(e) => setHistForm({ ...histForm, hauteur_cage: e.target.value })} type="number" step="0.1" />
            </div>
            <div>
              <Label>Projet de référence</Label>
              <Input value={histForm.project_name} onChange={(e) => setHistForm({ ...histForm, project_name: e.target.value })} placeholder="Ex: 51 - Francheville" />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Input value={histForm.notes} onChange={(e) => setHistForm({ ...histForm, notes: e.target.value })} placeholder="Commentaire libre..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddHistoryOpen(false)}>Annuler</Button>
            <Button onClick={handleAddHistory} disabled={addHistory.isPending}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
