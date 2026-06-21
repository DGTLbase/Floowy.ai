import { useNavigate, useLocation } from "react-router-dom";
import { Users, Wrench, UsersRound, LogOut, BarChart3, FileText, Mail, Video, Globe, ImageIcon, UserCircle, Briefcase, LayoutGrid, Building2 } from "lucide-react";
import logoImage from "@/assets/floowy-logo.png";
import { useTheme } from "next-themes";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setTheme('light');
    navigate("/admin/login");
  };

  const isActive = (url: string) => {
    if (url === "/admin/dashboard") {
      return location.pathname === "/admin/dashboard";
    }
    if (url.includes("tab=")) {
      const tab = url.split("tab=")[1];
      return location.pathname === "/admin" && location.search.includes(`tab=${tab}`);
    }
    return location.pathname === url;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Icon-only Sidebar */}
      <div className="w-16 h-screen bg-card border-r border-border flex flex-col items-center py-4 gap-6 fixed left-0 top-0">
        <img src={logoImage} alt="Logo" className="h-8 w-8 object-contain mb-4" />
        
        <button
          onClick={() => navigate("/admin/dashboard")}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isActive("/admin/dashboard")
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
            isActive("/admin?tab=users")
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
            isActive("/admin?tab=tools")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
          title="Tools"
        >
          <Wrench className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => navigate("/admin?tab=team")}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isActive("/admin?tab=team")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
          title="Team"
        >
          <UsersRound className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate("/admin/blog")}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isActive("/admin/blog")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
          title="Blog Posts"
        >
          <FileText className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate("/admin/cases")}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isActive("/admin/cases")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
          title="Cases"
        >
          <Briefcase className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate("/admin/industries")}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isActive("/admin/industries")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
          title="Industry Pages"
        >
          <Building2 className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate("/admin?tab=email")}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isActive("/admin?tab=email")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
          title="Email Users"
        >
          <Mail className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate("/admin?tab=kb-videos")}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isActive("/admin?tab=kb-videos")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
          title="KB Videos"
        >
          <Video className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate("/admin?tab=community")}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isActive("/admin?tab=community")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
          title="Community"
        >
          <Globe className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate("/admin?tab=gallery")}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isActive("/admin?tab=gallery")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
          title="Gallery"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate("/admin?tab=models")}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isActive("/admin?tab=models")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
          title="Models"
        >
          <UserCircle className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate("/admin?tab=flatlay-styles")}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isActive("/admin?tab=flatlay-styles")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
          title="Flatlay Styles"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>

        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-16">
        {children}
      </div>
    </div>
  );
}
