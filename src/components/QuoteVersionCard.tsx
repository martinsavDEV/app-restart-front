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
import { ChevronRight, Calendar, Star, MoreHorizontal, Copy, Pencil, Trash2 } from "lucide-react";
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
}

interface QuoteVersionCardProps {
  version: QuoteVersion;
  isActive: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onOpen: () => void;
  onDuplicate?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onToggleStar?: () => void;
}

export const QuoteVersionCard = ({
  version,
  isActive,
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
        isSelected && "ring-2 ring-accent",
        isActive
          ? "bg-muted border-accent"
          : "bg-card/50 border-border hover:border-muted-foreground/30"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Star button */}
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

            <span className={cn("font-medium truncate", isActive ? "text-accent" : "text-foreground")}>
              {version.version_label}
            </span>
            {isActive && (
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 text-[10px] shrink-0">
                Active
              </Badge>
            )}
          </div>

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
          {/* Actions dropdown */}
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
            {isActive ? (
              <>
                <div className="font-mono text-lg font-semibold text-foreground">
                  {formatAmount(version.total_amount)}
                </div>
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
              </>
            ) : (
              <>
                <div className="font-mono text-sm text-muted-foreground">
                  {formatAmount(version.total_amount)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen();
                  }}
                >
                  Consulter
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
