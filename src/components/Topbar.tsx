import { Search, Moon, Sun, Settings, LogOut, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
  projectName?: string | null;
  projectCode?: string | null;
  versionLabel?: string | null;
  currentView?: string;
  onNavigateAdmin?: () => void;
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

const getInitials = (email: string | undefined): string => {
  if (!email) return "?";
  const parts = email.split("@")[0].split(".");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
};

const getRoleLabel = (role: "admin" | "user" | null): string => {
  if (role === "admin") return "Administrateur";
  if (role === "user") return "Utilisateur";
  return "";
};

export const Topbar = ({
  projectName,
  projectCode,
  versionLabel,
  currentView = "projects",
  onNavigateAdmin,
}: TopbarProps) => {
  const { theme, setTheme } = useTheme();
  const { user, userRole, isAdmin, signOut } = useAuth();

  // Determine if we're in a project context (not on projects list or utility views)
  const isProjectContext =
    currentView !== "projects" &&
    currentView !== "price-db" &&
    currentView !== "templates" &&
    currentView !== "data-admin";

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
            <span className="text-muted-foreground">
              {viewLabels[currentView] || currentView}
            </span>
          </>
        ) : (
          <>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-foreground font-medium">
              {viewLabels[currentView] || currentView}
            </span>
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

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 gap-2 px-2 hover:bg-muted"
            >
              <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center">
                <span className="text-xs font-medium text-accent-foreground">
                  {getInitials(user?.email)}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.email}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {getRoleLabel(userRole)}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isAdmin && onNavigateAdmin && (
              <DropdownMenuItem onClick={onNavigateAdmin}>
                <Settings className="mr-2 h-4 w-4" />
                Admin / Utilisateurs
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
