import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { useTheme } from "next-themes";
import adminHero from "@/assets/admin-hero.jpg";
import logoImage from "@/assets/floowy-logo.png";

const emailSchema = z.string().trim().email("Invalid email address");
const passwordSchema = z.string().min(1, "Password is required");

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setTheme } = useTheme();

  // Force light mode on admin login page
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  useEffect(() => {
    // Check if already logged in as admin
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      verifyAdminSession(adminToken);
    } else {
      setVerifying(false);
    }
  }, []);

  const verifyAdminSession = async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'verify', token },
      });

      if (error || !data || data.error) {
        localStorage.removeItem('admin_token');
        return;
      }

      // Valid session - redirect to admin
      navigate('/admin');
    } catch (error) {
      // Silently handle all errors during session verification
      localStorage.removeItem('admin_token');
    } finally {
      setVerifying(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate inputs
      emailSchema.parse(email);
      passwordSchema.parse(password);

      setLoading(true);

      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: {
          action: 'login',
          email: email.trim(),
          password,
        },
      });

      if (error || !data || data.error) {
        // supabase-js hides the response body of a non-2xx in error.context —
        // surface the function's actual error message instead of the generic
        // "Edge Function returned a non-2xx status code".
        let detail = data?.error || null;
        if (!detail && error && (error as any).context) {
          try {
            const body = await (error as any).context.json();
            detail = body?.error || body?.message || null;
          } catch { /* body not JSON */ }
        }
        throw new Error(detail || error?.message || 'Login failed');
      }

      // Store token
      localStorage.setItem('admin_token', data.token);

      toast({
        title: "Success",
        description: "Logged in successfully",
      });

      navigate('/admin');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to login",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Promotional content */}
      <div className="hidden lg:flex lg:w-1/2 bg-muted/30 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary-glow/5" />
        <div className="relative z-10 max-w-lg space-y-6">
          <h1 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight">
            Manage Your AI-Powered Content Generation Platform
          </h1>
          <p className="text-lg text-muted-foreground">
            Access admin controls for user management, credits allocation, and system monitoring.
          </p>
          <img 
            src={adminHero} 
            alt="Admin Dashboard" 
            className="rounded-2xl shadow-elegant w-full object-cover"
          />
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img src={logoImage} alt="Floowy.ai" className="h-10 w-auto" />
            <span className="font-bold text-2xl text-foreground">Floowy.ai</span>
          </Link>

          {/* Login heading */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Login</h2>
            <p className="text-sm text-muted-foreground">
              Login to your account
            </p>
            <p className="text-xs text-muted-foreground">
              Please enter your email and password to access the admin dashboard
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Username / Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@floowy.ai"
                  required
                  disabled={loading}
                  className="h-11 bg-background border-input"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <button 
                    type="button"
                    className="text-xs text-primary hover:underline"
                  >
                    Reset Password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className="h-11 bg-background border-input"
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="remember"
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                />
                <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                  Remember Me
                </Label>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "SIGN IN"
              )}
            </Button>
          </form>

          {/* Footer link */}
          <p className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link 
              to="/auth" 
              className="text-primary font-medium hover:underline"
            >
              Join Gravia Now!
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
