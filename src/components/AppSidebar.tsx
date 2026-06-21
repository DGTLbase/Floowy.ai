import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "next-themes";
import {
  Wand2, Pencil, UserCircle, Clock, Users, BookOpen, Settings, CreditCard,
  ChevronLeft, ChevronRight, Sun, Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

const mainMenuItems = [
  { label: "Tools", icon: Wand2, path: "/home", highlight: true, tour: "tools" },
  { label: "Editor", icon: Pencil, path: "/editor", tour: "editor" },
  { label: "Models", icon: UserCircle, path: "/home?tab=custom-models", tour: "models" },
  { label: "My Generations", icon: Clock, path: "/my-generations", tour: "my-generations" },
  { label: "Community", icon: Users, path: "/community", tour: "community" },
  { label: "Knowledge Base", icon: BookOpen, path: "/knowledge-base-hub", tour: "knowledge-base" },
];

const bottomMenuItems = [
  { label: "Settings", icon: Settings, path: "/settings", tour: "settings" },
  { label: "Subscriptions", icon: CreditCard, path: "/subscriptions", tour: "subscriptions" },
];


interface AppSidebarProps {
  className?: string;
}

const AppSidebar = ({ className }: AppSidebarProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();
  const isTablet = useCallback(() => {
    const w = document.documentElement.clientWidth;
    return w >= 768 && w < 1200;
  }, []);

  const [collapsed, setCollapsed] = useState(() => isTablet());

  const [isTabletView, setIsTabletView] = useState(() => isTablet());

  // Watch for viewport changes via ResizeObserver (works reliably in iframes)
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      const tablet = isTablet();
      setIsTabletView(tablet);
      if (tablet) setCollapsed(true);
      else setCollapsed(false);
    });
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [isTablet]);


  const isActive = (path: string) => {
    if (path === "/home") {
      return location.pathname === "/home" && !location.search.includes("tab=");
    }
    if (path.includes("?")) {
      const [basePath, query] = path.split("?");
      return location.pathname === basePath && location.search.includes(query);
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const SidebarItem = ({ item, isSubItem = false }: { item: (typeof mainMenuItems)[0] & { tour?: string }; isSubItem?: boolean }) => {
    const active = isActive(item.path);
    const isHighlight = 'highlight' in item && (item as any).highlight;

    const content = (
      <Link
        to={item.path}
        data-walkthrough-target={item.tour}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          isSubItem && "pl-10 py-2",
          active && !isHighlight && "bg-primary/15 text-primary",
          active && isHighlight && "bg-primary/15 text-primary",
          !active && isHighlight && "text-primary hover:bg-primary/10",
          !active && !isHighlight && "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          collapsed && "justify-center px-2",
        )}
      >
        <item.icon className={cn(
          "shrink-0",
          isSubItem ? "w-3.5 h-3.5" : "w-5 h-5",
          (isHighlight || active) && "text-primary",
        )} />
        {!collapsed && (
          <span className="truncate">{item.label}</span>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  if (isMobile) return null;

  return (
    <aside
      className={cn(
        "sticky top-16 h-[calc(100vh-4rem)] border-r border-border/50 bg-card/30 backdrop-blur-sm flex flex-col transition-all duration-300 z-40 shrink-0",
        collapsed ? "w-16" : "w-60",
        className,
      )}
    >
      <ScrollArea className="flex-1 py-4">
        <div className="space-y-1 px-2">
          {mainMenuItems.map((item) => (
            <div key={item.label}>
              <SidebarItem item={item} />
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Bottom section */}
      <div className="border-t border-border/50 py-3 px-2 space-y-1">
        {bottomMenuItems.map((item) => (
          <SidebarItem key={item.label} item={item} />
        ))}

        {/* Dark mode toggle */}
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                data-walkthrough-target="theme-toggle"
                className="w-full flex items-center justify-center py-2.5 rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors mt-2"
                aria-label="Toggle dark mode"
              >
                {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              {theme === "dark" ? "Dark mode" : "Light mode"}
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center justify-between px-1 mt-2" data-walkthrough-target="theme-toggle">
            <span className="text-sm font-medium text-muted-foreground pl-2">{theme === "dark" ? "Dark mode" : "Light mode"}</span>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn(
                "relative inline-flex h-9 w-[4.5rem] items-center rounded-full transition-colors duration-300 focus:outline-none",
                theme === "dark" ? "bg-foreground/20" : "bg-muted-foreground/20"
              )}
              aria-label="Toggle dark mode"
            >
              <span className="absolute left-2 flex items-center justify-center">
                <Sun className={cn("w-4.5 h-4.5 transition-opacity", theme === "dark" ? "opacity-40 text-muted-foreground" : "opacity-0")} />
              </span>
              <span className="absolute right-2 flex items-center justify-center">
                <Moon className={cn("w-4.5 h-4.5 transition-opacity", theme === "dark" ? "opacity-0" : "opacity-40 text-muted-foreground")} />
              </span>
              <span
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full bg-background shadow-sm transition-transform duration-300",
                  theme === "dark" ? "translate-x-10" : "translate-x-1"
                )}
              >
                {theme === "dark" ? (
                  <Moon className="w-4 h-4 text-foreground" />
                ) : (
                  <Sun className="w-4 h-4 text-foreground" />
                )}
              </span>
            </button>
          </div>
        )}

        {/* Collapse toggle – hidden on tablet where sidebar is always collapsed */}
        {!isTabletView && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full flex items-center gap-2 text-muted-foreground hover:text-foreground mt-2",
              collapsed && "justify-center"
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </Button>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
