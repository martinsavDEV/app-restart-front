import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Database,
  FileStack,
  Calculator,
  FileSpreadsheet,
  Coins,
  Layout,
  Settings,
  LogOut,
  Wind,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { id: "projects", label: "Projets", icon: Database },
  { id: "quotes", label: "Versions de chiffrage", icon: FileStack },
  { id: "pricing", label: "Chiffrage projet", icon: Calculator },
  { id: "summary", label: "Export CAPEX", icon: FileSpreadsheet },
  { id: "price-db", label: "Base de prix", icon: Coins },
  { id: "templates", label: "Templates", icon: Layout },
  { id: "data-admin", label: "Admin / Utilisateurs", icon: Settings, adminOnly: true },
];

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  quotesEnabled?: boolean;
}

export const Sidebar = ({ activeView, onViewChange, quotesEnabled = false }: SidebarProps) => {
  const { signOut, isAdmin } = useAuth();

  // Filter nav items based on admin status
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <TooltipProvider delayDuration={100}>
      <aside className="w-16 bg-card border-r border-border flex flex-col items-center py-4 shrink-0">
        {/* Logo */}
        <div className="w-9 h-9 mb-6 bg-accent rounded-lg flex items-center justify-center">
          <Wind className="w-5 h-5 text-accent-foreground" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 w-full px-2">
          {visibleNavItems.map((item) => {
            const isActive = activeView === item.id;
            const isDisabled = item.id === "quotes" && !quotesEnabled;
            const Icon = item.icon;

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => !isDisabled && onViewChange(item.id)}
                    disabled={isDisabled}
                    className={cn(
                      "relative w-full p-3 rounded-lg transition-all duration-200",
                      "flex items-center justify-center",
                      "hover:bg-sidebar-accent",
                      isActive && "bg-sidebar-accent",
                      isDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
                    )}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-accent rounded-full" />
                    )}
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-colors",
                        isActive ? "text-accent" : "text-muted-foreground"
                      )}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-border w-full px-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-12 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                onClick={() => signOut()}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Déconnexion</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
};
