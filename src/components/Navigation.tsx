import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Menu, ChevronRight, Plus, ChevronDown, Sparkles, Image, Video, Wand2, ShoppingBag, Layers, Megaphone, Film } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import logoImage from "@/assets/floowy-logo.png";
import { supabase } from "@/integrations/supabase/client";
import UserMenu from "./UserMenu";
import PlanCreditsDisplay from "./PlanCreditsDisplay";
import CreditsPurchaseDialog from "./CreditsPurchaseDialog";

const tools = [
  { name: "Ads Studio", path: "/ads-studio", icon: Megaphone, description: "Ad creative generation" },
  { name: "Ambience Studio", path: "/ambience-studio", icon: Image, description: "Lifestyle backgrounds" },
  { name: "Creator Studio", path: "/creator-studio", icon: Video, description: "UGC content creation" },
  { name: "Fashion Studio", path: "/fashion-studio", icon: Sparkles, description: "AI model photography" },
  { name: "Fashion Studio Pro", path: "/fashion-studio-pro", icon: Sparkles, description: "AI outfit mockups" },
  { name: "Flat Lay Studio", path: "/flatlay-studio", icon: Layers, description: "AI flat lay photography" },
  { name: "Idea Studio", path: "/idea-studio", icon: Wand2, description: "Product visualization" },
  { name: "Listing Studio", path: "/listing-studio", icon: ShoppingBag, description: "Marketplace listing images" },
  { name: "Virtual Video Studio", path: "/virtual-video-studio", icon: Film, description: "Cinematic video creation" },
];

