import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type ProjectStatus = "study" | "offers" | "built";

interface ProjectVersion {
  id: string;
  name: string;
  date: string;
  capex: string;
  comment: string;
}

interface Project {
  id: string;
  name: string;
  code: string;
  region: string;
  power: string;
  turbines: number;
  status: ProjectStatus;
  versions: ProjectVersion[];
}

interface ProjectsViewProps {
  onOpenQuotes?: (projectId: string, projectName: string, versionId: string) => void;
}

const projects: Project[] = [
  {
    id: "1",
    name: "41 - Parc éolien La Besse",
    code: "FR-PE-001",
    region: "France – Centre-Val de Loire",
    power: "18 MW",
    turbines: 6,
    status: "study",
    versions: [
      {
        id: "v3",
        name: "V3 – Révision accès",
        date: "14/03/2025",
        capex: "18,35 M€",
        comment: "Étude d'accès mise à jour",
      },
      {
        id: "v2",
        name: "V2 – Offre turbinier",
        date: "02/02/2025",
        capex: "18,10 M€",
        comment: "Intègre la dernière offre fournisseur",
      },
      {
        id: "v1",
        name: "V1 – Études préliminaires",
        date: "15/11/2024",
        capex: "17,60 M€",
        comment: "Hypothèses de base",
      },
    ],
  },
  {
    id: "2",
    name: "02 - Parc éolien Épine-aux-Bois",
    code: "FR-PE-002",
    region: "France – Hauts-de-France",
    power: "24 MW",
    turbines: 8,
    status: "offers",
    versions: [
      {
        id: "v5",
        name: "V5 – Alignement fournisseurs",
        date: "02/02/2025",
        capex: "21,45 M€",
        comment: "Version consolidée après retours",
      },
      {
        id: "v4",
        name: "V4 – Révision géotech",
        date: "18/12/2024",
        capex: "21,20 M€",
        comment: "Prise en compte des nouveaux sondages",
      },
      {
        id: "v3",
        name: "V3 – Offre turbinier",
        date: "05/11/2024",
        capex: "20,80 M€",
        comment: "Mise à jour prix machines",
      },
    ],
  },
  {
    id: "3",
    name: "16 - Parc éolien Cherves-Châtelars",
    code: "FR-PE-003",
    region: "France – Nouvelle-Aquitaine",
    power: "30 MW",
    turbines: 10,
    status: "built",
    versions: [
      {
        id: "v12",
        name: "V12 – As built",
        date: "11/09/2024",
        capex: "25,30 M€",
        comment: "Chiffrage final après construction",
      },
      {
        id: "v9",
        name: "V9 – Révision planning",
        date: "22/05/2024",
        capex: "24,90 M€",
        comment: "Optimisation du calendrier travaux",
      },
      {
        id: "v6",
        name: "V6 – Offre EPC",
        date: "14/03/2024",
        capex: "24,10 M€",
        comment: "Intègre l'offre EPC finale",
      },
    ],
  },
];

const getStatusBadge = (status: ProjectStatus) => {
  const variants = {
    study: { label: "En étude", className: "bg-status-study-bg text-status-study" },
    offers: { label: "Offres en cours", className: "bg-status-offers-bg text-status-offers" },
    built: { label: "Construit", className: "bg-status-built-bg text-status-built" },
  };
  const variant = variants[status];
  return <Badge className={cn("text-[10px] font-medium", variant.className)}>{variant.label}</Badge>;
};

export const ProjectsView = ({ onOpenQuotes }: ProjectsViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  const filteredProjects = projects.filter((project) => {
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const normalizedQuery = searchQuery.toLowerCase();

    const matchesQuery =
      project.name.toLowerCase().includes(normalizedQuery) ||
      project.code.toLowerCase().includes(normalizedQuery) ||
      project.region.toLowerCase().includes(normalizedQuery);

    return matchesStatus && (normalizedQuery.trim().length === 0 || matchesQuery);
  });

  const handleProjectClick = (projectId: string) => {
    setExpandedProjectId(prev => prev === projectId ? null : projectId);
  };

  const handleViewQuotes = (project: Project, version: ProjectVersion) => {
    if (onOpenQuotes) {
      onOpenQuotes(project.id, project.name, version.id);
    }
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-lg font-semibold">Projets éoliens</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Vue portefeuille, sélection du projet à chiffrer
          </p>
        </div>
        <Button size="sm">+ Nouveau projet</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Liste des projets et chiffrages</CardTitle>
          <CardDescription className="text-xs">
            Parcours rapide des projets et accès direct aux versions de chiffrage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Rechercher par nom, code, région..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[260px] h-9 text-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="study">En étude</SelectItem>
                <SelectItem value="offers">Offres en cours</SelectItem>
                <SelectItem value="built">Construit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3">
            {filteredProjects.map((project) => (
              <Collapsible
                key={project.id}
                open={expandedProjectId === project.id}
                onOpenChange={() => handleProjectClick(project.id)}
              >
                <Card
                  className={cn(
                    "border shadow-sm transition-all duration-200",
                    expandedProjectId === project.id && "border-primary/30 bg-accent-soft"
                  )}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-2 cursor-pointer hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-sm leading-tight">{project.name}</CardTitle>
                          <CardDescription className="text-xs text-muted-foreground">
                            {project.code} • {project.region}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right text-xs">
                            <div className="font-semibold">{project.power}</div>
                            <div className="text-muted-foreground text-[11px]">
                              {project.turbines} éoliennes
                            </div>
                          </div>
                          {getStatusBadge(project.status)}
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform duration-200",
                              expandedProjectId === project.id && "rotate-180"
                            )}
                          />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                    <CardContent className="pt-0 space-y-2">
                      <div className="text-[11px] uppercase text-muted-foreground font-medium">
                        Chiffrages du projet
                      </div>
                      <div className="space-y-2">
                        {project.versions.map((version) => (
                          <div
                            key={version.id}
                            className={cn(
                              "flex items-center justify-between gap-4 rounded-md border px-3 py-2",
                              "hover:border-primary/40 transition-colors"
                            )}
                          >
                            <div className="space-y-0.5">
                              <div className="text-xs font-semibold">{version.name}</div>
                              <div className="text-[11px] text-muted-foreground">{version.comment}</div>
                              <div className="text-[11px] text-muted-foreground">{version.date}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-xs font-semibold">{version.capex}</div>
                                <div className="text-[11px] text-muted-foreground">CAPEX</div>
                              </div>
                              {onOpenQuotes && (
                                <Button
                                  size="sm"
                                  className="h-8 text-[11px]"
                                  variant="outline"
                                  onClick={() => handleViewQuotes(project, version)}
                                >
                                  Voir le chiffrage
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
