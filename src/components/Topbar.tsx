import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TopbarProps {
  projectName: string;
  projectCode: string;
}

export const Topbar = ({ projectName, projectCode }: TopbarProps) => {
  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 gap-3">
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="outline" className="bg-accent-soft text-accent border-accent/20">
          Projet sélectionné
        </Badge>
        <div className="font-medium max-w-[260px] truncate">{projectName}</div>
        <div className="text-xs text-muted-foreground">{projectCode}</div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          Export Excel CAPEX
        </Button>
        <Button size="sm">Sauvegarder la maquette</Button>
      </div>
    </header>
  );
};
