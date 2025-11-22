import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const TemplatesView = () => {
  return (
    <div className="p-4 space-y-3">
      <div>
        <h1 className="text-lg font-semibold">Templates</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Chantiers types / sous-lots prédéfinis
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Templates de chiffrage</CardTitle>
          <CardDescription className="text-xs">
            Fonctionnalité en développement - Modèles de BPU réutilisables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Cette section permettra de créer et gérer des templates de chiffrage réutilisables pour accélérer la création de nouveaux projets.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
