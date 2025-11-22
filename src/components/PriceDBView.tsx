import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const PriceDBView = () => {
  return (
    <div className="p-4 space-y-3">
      <div>
        <h1 className="text-lg font-semibold">Base de prix</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Historiques & tendances des prix unitaires
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Base de prix</CardTitle>
          <CardDescription className="text-xs">
            Fonctionnalité en développement - Historiques des prix unitaires par poste de travail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Cette section permettra de consulter et analyser l'évolution des prix unitaires utilisés dans les différents projets.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
