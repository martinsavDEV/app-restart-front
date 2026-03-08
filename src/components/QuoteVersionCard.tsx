import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight, Calendar, Star, MoreHorizontal, Copy, Pencil, Trash2, Wind, Zap, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface QuoteVersion {
  id: string;
  version_label: string;
  total_amount?: number | null;
  date_creation?: string | null;
  last_update?: string | null;
  comment?: string | null;
  type?: string | null;
  is_starred?: boolean;
  n_wtg?: number | null;
  turbine_power?: number | null;
  turbine_model?: string | null;
}

interface QuoteVersionCardProps {
  version: QuoteVersion;
  isSelected?: boolean;
  onSelect?: () => void;
  onOpen: () => void;
  onDuplicate?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onToggleStar?: () => void;
  commentCount?: number;
}

export const QuoteVersionCard = ({
  version,
  isSelected = false,
  onSelect,
  onOpen,
  onDuplicate,
  onRename,
  onDelete,
  onToggleStar,
}: QuoteVersionCardProps) => {
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const formatAmount = (amount: number | null | undefined) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if ((e.target as HTMLElement).closest('[role="menu"]')) return;
    onSelect?.();
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "p-4 rounded-lg border transition-all duration-200 cursor-pointer group",
        isSelected
          ? "bg-muted border-accent ring-2 ring-accent"
          : "bg-card/50 border-border hover:border-muted-foreground/30"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar?.();
              }}
              className={cn(
                "shrink-0 transition-colors",
                version.is_starred
                  ? "text-yellow-500"
                  : "text-muted-foreground/30 hover:text-yellow-400"
              )}
            >
              <Star className={cn("w-4 h-4", version.is_starred && "fill-current")} />
            </button>

            <span className={cn("font-medium truncate", isSelected ? "text-accent" : "text-foreground")}>
              {version.version_label}
            </span>
          </div>

          {/* Technical specs */}
          {(version.n_wtg || version.turbine_power || version.turbine_model) && (
            <div className="flex items-center gap-2 mt-1.5 ml-6 text-xs text-muted-foreground">
              {version.n_wtg && (
                <span className="flex items-center gap-1">
                  <Wind className="w-3 h-3" />
                  {version.n_wtg}
                </span>
              )}
              {version.turbine_power && (
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {version.turbine_power} MW
                </span>
              )}
              {version.turbine_model && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                  {version.turbine_model}
                </Badge>
              )}
            </div>
          )}

          {version.comment && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1 ml-6">
              {version.comment}
            </p>
          )}

          <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground ml-6">
            <Calendar className="w-3 h-3" />
            {formatDate(version.last_update || version.date_creation)}
          </div>
        </div>

        <div className="flex items-start gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onRename?.()}>
                <Pencil className="w-3.5 h-3.5 mr-2" />
                Renommer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.()}>
                <Copy className="w-3.5 h-3.5 mr-2" />
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.()}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="text-right">
            <div className={cn(
              "font-mono font-semibold",
              isSelected ? "text-lg text-foreground" : "text-sm text-muted-foreground"
            )}>
              {formatAmount(version.total_amount)}
            </div>
            {isSelected && (
              <Button
                size="sm"
                className="mt-2 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen();
                }}
              >
                Ouvrir
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
