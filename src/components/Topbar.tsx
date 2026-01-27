import { Search, User, Moon, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

interface TopbarProps {
  projectName?: string | null;
  projectCode?: string | null;
  versionLabel?: string | null;
  currentView?: string;
}

const viewLabels: Record<string, string> = {
  projects: "Vue d'ensemble",
  quotes: "Versions de chiffrage",
  pricing: "Chiffrage",
  summary: "Export CAPEX",
  "price-db": "Base de prix",
  templates: "Templates",
  "data-admin": "Admin Data",
};

export const Topbar = ({ projectName, projectCode, versionLabel, currentView = "projects" }: TopbarProps) => {
  const { theme, setTheme } = useTheme();

  // Determine if we're in a project context (not on projects list or utility views)
  const isProjectContext = currentView !== "projects" && currentView !== "price-db" && currentView !== "templates" && currentView !== "data-admin";

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6 shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Projets</span>
        
        {isProjectContext && projectName ? (
          <>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-foreground font-medium">{projectName}</span>
            {versionLabel && (
              <>
                <span className="text-muted-foreground/50">/</span>
                <span className="text-primary font-medium">{versionLabel}</span>
              </>
            )}
            <span className="text-muted-foreground/50">·</span>
            <span className="text-muted-foreground">{viewLabels[currentView] || currentView}</span>
          </>
        ) : (
          <>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-foreground font-medium">{viewLabels[currentView] || currentView}</span>
          </>
        )}
      </div>

      {/* Search */}
      <div className="w-96 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
        <Input
          placeholder="Recherche intelligente (Ex: Projets Aveyron > 3MW)"
          className="pl-9 bg-card border-border text-sm placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-8 w-8"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Moon className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>

        {/* User avatar */}
        <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
};
