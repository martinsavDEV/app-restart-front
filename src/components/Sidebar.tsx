import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  description: string;
}

const navItems: NavItem[] = [
  { id: "projects", label: "Projets", description: "Portfolio + métadonnées" },
  { id: "quotes", label: "Versions de chiffrage", description: "Historique par projet" },
  { id: "pricing", label: "Chiffrage projet", description: "Lots & BPU" },
  { id: "price-db", label: "Base de prix", description: "Historiques & tendances" },
  { id: "templates", label: "Templates", description: "Chantiers types / sous-lots" },
];

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  quotesEnabled?: boolean;
}

export const Sidebar = ({ activeView, onViewChange, quotesEnabled = false }: SidebarProps) => {
  return (
    <aside className="w-[260px] bg-sidebar text-sidebar-foreground flex flex-col min-h-screen">
      <div className="p-4 border-b border-sidebar-border">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
          Axpo / Volkswind
        </div>
        <div className="text-lg font-semibold">VW-QuoteMaster</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          Chiffrage projets éoliens
        </div>
      </div>

      <nav className="p-2 flex-1">
        {navItems.map((item) => {
          const isDisabled = item.id === "quotes" && !quotesEnabled;

          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && onViewChange(item.id)}
              disabled={isDisabled}
              className={cn(
                "w-full text-left p-2.5 rounded-lg mb-1.5 transition-colors",
                "hover:bg-sidebar-accent",
                activeView === item.id && "bg-sidebar-accent border border-sidebar-border",
                isDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
              )}
            >
              <div className="text-xs font-medium">{item.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {item.description}
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border text-[11px] text-muted-foreground">
        v0.2 – Maquette UX interactive
      </div>
    </aside>
  );
};
