import { useNavigate, useLocation } from "react-router-dom";
import { Users, Settings, Shield, LogOut, Wand2, BarChart3, Mail, FileText, Briefcase } from "lucide-react";
import logoImage from "@/assets/floowy-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";

export function AdminToolsSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { setTheme } = useTheme();

  const handleSignOut = async () => {
    setTheme('light');
    await supabase.auth.signOut();
    navigate("/");
  };

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path);

  return (
    <div className="w-16 h-screen bg-card border-r border-border flex flex-col items-center py-4 gap-6 fixed left-0 top-0">
      <button
        onClick={() => navigate("/home")}
        className="mb-4"
        title="Home"
      >
        <img src={logoImage} alt="Logo" className="h-8 w-8 object-contain" />
      </button>
      
      {/* Admin Navigation */}
      <button
        onClick={() => navigate("/admin/dashboard")}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
          currentPath === "/admin/dashboard"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
        title="Dashboard"
      >
        <BarChart3 className="w-5 h-5" />
      </button>
      
      <button
        onClick={() => navigate("/admin?tab=users")}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
          currentPath === "/admin" && !location.search.includes("tab=tools") && !location.search.includes("tab=team")
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
        title="Users"
      >
        <Users className="w-5 h-5" />
      </button>
      
      <button
        onClick={() => navigate("/admin?tab=tools")}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
          currentPath === "/admin" && location.search.includes("tab=tools")
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
        title="Tools Management"
      >
        <Wand2 className="w-5 h-5" />
      </button>
      
      <button
        onClick={() => navigate("/admin?tab=team")}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
          currentPath === "/admin" && location.search.includes("tab=team")
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
        title="Team"
      >
        <Shield className="w-5 h-5" />
      </button>

      <button
        onClick={() => navigate("/admin?tab=email")}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
          currentPath === "/admin" && location.search.includes("tab=email")
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
        title="Email Users"
      >
        <Mail className="w-5 h-5" />
      </button>

      <button
        onClick={() => navigate("/admin/blog")}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
          currentPath.startsWith("/admin/blog")
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
        title="Blog"
      >
        <FileText className="w-5 h-5" />
      </button>

      <button
        onClick={() => navigate("/admin/cases")}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
          currentPath.startsWith("/admin/cases")
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        }`}
        title="Cases"
      >
        <Briefcase className="w-5 h-5" />
      </button>

      {/* Bottom Actions */}
      <div className="mt-auto flex flex-col gap-4">
        <button
          onClick={() => navigate("/settings")}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        <button
          onClick={handleSignOut}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
