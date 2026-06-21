import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sparkles, Loader2, Upload, Wand2, Image as ImageIcon, Download, Pencil, Lock, RotateCcw, X, User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import UploadArea from "@/components/UploadArea";
import ImageEditModal from "@/components/ImageEditModal";
import GenerationProgressOverlay from "@/components/GenerationProgressOverlay";
import PlanCreditsDisplay from "@/components/PlanCreditsDisplay";
import UserMenu from "@/components/UserMenu";
import { UnlockDialog } from "@/components/UnlockDialog";
import ModelSelector from "@/components/ModelSelector";
import { useImageGating } from "@/hooks/useImageGating";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAdminToken } from "@/hooks/useAdminToken";
import { useOnboardingCheck } from "@/hooks/useOnboardingCheck";
import { checkAndSendOutOfCreditsEmail, deductCredits } from "@/hooks/useCreditDeduction";

import logoImage from "@/assets/floowy-logo.png";

// ----- Constants -----

const ASPECT_RATIOS = [
  "21:9", "16:9", "3:2", "4:3", "5:4",
  "1:1", "4:5", "3:4", "2:3", "9:16",
];

const RESOLUTIONS: { value: "1K" | "2K" | "4K"; label: string; credits: number }[] = [
  { value: "1K", label: "1K", credits: 2 },
  { value: "2K", label: "2K", credits: 3 },
  { value: "4K", label: "4K", credits: 4 },
];

const PLATFORMS = ["Amazon", "bol.com", "eBay", "Shopify", "Zalando", "Etsy"];

const LANGUAGES = [
  { value: "English", label: "🇬🇧 English (UK)" },
  { value: "American English", label: "🇺🇸 English (US)" },
  { value: "Dutch", label: "🇳🇱 Dutch" },
  { value: "Spanish", label: "🇪🇸 Spanish" },
  { value: "German", label: "🇩🇪 German" },
  { value: "French", label: "🇫🇷 French" },
  { value: "Italian", label: "🇮🇹 Italian" },
  { value: "Arabic", label: "🇸🇦 Arabic" },
  { value: "Chinese", label: "🇨🇳 Chinese" },
  { value: "Portuguese", label: "🇵🇹 Portuguese" },
];

