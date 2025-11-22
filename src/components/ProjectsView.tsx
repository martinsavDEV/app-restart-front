import { useState } from "react";
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

const projects: Project[] = [
  {
    id: "1",
    name: "Parc éolien La Besse",
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
    name: "Parc éolien Épine-aux-Bois",
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
    name: "Parc éolien Cherves-Châtelars",
    code: "FR-PE-003",
    region: "France – Nouvelle-Aquitaine",
    power: "30 MW",
    turbines: 10,
    versions: 12,
    status: "built",
    lastQuote: "V12 – 11/09/2024",
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

export const ProjectsView = () => {
  const [selectedProject, setSelectedProject] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
          <CardTitle className="text-sm">Versions de chiffrage du projet sélectionné</CardTitle>
          <CardDescription className="text-xs">
            Chaque projet embarque ses propres versions (historiques, révisions, offres)
          </CardDescription>
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
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-3 px-2">V3 – Révision accès</td>
                  <td className="py-3 px-2">14/03/2025</td>
                  <td className="py-3 px-2 font-medium">18,35 M€</td>
                  <td className="py-3 px-2 text-muted-foreground">Étude d'accès mise à jour</td>
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-3 px-2">V2 – Offre turbinier</td>
                  <td className="py-3 px-2">02/02/2025</td>
                  <td className="py-3 px-2 font-medium">18,10 M€</td>
                  <td className="py-3 px-2 text-muted-foreground">Intègre la dernière offre fournisseur</td>
                </tr>
                <tr className="border-b hover:bg-muted/30">
                  <td className="py-3 px-2">V1 – Études préliminaires</td>
                  <td className="py-3 px-2">15/11/2024</td>
                  <td className="py-3 px-2 font-medium">17,60 M€</td>
                  <td className="py-3 px-2 text-muted-foreground">Hypothèses de base</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
