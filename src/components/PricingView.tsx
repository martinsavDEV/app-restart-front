import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const PricingView = () => {
  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-lg font-semibold">Chiffrage projet</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            BPU par lots pour Parc éolien La Besse
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Charger un template chantier type
          </Button>
          <Button size="sm">Appliquer prix BDD</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <div className="space-y-3">
          {/* Terrassement */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm">Terrassement</CardTitle>
                  <CardDescription className="text-xs">
                    Lignes BPU : désignation, Q, U, PU, total, source prix
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[11px]">
                  + Ajouter une ligne
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                        Désignation
                      </th>
                      <th className="text-right py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                        Qté
                      </th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                        Unité
                      </th>
                      <th className="text-right py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                        PU
                      </th>
                      <th className="text-right py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                        Total
                      </th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                        Source prix
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/30">
                      <td className="py-3 px-2">Décapage plate-forme éolienne</td>
                      <td className="py-3 px-2 text-right tabular-nums">1 200</td>
                      <td className="py-3 px-2">m²</td>
                      <td className="py-3 px-2 text-right tabular-nums">4,10 €</td>
                      <td className="py-3 px-2 text-right tabular-nums font-semibold">4 920 €</td>
                      <td className="py-3 px-2 text-muted-foreground">BDD – médiane 3 projets</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Renforcement de sol */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm">Renforcement de sol</CardTitle>
                  <CardDescription className="text-xs">
                    Ex : CMC, inclusions rigides, amélioration locale...
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[11px]">
                  + Ajouter une ligne
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Maquette : même logique de tableau. On remplira ensuite les lignes types.
              </p>
            </CardContent>
          </Card>

          {/* Fondations */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm">Fondations</CardTitle>
                  <CardDescription className="text-xs">
                    Béton, armatures, fouilles, drains, mises à la terre…
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[11px]">
                  + Ajouter une ligne
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Ici tu pourras charger un sous-template « fondation type » selon le modèle géotechnique.
              </p>
            </CardContent>
          </Card>

          {/* Électricité */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm">Électricité</CardTitle>
                  <CardDescription className="text-xs">
                    Tranchées HTA, câbles, poste de livraison, réseaux divers…
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[11px]">
                  + Ajouter une ligne
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Sous-templates : poste HTA/BT standard, tranchée agricole, traversées, etc.
              </p>
            </CardContent>
          </Card>

          {/* Turbinier */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm">Turbinier</CardTitle>
                  <CardDescription className="text-xs">
                    Prix forfaitaires par éolienne, options, logistique…
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[11px]">
                  + Ajouter une ligne
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Ici : recap offre turbinier (prix unitaire par machine, options, indexation, etc.).
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CAPEX Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Résumé CAPEX</CardTitle>
              <CardDescription className="text-xs">Total par lot + aléas / provisions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Terrassement</span>
                  <span className="tabular-nums">4 920 €</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Renforcement de sol</span>
                  <span className="tabular-nums">0 €</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Fondations</span>
                  <span className="tabular-nums">0 €</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Électricité</span>
                  <span className="tabular-nums">0 €</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Turbinier</span>
                  <span className="tabular-nums">0 €</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between py-1 font-medium">
                  <span>Total lots</span>
                  <span className="tabular-nums">4 920 €</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Aléas (10%)</span>
                  <span className="tabular-nums">492 €</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between py-1.5 font-semibold text-sm text-accent">
                  <span>CAPEX TOTAL</span>
                  <span className="tabular-nums">5 412 €</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