type DisplayMode = "product_only" | "hand_only" | "with_model";
type Template = "usp" | "steps" | "describe";
type LogoPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const ListingStudioGenerator = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminCheck();
  const hasAdminToken = useAdminToken();
  useOnboardingCheck();

  // user / credits
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [userPlan, setUserPlan] = useState("free");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  // step 1 — product
  const [productFile, setProductFile] = useState<File | null>(null);
  const [productUrl, setProductUrl] = useState<string | null>(null);

  // step 2 — size & resolution
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState<"1K" | "2K" | "4K">("1K");

  // step 3 — background
  const [useCustomBackground, setUseCustomBackground] = useState(false);
  const [backgroundPrompt, setBackgroundPrompt] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#1a1a2e");

  // step 4 — model
  const [displayMode, setDisplayMode] = useState<DisplayMode>("product_only");
  const [modelDescription, setModelDescription] = useState("");
  const [selectedModelUrl, setSelectedModelUrl] = useState<string | null>(null);
  const [customModelFile, setCustomModelFile] = useState<File | null>(null);
  const [modelSource, setModelSource] = useState<"floowy" | "auto">("floowy");
  const [autoGender, setAutoGender] = useState<"female" | "male">("female");

  // step 5 — brand colors
  const [usePrimaryBrand, setUsePrimaryBrand] = useState(false);
  const [primaryBrand, setPrimaryBrand] = useState("#F8F8F8");
  const [useSecondaryBrand, setUseSecondaryBrand] = useState(false);
  const [secondaryBrand, setSecondaryBrand] = useState("#001F5B");

  // step 6 — logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>("bottom-center");
  const [logoSize, setLogoSize] = useState(60);

  // step 7 — language
  const [language, setLanguage] = useState("English");

  // step 8 — template + platform
  const [template, setTemplate] = useState<Template>("usp");
  const [platform, setPlatform] = useState("Amazon");
  const [userFreeDescription, setUserFreeDescription] = useState("");
  const [describeHeadline, setDescribeHeadline] = useState("");
  const [describeSub, setDescribeSub] = useState("");
  const [describeHeadlineFont, setDescribeHeadlineFont] = useState("modern sans-serif");
  const [describeFeatures, setDescribeFeatures] = useState<{ icon: string; text: string }[]>([
    { icon: "✓", text: "" },
    { icon: "✓", text: "" },
    { icon: "✓", text: "" },
  ]);

  // generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStage, setGenStage] = useState<string>("uploading");
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const creditCost = RESOLUTIONS.find((r) => r.value === resolution)?.credits ?? 2;

  const generatedImageUrl = generatedImageUrls[activeImageIndex] || null;
  const { canExport, displayUrl, gate, unlockOpen, setUnlockOpen } = useImageGating({
    isAdmin: isAdmin || hasAdminToken,
    urls: generatedImageUrls,
  });

  // ----- Auth + credits -----
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) { setUser(session.user); fetchCredits(session.user.id); }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); fetchCredits(session.user.id); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchCredits = async (userId: string) => {
    const { data } = await supabase.from("credits").select("balance").eq("user_id", userId).single();
    setCredits(data?.balance || 0);
    const { data: profile } = await supabase
      .from("profiles").select("email, full_name, plan").eq("id", userId).single();
    if (profile) {
      setUserEmail(profile.email || "");
      setUserName(profile.full_name || "");
      setUserPlan(profile.plan || "free");
    }
  };

  const handleProductSelect = async (file: File) => {
    setProductFile(file);
    setProductUrl(URL.createObjectURL(file));
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setLogoFile(f);
  };

  const canGenerate =
    !!productUrl &&
    (template !== "describe" || !!userFreeDescription.trim()) &&
    (isAdmin || hasAdminToken || credits >= creditCost);

  const handleGenerate = async () => {
    if (!productFile) {
      toast.error("Please upload a product image");
      return;
    }
    if (template === "describe" && !userFreeDescription.trim()) {
      toast.error("Please describe what you want");
      return;
    }
    if (!isAdmin && !hasAdminToken && credits < creditCost) {
      toast.error("Not enough credits");
      return;
    }

    setIsGenerating(true);
    setGenStage("uploading");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && !isAdmin && !hasAdminToken) {
        toast.error("Please sign in to generate");
        navigate("/auth");
        return;
      }

      const productDataUrl = await fileToDataUrl(productFile);
      const logoDataUrl = logoFile ? await fileToDataUrl(logoFile) : undefined;
      const customModelDataUrl = customModelFile ? await fileToDataUrl(customModelFile) : undefined;

      setGenStage("generating");

      const textElementsSummary =
        template === "describe"
          ? [
              describeHeadline && `headline: "${describeHeadline}"`,
              describeSub && `subheadline: "${describeSub}"`,
              ...describeFeatures
                .filter((f) => f.text.trim())
                .map((f, i) => `feature ${i + 1}: ${f.icon} "${f.text}"`),
            ].filter(Boolean).join(", ")
          : undefined;

      const { data: startData, error: startError } = await supabase.functions.invoke("generate-listing-image", {
        body: {
          action: "generate",
          template,
          platform,
          language,
          aspect_ratio: aspectRatio,
          resolution,
          product_image_url: productDataUrl,
          display_mode: displayMode,
          model_description: displayMode === "with_model" ? modelDescription : undefined,
          model_image_url:
            displayMode === "with_model" && modelSource === "floowy"
              ? (customModelDataUrl || selectedModelUrl || undefined)
              : undefined,
          auto_model:
            displayMode === "with_model" && modelSource === "auto" ? true : undefined,
          auto_model_gender:
            displayMode === "with_model" && modelSource === "auto" ? autoGender : undefined,
          use_custom_background: useCustomBackground,
          background_prompt: useCustomBackground ? backgroundPrompt : undefined,
          background_color: useCustomBackground ? backgroundColor : undefined,
          primary_brand_color: usePrimaryBrand ? primaryBrand : undefined,
          secondary_brand_color: useSecondaryBrand ? secondaryBrand : undefined,
          logo_url: logoDataUrl,
          logo_position: logoPosition,
          logo_size: logoSize,
          user_free_description: template === "describe" ? userFreeDescription : undefined,
          text_elements_summary: textElementsSummary,
          headline_font: template === "describe" ? describeHeadlineFont : undefined,
        },
      });

      if (startError) throw startError;
      if (startData?.error) throw new Error(startData.error);
      const requestId = startData?.request_id;
      if (!requestId) throw new Error("No request id from server");

      // poll
      let imageUrls: string[] = [];
      const maxAttempts = 90;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const { data: statusData, error: statusErr } = await supabase.functions.invoke("generate-listing-image", {
          body: { action: "status", requestId },
        });
        if (statusErr) continue;
        if (statusData?.status === "COMPLETED") {
          const images = statusData.images || [];
          imageUrls = images.map((i: any) => i?.url).filter(Boolean) as string[];
          break;
        }
        if (statusData?.status === "FAILED") {
          throw new Error(statusData.error || "Generation failed");
        }
      }

      if (imageUrls.length === 0) throw new Error("Generation timed out");

      setGeneratedImageUrls(imageUrls);
      setActiveImageIndex(0);
      setShowPreviewModal(true);

      if (user?.id) {
        for (const url of imageUrls) {
          await supabase.from("generations").insert({
            user_id: user.id,
            prompt: `Listing Studio (${template}) — ${platform}`,
            original_image_url: productUrl || "",
            generated_image_url: url,
            status: "completed",
            tool_name: "listing_studio",
          });
        }
      }

      if (!isAdmin && !hasAdminToken && user) {
        const newBalance = await deductCredits(user.id, creditCost);
        setCredits(newBalance);
        await checkAndSendOutOfCreditsEmail(newBalance, userEmail, userName);
      }

      toast.success("Listing image generated!");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImageUrl) return;
    try {
      const resp = await fetch(generatedImageUrl);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `listing-${platform.toLowerCase()}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Image downloaded");
    } catch {
      toast.error("Failed to download image");
    }
  };

  const handleReset = () => {
    setShowPreviewModal(false);
    setGeneratedImageUrls([]);
    setActiveImageIndex(0);
    setProductFile(null);
    setProductUrl(null);
  };

  return (
    <>
      <Helmet>
        <title>Listing Studio Image Generator | Floowy</title>
        <meta name="description" content="Generate marketplace-ready product listing images with AI templates: USP, Step-by-step, or Describe yourself." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/home"><img src={logoImage} alt="Floowy" className="h-8 w-8 object-contain" /></Link>
              <div>
                <h1 className="text-lg font-semibold">Listing Studio</h1>
                <p className="text-xs text-muted-foreground">Marketplace-ready product images</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <PlanCreditsDisplay credits={credits} plan={userPlan} onAddCredits={() => {}} />
              <UserMenu onAddCredits={() => {}} />
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6 space-y-6 max-w-5xl">
          {/* Step 1 — Product */}
          <Card className="p-4" data-walkthrough-target="ls-upload">
            <h2 className="text-sm font-semibold mb-1">Step 1 · Product Image</h2>
            <p className="text-xs text-muted-foreground mb-3">Upload the product photo to feature in the listing.</p>
            <UploadArea onFileSelect={handleProductSelect} selectedFile={productFile} label="Upload product" compact />
          </Card>

          {/* Step 2 — Size & Resolution */}
          <Card className="p-4" data-walkthrough-target="ls-output">
            <h2 className="text-sm font-semibold mb-3">Step 2 · Size & Resolution</h2>
            <Label className="text-xs mb-2 block">Aspect Ratio</Label>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {ASPECT_RATIOS.map((r) => (
                <Button key={r} type="button" size="sm" variant={aspectRatio === r ? "default" : "outline"} onClick={() => setAspectRatio(r)}>
                  {r}
                </Button>
              ))}
            </div>
            <Label className="text-xs mb-2 block">Resolution</Label>
            <div className="grid grid-cols-3 gap-2">
              {RESOLUTIONS.map((r) => (
                <Button key={r.value} type="button" variant={resolution === r.value ? "default" : "outline"} onClick={() => setResolution(r.value)} className="flex flex-col h-auto py-2">
                  <span className="font-semibold">{r.label}</span>
                  <span className="text-[10px] opacity-70">{r.credits} credits</span>
                </Button>
              ))}
            </div>
          </Card>

          {/* Step 3 — Background */}
          <Card className="p-4 space-y-3" data-walkthrough-target="ls-bg">
            <h2 className="text-sm font-semibold">Step 3 · Background</h2>
            <div className="flex items-center justify-between">
              <Label htmlFor="bg-toggle" className="text-xs">Use custom background</Label>
              <Switch id="bg-toggle" checked={useCustomBackground} onCheckedChange={setUseCustomBackground} />
            </div>
            {useCustomBackground && (
              <>
                <div>
                  <Label className="text-xs mb-1 block">Background description</Label>
                  <Textarea
                    placeholder="e.g., modern living room, beach sunset, minimalist white studio"
                    maxLength={250}
                    value={backgroundPrompt}
                    onChange={(e) => setBackgroundPrompt(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground text-right mt-1">{backgroundPrompt.length}/250</p>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Background color (fallback)</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="h-9 w-14 rounded border border-input cursor-pointer" />
                    <Input value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="font-mono uppercase" />
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Step 4 — Model */}
          <Card className="p-4 space-y-3" data-walkthrough-target="ls-model">
            <h2 className="text-sm font-semibold">Step 4 · Model</h2>
            <div className="grid grid-cols-3 gap-2">
              <Button variant={displayMode === "product_only" ? "default" : "outline"} onClick={() => setDisplayMode("product_only")} className="flex-col h-auto py-3">
                <span className="text-xs font-semibold">No Model</span>
                <span className="text-[10px] opacity-70">Product only</span>
              </Button>
              <Button variant={displayMode === "hand_only" ? "default" : "outline"} onClick={() => setDisplayMode("hand_only")} className="flex-col h-auto py-3">
                <span className="text-xs font-semibold">Hand Only</span>
                <span className="text-[10px] opacity-70">Holding/Wearing</span>
              </Button>
              <Button variant={displayMode === "with_model" ? "default" : "outline"} onClick={() => setDisplayMode("with_model")} className="flex-col h-auto py-3">
                <span className="text-xs font-semibold">With Model</span>
                <span className="text-[10px] opacity-70">Select avatar</span>
              </Button>
            </div>
            {displayMode === "with_model" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setModelSource("floowy"); }}
                    className={`px-3 py-2.5 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${modelSource === "floowy" ? "border-primary bg-primary/10 text-primary font-medium" : "border-muted bg-popover hover:bg-accent"}`}
                  >
                    <User className="h-4 w-4" />
                    <span className="text-xs font-medium">Floowy Models</span>
                    <span className="text-[10px] text-muted-foreground">Select an avatar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setModelSource("auto"); setSelectedModelUrl(null); setCustomModelFile(null); }}
                    className={`px-3 py-2.5 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1 ${modelSource === "auto" ? "border-primary bg-primary/10 text-primary font-medium" : "border-muted bg-popover hover:bg-accent"}`}
                  >
                    <Wand2 className="h-4 w-4" />
                    <span className="text-xs font-medium">Auto Generated</span>
                    <span className="text-[10px] text-muted-foreground">AI creates model</span>
                  </button>
                </div>
                {modelSource === "floowy" && (
                  <ModelSelector
                    selectedModel={selectedModelUrl}
                    onModelSelect={(url) => setSelectedModelUrl(url)}
                    customModelFile={customModelFile}
                    onCustomModelFileChange={setCustomModelFile}
                    columns={5}
                    maxHeight="320px"
                  />
                )}
                {modelSource === "auto" && (
                  <div className="grid grid-cols-2 gap-2">
                    {(["female", "male"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setAutoGender(g)}
                        className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium capitalize ${autoGender === g ? "border-primary bg-primary/10 text-primary" : "border-muted bg-popover hover:bg-accent"}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                )}
                <Textarea
                  placeholder="Optional: extra notes about the model (pose, vibe, styling)…"
                  value={modelDescription}
                  onChange={(e) => setModelDescription(e.target.value)}
                  rows={2}
                />
              </div>
            )}
          </Card>

          {/* Step 5 — Brand colors */}
          <Card className="p-4 space-y-3" data-walkthrough-target="ls-brand">
            <h2 className="text-sm font-semibold">Step 5 · Brand Colors (optional)</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Primary brand color</Label>
                <Switch checked={usePrimaryBrand} onCheckedChange={setUsePrimaryBrand} />
              </div>
              {usePrimaryBrand && (
                <div className="flex items-center gap-2">
                  <input type="color" value={primaryBrand} onChange={(e) => setPrimaryBrand(e.target.value)} className="h-9 w-14 rounded border border-input cursor-pointer" />
                  <Input value={primaryBrand} onChange={(e) => setPrimaryBrand(e.target.value)} className="font-mono uppercase" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Secondary brand color</Label>
                <Switch checked={useSecondaryBrand} onCheckedChange={setUseSecondaryBrand} disabled={!usePrimaryBrand} />
              </div>
              {useSecondaryBrand && usePrimaryBrand && (
                <div className="flex items-center gap-2">
                  <input type="color" value={secondaryBrand} onChange={(e) => setSecondaryBrand(e.target.value)} className="h-9 w-14 rounded border border-input cursor-pointer" />
                  <Input value={secondaryBrand} onChange={(e) => setSecondaryBrand(e.target.value)} className="font-mono uppercase" />
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              No colors → derived from product. Primary only → primary used for accents, lighter tint for icons. Both → primary for bars/numbers, secondary for icons.
            </p>
          </Card>

          {/* Step 6 — Logo */}
          <Card className="p-4 space-y-3" data-walkthrough-target="ls-logo">
            <h2 className="text-sm font-semibold">Step 6 · Logo (optional)</h2>
            {!logoFile ? (
              <label className="flex items-center justify-center border border-dashed border-input rounded-md h-24 cursor-pointer hover:bg-muted/50 transition">
                <input type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                <span className="text-xs text-muted-foreground"><Upload className="inline h-4 w-4 mr-1" /> Upload logo</span>
              </label>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={URL.createObjectURL(logoFile)} alt="logo" className="h-12 w-12 object-contain rounded border border-border" />
                  <span className="text-xs">{logoFile.name}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setLogoFile(null)}><X className="h-4 w-4" /></Button>
              </div>
            )}
            {logoFile && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Position</Label>
                  <Select value={logoPosition} onValueChange={(v) => setLogoPosition(v as LogoPosition)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="top-center">Top Center</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="bottom-center">Bottom Center</SelectItem>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Size: {logoSize}px</Label>
                  <Input type="range" min={30} max={200} step={5} value={logoSize} onChange={(e) => setLogoSize(parseInt(e.target.value))} />
                </div>
              </div>
            )}
          </Card>

          {/* Step 7 — Language */}
          <Card className="p-4 space-y-3" data-walkthrough-target="ls-language">
            <h2 className="text-sm font-semibold">Step 7 · Overlay Language</h2>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (<SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </Card>

          {/* Step 8 — Template */}
          <Card className="p-4 space-y-4" data-walkthrough-target="ls-template">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-sm font-semibold">Step 8 · Template</h2>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs value={template} onValueChange={(v) => setTemplate(v as Template)}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="usp">USP</TabsTrigger>
                <TabsTrigger value="steps">Step-by-step</TabsTrigger>
                <TabsTrigger value="describe">Describe yourself</TabsTrigger>
              </TabsList>

              <TabsContent value="usp" className="pt-3">
                <p className="text-xs text-muted-foreground">
                  Headline + 3 USP pills + bottom bar. AI fills the copy from your product image in <strong>{language}</strong>.
                </p>
              </TabsContent>

              <TabsContent value="steps" className="pt-3">
                <p className="text-xs text-muted-foreground">
                  Numbered 1·2·3 instructional layout with summary bar and 3 mini USP icons. AI fills steps from your product image in <strong>{language}</strong>.
                </p>
              </TabsContent>

              <TabsContent value="describe" className="pt-3 space-y-3">
                <div>
                  <Label className="text-xs">Free description (required)</Label>
                  <Textarea
                    placeholder="Describe the scene, mood and feel you want…"
                    value={userFreeDescription}
                    onChange={(e) => setUserFreeDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Headline (optional)</Label>
                    <Input value={describeHeadline} onChange={(e) => setDescribeHeadline(e.target.value)} placeholder="Enter headline" />
                  </div>
                  <div>
                    <Label className="text-xs">Subheadline (optional)</Label>
                    <Input value={describeSub} onChange={(e) => setDescribeSub(e.target.value)} placeholder="Enter subheadline" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Headline font style</Label>
                  <Select value={describeHeadlineFont} onValueChange={setDescribeHeadlineFont}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern sans-serif">Modern sans-serif</SelectItem>
                      <SelectItem value="bold geometric sans-serif">Bold geometric</SelectItem>
                      <SelectItem value="elegant serif">Elegant serif</SelectItem>
                      <SelectItem value="condensed display">Condensed display</SelectItem>
                      <SelectItem value="handwritten script">Handwritten script</SelectItem>
                      <SelectItem value="minimalist mono">Minimalist mono</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Key features (optional · up to 3)</Label>
                  {describeFeatures.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        className="w-16 text-center"
                        value={f.icon}
                        onChange={(e) => {
                          const next = [...describeFeatures];
                          next[i] = { ...next[i], icon: e.target.value };
                          setDescribeFeatures(next);
                        }}
                        placeholder="✓"
                      />
                      <Input
                        className="flex-1"
                        value={f.text}
                        onChange={(e) => {
                          const next = [...describeFeatures];
                          next[i] = { ...next[i], text: e.target.value };
                          setDescribeFeatures(next);
                        }}
                        placeholder={`Feature ${i + 1} text`}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">AI chooses positions for text overlays automatically.</p>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Generate */}
          <div className="flex flex-col items-center gap-3 pt-2" data-walkthrough-target="ls-generate">
            <Button onClick={handleGenerate} disabled={!canGenerate || isGenerating} size="lg" className="w-full max-w-md">
              {isGenerating ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating…</>
              ) : (
                <><Sparkles className="mr-2 h-5 w-5" /> Generate Listing Image ({creditCost} credits)</>
              )}
            </Button>
            {!productUrl && <p className="text-xs text-muted-foreground">Upload a product image to start.</p>}
            {!isAdmin && !hasAdminToken && credits < creditCost && (
              <p className="text-xs text-destructive">You need at least {creditCost} credits.</p>
            )}
          </div>
        </div>

        {/* Progress */}
        <GenerationProgressOverlay
          open={isGenerating}
          stage={genStage}
          progress={genStage === "uploading" ? 15 : genStage === "generating" ? 55 : 90}
          statusMessage={
            genStage === "uploading" ? "Preparing your assets…" :
            genStage === "generating" ? "AI is composing your listing…" : "Finalizing…"
          }
          title="Creating Your Listing Image"
          steps={[
            { key: "uploading", label: "Preparing assets", icon: Upload },
            { key: "generating", label: "AI composition", icon: Wand2 },
            { key: "finalizing", label: "Finalizing result", icon: ImageIcon },
          ]}
          onClose={() => {}}
        />

        {/* Preview */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader><DialogTitle>Generated Listing Image</DialogTitle></DialogHeader>
            {generatedImageUrl && (
              <div className="space-y-4">
                <div ref={canvasRef} className="relative flex items-center justify-center bg-muted rounded-lg overflow-hidden p-4">
                  <img src={displayUrl(generatedImageUrl)} alt="Generated listing" className="max-w-full max-h-[60vh] object-contain" />
                </div>
                {generatedImageUrls.length > 1 && (
                  <div className="flex justify-center gap-2">
                    {generatedImageUrls.map((u, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImageIndex(i)}
                        className={`h-16 w-16 rounded-md overflow-hidden border-2 transition ${i === activeImageIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}
                      >
                        <img src={displayUrl(u)} alt={`Variation ${i + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-sm text-muted-foreground text-center">{aspectRatio} · {resolution}</p>
                <div className="flex justify-end gap-3 flex-wrap">
                  <Button variant="outline" onClick={handleReset}><RotateCcw className="h-4 w-4 mr-2" /> Reset</Button>
                  <Button variant="outline" onClick={gate(() => setEditing(true))}>
                    {canExport ? <Pencil className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />} Edit
                  </Button>
                  <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                    <Sparkles className="h-4 w-4 mr-2" /> Adjust & Regenerate
                  </Button>
                  <Button onClick={gate(handleDownload)}>
                    {canExport ? <Download className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                    {canExport ? "Download" : "Unlock to Download"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {editing && generatedImageUrl && (
          <ImageEditModal
            open={editing}
            onOpenChange={setEditing}
            imageUrl={generatedImageUrl}
            onEditComplete={(newUrl) =>
              setGeneratedImageUrls((prev) => {
                const next = [...prev];
                next[activeImageIndex] = newUrl;
                return next;
              })
            }
            isAdmin={isAdmin || hasAdminToken}
          />
        )}
        <UnlockDialog open={unlockOpen} onOpenChange={setUnlockOpen} />
      </div>
    </>
  );
};

export default ListingStudioGenerator;