import AppSidebar from "@/components/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFromAdmin } from "@/hooks/useFromAdmin";
import { useLocation } from "react-router-dom";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";
import { TOOL_TOURS } from "@/config/toolTours";
import ToolWalkthroughTour from "@/components/ToolWalkthroughTour";
import { LoadingState } from "@/components/LoadingState";
import { routeMinTier } from "@/lib/tools-registry";

interface ToolPageLayoutProps {
  children: React.ReactNode;
}

const ToolPageLayout = ({ children }: ToolPageLayoutProps) => {
  const isMobile = useIsMobile();
  const fromAdmin = useFromAdmin();
  const location = useLocation();

  // Subscription + tier gate: the solution tools require a paid plan or an active
  // €1 trial, and tier-gated tools additionally require a minimum tier (a Lite
  // user opening a Starter tool by URL is bounced to /payment). Admins (and
  // admin-preview via ?fromAdmin) bypass. We render a loader while checking so the
  // tool UI never flashes before a redirect.
  const access = useSubscriptionGate({
    bypass: fromAdmin,
    requiredTier: routeMinTier(location.pathname),
  });

  // Per-tool first-time walkthrough (independent per tool).
  const tour = Object.values(TOOL_TOURS).find((t) => t.route === location.pathname);
  const tourEl =
    tour && !fromAdmin ? (
      <ToolWalkthroughTour toolKey={tour.toolKey} route={tour.route} steps={tour.steps} />
    ) : null;

  if (access === "checking") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingState context="data" message="Loading your tools..." />
      </div>
    );
  }

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
