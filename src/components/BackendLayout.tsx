import { Link, useLocation } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import PlanCreditsDisplay from "@/components/PlanCreditsDisplay";
import CreditsPurchaseDialog from "@/components/CreditsPurchaseDialog";
import UserMenu from "@/components/UserMenu";
import logoImage from "@/assets/floowy-logo.png";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Menu, Wand2, Pencil, UserCircle, Clock, Users, BookOpen, Settings, CreditCard, Sun, Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const mobileMenuItems = [
  { label: "Tools", icon: Wand2, path: "/home", highlight: true },
  { label: "Editor", icon: Pencil, path: "/editor" },
  { label: "Models", icon: UserCircle, path: "/home?tab=custom-models" },
  { label: "My Generations", icon: Clock, path: "/my-generations" },
  { label: "Community", icon: Users, path: "/community" },
  { label: "Knowledge Base", icon: BookOpen, path: "/knowledge-base-hub" },
  { label: "Settings", icon: Settings, path: "/settings" },
  { label: "Subscriptions", icon: CreditCard, path: "/subscriptions" },
];

interface BackendLayoutProps {
  children: React.ReactNode;
}

const BackendLayout = ({ children }: BackendLayoutProps) => {
  const [credits, setCredits] = useState(0);
  const [userPlan, setUserPlan] = useState("free");
  const [creditsPurchaseOpen, setCreditsPurchaseOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/home") return location.pathname === "/home" && !location.search.includes("tab=");
    if (path.includes("?")) {
      const [basePath, query] = path.split("?");
      return location.pathname === basePath && location.search.includes(query);
    }
    return location.pathname === path;
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const userId = session.user.id;

      const { data: creditsData } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", userId)
        .single();
      if (creditsData) setCredits(creditsData.balance);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", userId)
        .single();
      if (profileData) setUserPlan(profileData.plan);
    };

    fetchData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) fetchData();
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0 -ml-1">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 bg-card">
                  <div className="p-4 border-b border-border/50">
                    <Link to="/home" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                      <img src={logoImage} alt="Floowy.ai" className="h-7 w-auto" />
                      <span className="font-bold text-lg text-foreground">Floowy.ai</span>
                    </Link>
                  </div>
                  <nav className="p-3 space-y-1">
                    {mobileMenuItems.map((item) => {
                      const active = isActive(item.path);
                      const isHighlight = item.highlight;
                      return (
                        <Link
                          key={item.label}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                            active && isHighlight && "bg-primary/15 text-primary",
                            active && !isHighlight && "bg-primary/15 text-primary",
                            !active && isHighlight && "text-primary hover:bg-primary/10",
                            !active && !isHighlight && "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                          )}
                        >
                          <item.icon className={cn("w-5 h-5 shrink-0", isHighlight && "text-primary")} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                    {/* Theme toggle */}
                    <div className="border-t border-border/50 mt-2 pt-3 px-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">{theme === "dark" ? "Dark mode" : "Light mode"}</span>
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
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            )}
            <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src={logoImage} alt="Floowy.ai" className="h-8 w-auto" />
              <span className="font-bold text-xl text-foreground">Floowy.ai</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <PlanCreditsDisplay
              plan={userPlan}
              credits={credits}
              onAddCredits={() => setCreditsPurchaseOpen(true)}
            />
            <UserMenu onAddCredits={() => setCreditsPurchaseOpen(true)} />
          </div>
        </div>
      </nav>

      {/* Main area with sidebar */}
      <div className="flex flex-1">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>

      <CreditsPurchaseDialog
        open={creditsPurchaseOpen}
        onOpenChange={setCreditsPurchaseOpen}
      />
    </div>
  );
};

export default BackendLayout;
