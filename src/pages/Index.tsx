import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { ProjectsView } from "@/components/ProjectsView";
import { QuotesView } from "@/components/QuotesView";
import { PricingView } from "@/components/PricingView";
import { PriceDBView } from "@/components/PriceDBView";
import { TemplatesView } from "@/components/TemplatesView";
import { DataAdminView } from "@/components/DataAdminView";
import { SummaryView } from "@/components/SummaryView";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("projects");
  const [quotesEnabled, setQuotesEnabled] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null);
  const [selectedQuoteVersion, setSelectedQuoteVersion] = useState<string | null>(null);
  const [selectedVersionLabel, setSelectedVersionLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleViewChange = (view: string) => {
    if (view === "quotes" && !quotesEnabled) return;
    setActiveView(view);
  };

  const handleOpenPricing = (
    projectId: string,
    projectName: string,
    versionId: string,
    versionLabel?: string
  ) => {
    setSelectedProjectId(projectId);
    setSelectedProjectName(projectName);
    setSelectedQuoteVersion(versionId);
    setSelectedVersionLabel(versionLabel || null);
    setActiveView("pricing");
  };

  const renderView = () => {
    switch (activeView) {
      case "projects":
        return <ProjectsView onOpenPricing={handleOpenPricing} />;
      case "quotes":
        return (
          <QuotesView
            projectId={selectedProjectId || undefined}
            projectName={selectedProjectName || undefined}
            initialSelectedVersionId={selectedQuoteVersion || undefined}
            onVersionChange={setSelectedQuoteVersion}
          />
        );
      case "pricing":
        return (
          <PricingView
            projectId={selectedProjectId}
            projectName={selectedProjectName}
            versionId={selectedQuoteVersion}
          />
        );
      case "summary":
        return (
          <SummaryView
            projectId={selectedProjectId}
            projectName={selectedProjectName}
            versionId={selectedQuoteVersion}
          />
        );
      case "price-db":
        return <PriceDBView />;
      case "templates":
        return <TemplatesView />;
      case "data-admin":
        return <DataAdminView />;
      default:
        return <ProjectsView />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        quotesEnabled={quotesEnabled}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          projectName={selectedProjectName}
          projectCode={selectedProjectId}
          versionLabel={selectedVersionLabel}
          currentView={activeView}
        />
        <main className="flex-1 overflow-y-auto">{renderView()}</main>
      </div>
    </div>
  );
};

export default Index;
