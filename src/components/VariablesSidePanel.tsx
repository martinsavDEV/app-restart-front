import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalculatorVariable } from "@/types/bpu";
import { Search, Copy, Calculator, ChevronDown, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VariablesSidePanelProps {
  variables: CalculatorVariable[];
  isOpen: boolean;
  onClose: () => void;
  onOpenCalculator?: () => void;
}

export const VariablesSidePanel = ({
  variables,
  isOpen,
  onClose,
  onOpenCalculator,
}: VariablesSidePanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Filter variables based on search (with or without $)
  const filteredVariables = useMemo(() => {
    if (!searchQuery.trim()) return variables;

    const query = searchQuery.toLowerCase().replace(/^\$/, ""); // Remove leading $ if present
    return variables.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.name.toLowerCase().includes(`$${query}`) ||
        v.label.toLowerCase().includes(query)
    );
  }, [variables, searchQuery]);

  // Group by category
  const groupedVariables = useMemo(() => {
    return filteredVariables.reduce((acc, v) => {
      if (!acc[v.category]) acc[v.category] = [];
      acc[v.category].push(v);
      return acc;
    }, {} as Record<string, CalculatorVariable[]>);
  }, [filteredVariables]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${text} copié`);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const formatValue = (value: number): string => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Initialize expanded categories
  const isCategoryExpanded = (category: string) => {
    if (expandedCategories[category] === undefined) {
      // Default: expand if there's a search or category has few items
      return searchQuery.length > 0 || (groupedVariables[category]?.length || 0) <= 5;
    }
    return expandedCategories[category];
  };

  if (!isOpen) return null;

  return (
    <div className="w-72 border-l bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Variables
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher (ex: surf, nb_eol...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          Tapez avec ou sans le $ • {filteredVariables.length} variable{filteredVariables.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Variables list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {Object.keys(groupedVariables).length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {variables.length === 0
                ? "Aucune variable configurée"
                : "Aucun résultat pour cette recherche"}
            </div>
          ) : (
            Object.entries(groupedVariables).map(([category, vars]) => (
              <Collapsible
                key={category}
                open={isCategoryExpanded(category)}
                onOpenChange={() => toggleCategory(category)}
              >
                <CollapsibleTrigger className="flex items-center gap-1 w-full py-1.5 px-2 rounded hover:bg-muted/50 text-xs font-semibold text-muted-foreground">
                  {isCategoryExpanded(category) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  {category}
                  <span className="ml-auto text-[10px] font-normal">({vars.length})</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-0.5 ml-2">
                    {vars.map((variable) => (
                      <TooltipProvider key={variable.name} delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "flex items-center justify-between py-1.5 px-2 rounded text-xs",
                                "hover:bg-muted/50 cursor-pointer group transition-colors"
                              )}
                              onClick={() => copyToClipboard(variable.name)}
                            >
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-mono text-orange-600 dark:text-orange-400 truncate">
                                  {variable.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground truncate">
                                  {variable.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <span className="font-semibold tabular-nums">
                                  {formatValue(variable.value)}
                                </span>
                                <Copy className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="text-xs">
                            <p>Cliquer pour copier {variable.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer with Calculator button */}
      {onOpenCalculator && (
        <div className="p-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCalculator}
            className="w-full text-xs font-semibold"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Ouvrir le Calculator
          </Button>
        </div>
      )}
    </div>
  );
};