const Navigation = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [plan, setPlan] = useState("free");
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setCredits(0);
        setPlan("free");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    const { data: creditsData } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', userId)
      .single();
    
    if (creditsData) {
      setCredits(creditsData.balance);
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single();
    
    if (profileData) {
      setPlan(profileData.plan);
    }
  };
  
  const isActive = (path: string) => {
    if (path.startsWith("/#")) {
      return location.pathname === "/" && location.hash === path.substring(1);
    }
    return location.pathname === path;
  };
  
  const getLinkClasses = (path: string) => {
    return isActive(path)
      ? "text-sm font-medium text-primary relative after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-[2px] after:bg-primary after:rounded-full"
      : "text-sm font-medium text-foreground hover:text-primary transition-colors";
  };
  
  const getMobileLinkClasses = (path: string) => {
    return isActive(path)
      ? "text-lg font-medium text-primary"
      : "text-lg font-medium text-foreground hover:text-primary transition-colors text-left";
  };

  return (
    <>
      <nav className="bg-background/80 backdrop-blur-sm sticky top-10 z-40 py-4">
        <div className="container mx-auto px-4">
          <div className="bg-card/90 backdrop-blur-md rounded-full shadow-lg border border-border/50 px-4 lg:px-6 py-3 flex items-center justify-between max-w-6xl mx-auto">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
              <img src={logoImage} alt="Floowy.ai" className="h-7 w-auto" />
              <span className="font-bold text-lg text-foreground">Floowy.ai</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-2 lg:gap-4 xl:gap-5 flex-shrink min-w-0">
              <div className="relative group">
                <Link to="/solutions" className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1 outline-none whitespace-nowrap">
                  Solutions
                  <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                </Link>
                <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="w-64 bg-popover border border-border shadow-lg rounded-md p-1 animate-fade-in">
                    {tools.map((tool) => (
                      <Link 
                        key={tool.path} 
                        to={tool.path} 
                        className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-accent transition-colors"
                      >
                        <tool.icon className="w-4 h-4 text-primary" />
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{tool.name}</span>
                          <span className="text-xs text-muted-foreground">{tool.description}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <Link to="/cases" className={`${getLinkClasses("/cases")} whitespace-nowrap`}>
                Cases
              </Link>
              {isLandingPage ? (
                <Link to="/#pricing" className={`${getLinkClasses("/#pricing")} whitespace-nowrap`}>
                  Pricing
                </Link>
              ) : (
                <Link to="/pricing" className={`${getLinkClasses("/pricing")} whitespace-nowrap`}>
                  Pricing
                </Link>
              )}
              <Link to="/industries" className={`${getLinkClasses("/industries")} whitespace-nowrap`}>
                Industries
              </Link>
              <Link to="/our-story" className={`${getLinkClasses("/our-story")} whitespace-nowrap`}>
                Our story
              </Link>
              <Link to="/contact" className={`${getLinkClasses("/contact")} whitespace-nowrap`}>
                Contact
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="hidden md:block">
                    <PlanCreditsDisplay 
                      plan={plan} 
                      credits={credits} 
                      onAddCredits={() => setShowCreditsDialog(true)} 
                    />
                  </div>
                  <div className="hidden md:block">
                    <UserMenu onAddCredits={() => setShowCreditsDialog(true)} />
                  </div>
                </>
              ) : (
                <>
                  <Link to="/auth" className="hidden md:block text-sm font-medium text-foreground hover:text-primary transition-colors">
                    Login
                  </Link>
                  <Link to="/auth?mode=signup" className="hidden md:block">
                    <Button className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full h-9 px-5">
                      Start for €1
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </>
              )}
              
              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={(open) => { setToolsOpen(false); setMobileMenuOpen(open); }}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={() => { setToolsOpen(false); }}>
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="flex flex-col">
                  <div className="flex flex-col gap-6 mt-8 flex-1">
                    <div className="space-y-2">
                      <button
                        onClick={() => setToolsOpen(!toolsOpen)}
                        className="flex items-center justify-between w-full text-lg font-medium text-foreground hover:text-primary transition-colors"
                      >
                        Solutions
                        <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {toolsOpen && (
                        <div className="pl-4 space-y-1">
                          {tools.map((tool) => (
                            <Link 
                              key={tool.path} 
                              to={tool.path} 
                              className="flex items-center gap-3 py-2.5 text-muted-foreground hover:text-primary transition-colors"
                            >
                              <tool.icon className="w-4 h-4" />
                              <div className="flex flex-col">
                                <span className="text-base">{tool.name}</span>
                                <span className="text-xs text-muted-foreground">{tool.description}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                    <Link to="/cases" className={getMobileLinkClasses("/cases")}>
                      Cases
                    </Link>
                    {isLandingPage ? (
                      <Link to="/#pricing" className={getMobileLinkClasses("/#pricing")}>
                        Pricing
                      </Link>
                    ) : (
                      <Link to="/pricing" className={getMobileLinkClasses("/pricing")}>
                        Pricing
                      </Link>
                    )}
                    <Link to="/industries" className={getMobileLinkClasses("/industries")}>
                      Industries
                    </Link>
                    <Link to="/our-story" className={getMobileLinkClasses("/our-story")}>
                      Our story
                    </Link>
                    <Link to="/contact" className={getMobileLinkClasses("/contact")}>
                      Contact
                    </Link>
                    {!user && (
                      <>
                        <Link to="/auth" className="text-lg font-medium text-foreground hover:text-primary transition-colors text-left">
                          Login
                        </Link>
                        <Link to="/auth?mode=signup" className="w-full">
                          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full w-full">
                            Start for €1
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                  
                  {/* Mobile User Section at Bottom */}
                  {user && (
                    <div className="border-t border-border pt-4 pb-6 space-y-4">
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary-glow rounded-lg opacity-20 blur-sm"></div>
                        <div className="relative bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                                Plan
                              </span>
                              <span className="text-sm font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent uppercase">
                                {plan}
                              </span>
                            </div>
                            <div className="w-px h-8 bg-border"></div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                                Credits
                              </span>
                              <span className="text-sm font-bold text-foreground">
                                {credits.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowCreditsDialog(true)}
                            className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                      
                      <UserMenu onAddCredits={() => setShowCreditsDialog(true)} />
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      <CreditsPurchaseDialog
        open={showCreditsDialog} 
        onOpenChange={setShowCreditsDialog} 
      />
    </>
  );
};

export default Navigation;
