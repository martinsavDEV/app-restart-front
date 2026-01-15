import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Calendar } from "lucide-react";
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
}

interface QuoteVersionCardProps {
  version: QuoteVersion;
  isActive: boolean;
  onOpen: () => void;
}

export const QuoteVersionCard = ({ version, isActive, onOpen }: QuoteVersionCardProps) => {
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

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all duration-200",
        isActive
          ? "bg-muted border-accent"
          : "bg-card/50 border-border hover:border-muted-foreground/30"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("font-medium", isActive ? "text-accent" : "text-foreground")}>
              {version.version_label}
            </span>
            {isActive && (
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 text-[10px]">
                Active
              </Badge>
            )}
          </div>
          
          {version.comment && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {version.comment}
            </p>
          )}
          
          <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {formatDate(version.last_update || version.date_creation)}
          </div>
        </div>

        <div className="text-right">
          {isActive ? (
            <>
              <div className="font-mono text-lg font-semibold text-foreground">
                {formatAmount(version.total_amount)}
              </div>
              <Button
                size="sm"
                className="mt-2 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={onOpen}
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
                onClick={onOpen}
              >
                Consulter
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
