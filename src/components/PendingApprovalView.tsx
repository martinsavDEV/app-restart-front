import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogOut, Wind } from "lucide-react";

export function PendingApprovalView() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-12 h-12 mx-auto mb-4 bg-accent rounded-lg flex items-center justify-center">
            <Wind className="w-7 h-7 text-accent-foreground" />
          </div>
          <div className="w-16 h-16 mx-auto mb-2 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl">Compte en attente</CardTitle>
          <CardDescription className="text-base">
            Votre compte a bien été créé. Un administrateur doit valider votre accès avant que vous puissiez utiliser l'application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              Connecté en tant que
            </p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={signOut} className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Se déconnecter
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
