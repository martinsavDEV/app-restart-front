import { Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TopbarProps {
  projectName: string;
  projectCode: string;
  currentView?: string;
}

const viewLabels: Record<string, string> = {
  projects: "Vue d'ensemble",
  quotes: "Versions de chiffrage",
  pricing: "Chiffrage projet",
  summary: "Export CAPEX",
  "price-db": "Base de prix",
  templates: "Templates",
  "data-admin": "Admin Data",
};

export const Topbar = ({ projectName, projectCode, currentView = "projects" }: TopbarProps) => {
  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6 shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Projets</span>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-foreground font-medium">{viewLabels[currentView] || currentView}</span>
      </div>

      {/* Search */}
      <div className="w-96 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
        <Input
          placeholder="Recherche intelligente (Ex: Projets Aveyron > 3MW)"
          className="pl-9 bg-card border-border text-sm placeholder:text-muted-foreground/50"
        />
      </div>

      {/* User avatar */}
      <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center">
        <User className="w-4 h-4 text-muted-foreground" />
      </div>
    </header>
  );
};
