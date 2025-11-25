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
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("projects");
  const [quotesEnabled, setQuotesEnabled] = useState(false);
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null);
  const [selectedQuoteVersion, setSelectedQuoteVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      case "data-admin":
        return <DataAdminView />;
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
