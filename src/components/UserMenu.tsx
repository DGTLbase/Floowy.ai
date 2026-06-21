import { LogOut, Settings, CreditCard, Coins, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserMenuProps {
  onAddCredits?: () => void;
}

const UserMenu = ({ onAddCredits }: UserMenuProps = {}) => {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const [userInitials, setUserInitials] = useState("U");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [currentPlan, setCurrentPlan] = useState("free");

  useEffect(() => {
    const fetchUserData = async (userId: string) => {
      // Fetch profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, plan, email, avatar_url")
        .eq("id", userId)
        .single();

      if (profile) {
        setUserEmail(profile.email || "");
        setUserName(profile.full_name || "");
        setCurrentPlan(profile.plan || "free");
        setAvatarUrl(profile.avatar_url || null);

        if (profile.full_name) {
          const names = profile.full_name.split(" ");
          const initials = names.length > 1 
            ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
            : names[0][0].toUpperCase();
          setUserInitials(initials);
        } else if (profile.email) {
          setUserInitials(profile.email[0].toUpperCase());
        }
      }

      // Fetch credits
      const { data: creditsData } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (creditsData) {
        setCredits(creditsData.balance);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setTimeout(() => {
          fetchUserData(session.user.id);
        }, 0);
      } else {
        // Reset state when logged out
        setUserInitials("U");
        setUserEmail("");
        setUserName("");
        setAvatarUrl(null);
        setCredits(0);
        setCurrentPlan("free");
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    localStorage.removeItem('admin_token');
    setTheme('light');
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none">
          <Avatar className="w-9 h-9 cursor-pointer hover:opacity-80 transition-opacity border-2 border-border">
            <AvatarImage src={avatarUrl || undefined} alt="Profile" />
            <AvatarFallback className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 text-white font-semibold text-sm">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card z-50">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col items-center space-y-3 py-3">
            <Avatar className="w-16 h-16 ring-2 ring-primary/20">
              <AvatarImage src={avatarUrl || undefined} alt="Profile" />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-white font-semibold text-lg">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center space-y-1">
              {userName && (
                <p className="text-sm font-semibold text-foreground">{userName}</p>
              )}
              <p className="text-xs text-muted-foreground">{userEmail}</p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-primary/10 to-primary-glow/10 rounded-full border border-primary/20">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Plan:
                </span>
                <span className="text-xs font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent uppercase">
                  {currentPlan}
                </span>
              </div>
            </div>
            
            {/* Credits Section - Mobile Only */}
            <div className="md:hidden w-full max-w-[240px] bg-gradient-to-br from-card to-muted/50 border border-border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center">
                    <Coins className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide leading-none">
                      Available
                    </span>
                    <span className="text-lg font-bold text-foreground mt-0.5">
                      {credits.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {onAddCredits && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddCredits();
                    }}
                    className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-glow hover:shadow-glow flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                    aria-label="Add credits"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/payment")} className="cursor-pointer">
          <CreditCard className="w-4 h-4 mr-2" />
          Subscription
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-green-600">
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
