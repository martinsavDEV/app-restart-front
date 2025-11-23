import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProjectStatus = "study" | "offers" | "built";

interface Project {
  id: string;
  name: string;
  code: string;
  region: string;
  power: string;
  turbines: number;
  versions: number;
  status: ProjectStatus;
  lastQuote: string;
}

interface ProjectVersion {
  id: string;
  name: string;
  date: string;
  capex: string;
  comment: string;
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
    versions: 3,
    status: "study",
    lastQuote: "V3 – 14/03/2025",
  },
  {
    id: "2",
    name: "02 - Parc éolien Épine-aux-Bois",
    code: "FR-PE-002",
    region: "France – Hauts-de-France",
    power: "24 MW",
    turbines: 8,
    versions: 5,
    status: "offers",
    lastQuote: "V5 – 02/02/2025",
  },
  {
    id: "3",
    name: "16 - Parc éolien Cherves-Châtelars",
    code: "FR-PE-003",
    region: "France – Nouvelle-Aquitaine",
    power: "30 MW",
    turbines: 10,
    versions: 12,
    status: "built",
    lastQuote: "V12 – 11/09/2024",
  },
];

const projectVersions: ProjectVersion[] = [
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
  const [selectedProject, setSelectedProject] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVersionId, setSelectedVersionId] = useState(projectVersions[0]?.id);

  useEffect(() => {
    setSelectedVersionId(projectVersions[0]?.id);
  }, [selectedProject]);

  const handleViewQuotes = () => {
    const project = projects.find((p) => p.id === selectedProject);
    const version = projectVersions.find((v) => v.id === selectedVersionId);

    if (project && version && onOpenQuotes) {
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
          <CardTitle className="text-sm">Liste des projets</CardTitle>
          <CardDescription className="text-xs">
            Filtrable par pays, statut, puissance, développeur, etc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Rechercher par nom, code, région, développeur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[260px] h-9 text-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="study">En étude</SelectItem>
                <SelectItem value="offers">Offres en cours</SelectItem>
                <SelectItem value="built">Construit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                    Projet
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                    Code
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                    Pays / Région
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                    Puissance
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                    Éoliennes
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                    Versions
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                    Statut
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                    Dernier chiffrage
                  </th>
                  <th className="text-right py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className={cn(
                      "border-b hover:bg-muted/30 transition-colors",
                      selectedProject === project.id && "bg-accent-soft"
                    )}
                  >
                    <td className="py-3 px-2">{project.name}</td>
                    <td className="py-3 px-2">{project.code}</td>
                    <td className="py-3 px-2">{project.region}</td>
                    <td className="py-3 px-2">{project.power}</td>
                    <td className="py-3 px-2">{project.turbines}</td>
                    <td className="py-3 px-2">{project.versions}</td>
                    <td className="py-3 px-2">{getStatusBadge(project.status)}</td>
                    <td className="py-3 px-2">{project.lastQuote}</td>
                    <td className="py-3 px-2 text-right">
                      <Button
                        variant={selectedProject === project.id ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => setSelectedProject(project.id)}
                      >
                        {selectedProject === project.id ? "Sélectionné" : "Sélectionner"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-sm">Versions de chiffrage du projet sélectionné</CardTitle>
              <CardDescription className="text-xs">
                Chaque projet embarque ses propres versions (historiques, révisions, offres)
              </CardDescription>
            </div>
            <Button
              size="sm"
              className="h-8 text-[11px]"
              onClick={handleViewQuotes}
              disabled={!selectedVersionId || !onOpenQuotes}
            >
              Voir les chiffrages
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                    Version
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                    Date
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                    CAPEX
                  </th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground text-[11px] uppercase">
                    Commentaire
                  </th>
                </tr>
              </thead>
              <tbody>
                {projectVersions.map((version) => (
                  <tr
                    key={version.id}
                    className={cn(
                      "border-b hover:bg-muted/30 cursor-pointer transition-colors",
                      selectedVersionId === version.id && "bg-accent-soft"
                    )}
                    onClick={() => setSelectedVersionId(version.id)}
                  >
                    <td className="py-3 px-2 font-medium">{version.name}</td>
                    <td className="py-3 px-2">{version.date}</td>
                    <td className="py-3 px-2 font-medium">{version.capex}</td>
                    <td className="py-3 px-2 text-muted-foreground">{version.comment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
