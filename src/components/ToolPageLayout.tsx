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

  // App-shell layout: the outer row is exactly viewport height and does not scroll,
  // so the sidebar stays pinned at full height. Only the tool pane scrolls.
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar className="!h-screen self-start shrink-0" />
      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden relative">{children}</div>
      {tourEl}
    </div>
  );
};

export default ToolPageLayout;