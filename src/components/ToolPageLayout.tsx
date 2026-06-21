import AppSidebar from "@/components/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFromAdmin } from "@/hooks/useFromAdmin";
import { useLocation } from "react-router-dom";
import { TOOL_TOURS } from "@/config/toolTours";
import ToolWalkthroughTour from "@/components/ToolWalkthroughTour";

interface ToolPageLayoutProps {
  children: React.ReactNode;
}

const ToolPageLayout = ({ children }: ToolPageLayoutProps) => {
  const isMobile = useIsMobile();
  const fromAdmin = useFromAdmin();
  const location = useLocation();

  // Per-tool first-time walkthrough (independent per tool).
  const tour = Object.values(TOOL_TOURS).find((t) => t.route === location.pathname);
  const tourEl =
    tour && !fromAdmin ? (
      <ToolWalkthroughTour toolKey={tour.toolKey} route={tour.route} steps={tour.steps} />
    ) : null;

  if (fromAdmin || isMobile) {
    return (
      <>
        {children}
        {tourEl}
      </>
    );
  }

  return (
    <div className="flex min-h-screen items-start">
      <AppSidebar className="!sticky !top-0 !h-screen self-start" />
      <div className="flex-1 min-w-0 overflow-x-hidden relative">{children}</div>
      {tourEl}
    </div>
  );
};

export default ToolPageLayout;