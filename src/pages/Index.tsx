import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { ProjectsView } from "@/components/ProjectsView";
import { QuotesView } from "@/components/QuotesView";
import { PricingView } from "@/components/PricingView";
import { PriceDBView } from "@/components/PriceDBView";
import { TemplatesView } from "@/components/TemplatesView";

const Index = () => {
  const [activeView, setActiveView] = useState("projects");
  const [quotesEnabled, setQuotesEnabled] = useState(false);
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null);
  const [selectedQuoteVersion, setSelectedQuoteVersion] = useState<string | null>(null);

  const handleViewChange = (view: string) => {
    if (view === "quotes" && !quotesEnabled) return;
    setActiveView(view);
  };

  const handleOpenQuotes = (
    _projectId: string,
    projectName: string,
    versionId: string
  ) => {
    setSelectedProjectName(projectName);
    setSelectedQuoteVersion(versionId);
    setQuotesEnabled(true);
    setActiveView("quotes");
  };

  const renderView = () => {
    switch (activeView) {
      case "projects":
        return <ProjectsView onOpenQuotes={handleOpenQuotes} />;
      case "quotes":
        return (
          <QuotesView
            projectName={selectedProjectName || undefined}
            initialSelectedVersionId={selectedQuoteVersion || undefined}
            onVersionChange={setSelectedQuoteVersion}
          />
        );
      case "pricing":
        return <PricingView />;
      case "price-db":
        return <PriceDBView />;
      case "templates":
        return <TemplatesView />;
      default:
        return <ProjectsView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        quotesEnabled={quotesEnabled}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar projectName="41 - Parc éolien La Besse" projectCode="FR-PE-001" />
        <main className="flex-1 overflow-auto">{renderView()}</main>
      </div>
    </div>
  );
};

export default Index;
