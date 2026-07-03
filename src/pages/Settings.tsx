import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, User, Mail, Lock, Shield, Camera, PlayCircle } from "lucide-react";
import { useWalkthrough } from "@/hooks/useWalkthrough";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import BackendLayout from "@/components/BackendLayout";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ApiKeysSection from "@/components/ApiKeysSection";

const nameSchema = z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters");
const emailSchema = z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(128, "Password must be less than 128 characters");

const Settings = () => {
  const [user, setUser] = useState<any>(null);
  const { restart: restartWalkthrough } = useWalkthrough();
  const [session, setSession] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        setTimeout(() => fetchProfile(), 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, plan, avatar_url")
      .eq("id", user?.id)
      .single();

    if (data) {
      setFullName(data.full_name || "");
      setEmail(data.email || "");
      setPlan(data.plan || "free");
      setAvatarUrl(data.avatar_url || null);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 5MB", variant: "destructive" });
      return;
    }
    try {
      setUploadingAvatar(true);
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("user-uploads").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("user-uploads").getPublicUrl(path);
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: urlWithCacheBust }).eq("id", user.id);
      setAvatarUrl(urlWithCacheBust);
      toast({ title: "Success", description: "Profile photo updated" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to upload photo", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveAll = async () => {
    try {
      setLoading(true);

      // Update profile name
      nameSchema.parse(fullName);
      const { error: profileError } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user?.id);
      if (profileError) throw profileError;

      // Update email if changed
      const currentEmail = user?.email || "";
      if (email !== currentEmail) {
        emailSchema.parse(email);
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
      }

      // Update password if provided
      if (newPassword) {
        passwordSchema.parse(newPassword);
        if (newPassword !== confirmPassword) {
          toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
          setLoading(false);
          return;
        }
        const { error: passError } = await supabase.auth.updateUser({ password: newPassword });
        if (passError) throw passError;
        setNewPassword("");
        setConfirmPassword("");
      }

      toast({ title: "Success", description: "Settings saved successfully" });
    } catch (error: any) {
      toast({
        title: error instanceof z.ZodError ? "Validation Error" : "Error",
        description: error instanceof z.ZodError ? error.errors[0].message : error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackendLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Account Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your personal information and security</p>
          </div>
          <Badge variant="outline" className="capitalize text-sm px-3 py-1">{plan}</Badge>
        </div>

        {/* Avatar Upload */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Avatar className="w-24 h-24 border-2 border-border dark:border-4 dark:border-primary dark:shadow-[0_0_15px_hsl(142,71%,65%,0.3)]">
              <AvatarImage src={avatarUrl || undefined} alt="Profile" />
              <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
                {fullName ? fullName.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <p className="text-xs text-muted-foreground">Click to upload profile photo</p>
        </div>

        <Separator />

        {/* Profile & Contact Fields */}
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                maxLength={100}
                className="bg-background border-border/60 h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                maxLength={255}
                className="bg-background border-border/60 h-10"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Password Section */}
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Change Password</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                maxLength={128}
                className="bg-background border-border/60 h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                maxLength={128}
                className="bg-background border-border/60 h-10"
              />
            </div>
          </div>
        </div>

        <Separator />

        <Button onClick={handleSaveAll} disabled={loading} className="px-6">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>

        <Separator />

        {/* Walkthrough Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Product Walkthrough</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Replay the guided tour on Ambience Studio to revisit how Floowy works.
          </p>
          <Button
            variant="outline"
            onClick={async () => {
              await restartWalkthrough();
              navigate("/home");
            }}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Restart walkthrough
          </Button>
        </div>

        <Separator />

        {/* API Access Section */}
        <ApiKeysSection plan={plan} />
      </div>
    </BackendLayout>
  );
};

export default Settings;
