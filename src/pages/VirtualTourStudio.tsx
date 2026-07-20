import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/floowy-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Play, Download, Loader2, Image as ImageIcon, Music, Film, Layers, RotateCcw, Building2, MapPin, DollarSign, Sparkles, CheckCircle2, AlertCircle, GripVertical, Volume2, VolumeX, RectangleVertical, RectangleHorizontal, Info, Lock } from "lucide-react";
import DragDropZone from "@/components/DragDropZone";
import CreditsPurchaseDialog from "@/components/CreditsPurchaseDialog";
import { UnlockDialog } from "@/components/UnlockDialog";
import { useImageGating } from "@/hooks/useImageGating";
import PlanCreditsDisplay from "@/components/PlanCreditsDisplay";
import UserMenu from "@/components/UserMenu";
import { AdminToolsSidebar } from "@/components/AdminToolsSidebar";
import { checkAndSendOutOfCreditsEmail, deductCredits } from "@/hooks/useCreditDeduction";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type GenerationStep = "idle" | "uploading" | "generating_videos" | "generating_music" | "merging" | "completed" | "failed";

const CLIP_DURATION = 4;

const calculateCredits = (numImages: number) => numImages * 5;

const MUSIC_MOODS = [
  { id: "cinematic", label: "Cinematic", emoji: "🎬", prompt: "Soft cinematic ambient background music for a luxury real estate virtual walkthrough. Warm piano melody, subtle atmospheric pads, light modern percussion, and gentle string textures. Minimal and elegant. Mid-tempo (90 BPM). Inspiring, calm, upscale, and inviting. The track must end with a smooth, gentle fade-out outro over the final 3-4 seconds, gradually reducing volume and thinning instrumentation for a clean, polished ending. No vocals." },
  { id: "bright", label: "Bright & Upbeat", emoji: "☀️", prompt: "Bright upbeat positive background music with cheerful acoustic guitar, light claps, uplifting piano chords, and warm synth pads. Energetic yet smooth. Mid-tempo (110 BPM). Happy, optimistic, fresh, and modern. The track must end with a smooth, gentle fade-out outro over the final 3-4 seconds, softly winding down the energy for a natural, satisfying close. No vocals." },
  { id: "elegant", label: "Elegant & Luxury", emoji: "✨", prompt: "Elegant luxury background music with smooth jazz piano, soft brushed drums, warm bass, and subtle orchestral strings. Sophisticated and refined. Slow-tempo (80 BPM). Premium, classy, upscale, and serene. The track must end with a smooth, elegant fade-out outro over the final 3-4 seconds, letting the piano and strings trail off gracefully. No vocals." },
  { id: "modern", label: "Modern & Trendy", emoji: "🔥", prompt: "Modern trendy background music with deep house beats, smooth synth melodies, subtle bass drops, and atmospheric textures. Cool and stylish. Mid-tempo (105 BPM). Sleek, contemporary, urban, and vibrant. The track must end with a smooth fade-out outro over the final 3-4 seconds, gradually lowering the beats and melodies for a clean exit. No vocals." },
  { id: "relaxed", label: "Relaxed & Chill", emoji: "🌊", prompt: "Relaxed chill background music with soft lo-fi beats, gentle acoustic guitar, ambient pads, and nature-inspired textures. Calm and peaceful. Slow-tempo (75 BPM). Soothing, tranquil, warm, and meditative. The track must end with a smooth, peaceful fade-out outro over the final 3-4 seconds, dissolving softly into silence. No vocals." },
  { id: "dramatic", label: "Dramatic & Bold", emoji: "🎭", prompt: "Dramatic bold cinematic background music with powerful orchestral strings, deep brass, impactful percussion, and rising tension. Epic and grand. Mid-tempo (95 BPM). Majestic, powerful, awe-inspiring, and commanding. The track must end with a smooth, resolving fade-out outro over the final 3-4 seconds, easing from intensity into a graceful conclusion. No vocals." },
  { id: "ambient", label: "Ambient & Ethereal", emoji: "🌌", prompt: "Ambient ethereal background music with layered atmospheric pads, gentle reverb-drenched textures, soft granular synthesis, and distant melodic echoes. Dreamy and immersive. Slow-tempo (70 BPM). Otherworldly, floating, expansive, and contemplative. The track must end with a smooth, dissolving fade-out outro over the final 3-4 seconds, letting the textures evaporate naturally into silence. No vocals." },
] as const;

const PIPELINE_STEPS = [
  { key: "uploading", label: "Uploading images", icon: Upload },
  { key: "generating_videos", label: "Generating video clips", icon: Film },
  { key: "generating_music", label: "Composing soundtrack", icon: Music },
  { key: "merging", label: "Rendering final video", icon: Layers },
] as const;

const VirtualTourStudio = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auth & credits
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [plan, setPlan] = useState("free");
  const [isAdmin, setIsAdmin] = useState(false);
  const { canExport, gate, unlockOpen, setUnlockOpen } = useImageGating({ isAdmin });
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);

  // Inputs
  const [images, setImages] = useState<File[]>([]);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoDimensions, setLogoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [propertyName, setPropertyName] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [musicMood, setMusicMood] = useState<string>("cinematic");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");

  // Generation state
  const [step, setStep] = useState<GenerationStep>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [showResultDialog, setShowResultDialog] = useState(false);
  const abortRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auth check - admin token bypass
  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');

    const handleSession = (session: any) => {
      if (session) {
        setUser(session.user);
        fetchCredits(session.user.id);
        fetchUserPlan(session.user.id);
        checkAdmin(session.user.id);
      } else if (adminToken) {
        // Admin mode without user session - allow access
        setIsAdmin(true);
      } else {
        navigate("/auth");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Defer — handleSession runs supabase queries; calling it inside the callback deadlocks the auth lock.
      setTimeout(() => handleSession(session), 0);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchCredits = async (userId: string) => {
    const { data } = await supabase.from("credits").select("balance").eq("user_id", userId).maybeSingle();
    if (data) setCredits(data.balance);
  };

  const fetchUserPlan = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("plan").eq("id", userId).maybeSingle();
    if (data) setPlan(data.plan);
  };

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    setIsAdmin(!!data);
  };

  // Image handling
  const handleImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => ["image/jpeg", "image/png", "image/webp"].includes(f.type) && f.size <= 50 * 1024 * 1024);
    if (valid.length < files.length) {
      toast({ title: "Some files skipped", description: "Only JPG/PNG/WebP under 50MB accepted", variant: "destructive" });
    }
    setImages(prev => [...prev, ...valid]);
  };

  const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index));

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && ["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setLogo(file);
      // Analyze logo dimensions for aspect-ratio-aware sizing
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        setLogoDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        setLogoDimensions(null);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  };

  // Drag & drop reorder
  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragEnter = (index: number) => setDragOverIndex(index);
  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      setImages(prev => {
        const updated = [...prev];
        const [moved] = updated.splice(draggedIndex, 1);
        updated.splice(dragOverIndex, 0, moved);
        return updated;
      });
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Analyze logo to determine background color
  const analyzeLogoColors = (file: File): Promise<string> => new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 100;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      let transparentPixels = 0;
      let darkPixels = 0;
      let lightPixels = 0;
      const totalPixels = size * size;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 128) { transparentPixels++; continue; }
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        if (brightness < 128) darkPixels++;
        else lightPixels++;
      }

      URL.revokeObjectURL(url);
      const isTransparent = transparentPixels > totalPixels * 0.3;

      if (isTransparent) {
        // Transparent logo: check visible pixel colors
        resolve(darkPixels > lightPixels ? "#FFFFFF" : "#000000");
      } else {
        // Solid background: check overall brightness
        resolve(lightPixels > darkPixels ? "#000000" : "#FFFFFF");
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve("#000000"); };
    img.src = url;
  });

  // Helpers
  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const uploadToImgbb = async (file: File): Promise<string> => {
    const base64 = await toBase64(file);
    const { data, error } = await supabase.functions.invoke("upload-to-imgbb", {
      body: { image_base64: base64 },
    });
    if (error || !data?.url) throw new Error("Failed to upload image");
    return data.url;
  };

  const pollStatus = async (requestId: string, endpoint: string, statusUrl?: string, responseUrl?: string, maxAttempts = 120): Promise<any> => {
    for (let i = 0; i < maxAttempts; i++) {
      if (abortRef.current) throw new Error("Aborted");
      const { data, error } = await supabase.functions.invoke("generate-virtual-tour", {
        body: { action: "check_status", request_id: requestId, endpoint, status_url: statusUrl, response_url: responseUrl },
      });
      if (error) throw error;
      if (data.status === "COMPLETED") return data.result;
      if (data.status === "FAILED") throw new Error("Generation failed");
      await new Promise(r => setTimeout(r, 5000));
    }
    throw new Error("Timeout waiting for generation");
  };

  const pollMerge = async (renderId: string, maxAttempts = 120): Promise<string> => {
    for (let i = 0; i < maxAttempts; i++) {
      if (abortRef.current) throw new Error("Aborted");
      const { data, error } = await supabase.functions.invoke("generate-virtual-tour", {
        body: { action: "check_merge", render_id: renderId },
      });
      if (error) throw error;
      const status = data?.response?.status;
      if (status === "done") return data.response.url;
      if (status === "failed") throw new Error("Video merge failed");
      await new Promise(r => setTimeout(r, 5000));
    }
    throw new Error("Timeout waiting for merge");
  };

  const getLogoSizes = () => {
    // Watermark target: ~223px wide area; End card target: ~427px wide area
    const WATERMARK_TARGET = 223;
    const ENDCARD_TARGET = 427;

    if (!logoDimensions) {
      // Fallback: assume landscape
      return {
        watermark: { width: WATERMARK_TARGET, height: 94 },
        endCard: { width: ENDCARD_TARGET, height: 174 },
      };
    }

    const ratio = logoDimensions.width / logoDimensions.height;
    const isSquare = Math.abs(ratio - 1) < 0.15; // within 15% of 1:1

    if (isSquare) {
      // Square: constrain by height to keep it compact
      const wmHeight = 94;
      const wmWidth = Math.round(wmHeight * ratio);
      const ecHeight = 174;
      const ecWidth = Math.round(ecHeight * ratio);
      return {
        watermark: { width: wmWidth, height: wmHeight },
        endCard: { width: ecWidth, height: ecHeight },
      };
    } else {
      // Landscape/portrait: constrain by width
      const wmWidth = WATERMARK_TARGET;
      const wmHeight = Math.round(wmWidth / ratio);
      const ecWidth = ENDCARD_TARGET;
      const ecHeight = Math.round(ecWidth / ratio);
      return {
        watermark: { width: wmWidth, height: wmHeight },
        endCard: { width: ecWidth, height: ecHeight },
      };
    }
  };

  const buildShotstackTimeline = (videoUrls: string[], musicUrl: string, logoUrl: string | null, bgColor: string = "#FFFFFF", ratio: "16:9" | "9:16" = "16:9") => {
    const totalVideoDuration = videoUrls.length * CLIP_DURATION;
    const logoEndCardDuration = logoUrl ? 1.5812586805555569 : 0;
    const fullDuration = totalVideoDuration + logoEndCardDuration;
    const tracks: any[] = [];

    // Track 1: Audio (soundtrack spans full duration, with fade-out fallback)
    const audioFadeOut = Math.min(3, fullDuration * 0.15); // 3s fade or 15% of duration
    tracks.push({
      clips: [{
        asset: { type: "audio", src: musicUrl, volume: 1, effect: "fadeOut" },
        start: 0, length: fullDuration, fit: "cover",
      }],
    });

    // Track 2: Logo watermark (top-right) + Logo end card (centered, larger)
    if (logoUrl) {
      const logoSizes = getLogoSizes();
      tracks.push({
        clips: [
          {
            asset: { type: "image", src: logoUrl },
            start: 0.026666667461395264,
            length: totalVideoDuration - 0.026666667461395264,
            fit: "cover", width: logoSizes.watermark.width, height: logoSizes.watermark.height,
            offset: { x: 0.4218365937261268, y: -0.42789103416237284 },
          },
          {
            asset: { type: "image", src: logoUrl },
            start: totalVideoDuration - 0.025703125,
            length: logoEndCardDuration + 0.025703125,
            fit: "cover", width: logoSizes.endCard.width, height: logoSizes.endCard.height,
            offset: { x: 0, y: 0 },
            transition: { in: "wipeRightSlow" },
          },
        ],
      });
    }

    // Track 3: Project Name (largest text, size 80)
    tracks.push({
      clips: [{
        asset: {
          type: "rich-text", text: propertyName,
          font: { family: "JTUSjIg1_i6t8kCHKm45xW5rygbi49c", color: "#ffffff", opacity: 1, weight: 700, size: 80 },
          style: { textTransform: "none" },
        },
        start: 0.4619047528221494, length: 3.5580952471778504,
        width: 1683, height: 68,
        offset: { x: 0, y: 0.17677328988821894 },
        transition: { in: "fade", out: "fade" },
        transform: { rotate: { angle: 0 } },
      }],
    });

    // Track 4: Address (medium text, size 64)
    if (address && address.trim()) {
      tracks.push({
        clips: [{
          asset: {
            type: "rich-text", text: address,
            font: { family: "JTUSjIg1_i6t8kCHKm45xW5rygbi49c", color: "#ffffff", opacity: 1, weight: 700, size: 64 },
            style: { textTransform: "none" },
          },
          start: 0.4619047528221494, length: 3.5580952471778504,
          width: 1367, height: 68,
          offset: { x: 0, y: 0.063519742194877 },
          transition: { in: "fade", out: "fade" },
        }],
      });
    }

    // Track 5: Price (smallest text, size 52)
    if (price && price.trim()) {
      tracks.push({
        clips: [{
          asset: {
            type: "rich-text", text: price,
            font: { family: "JTUSjIg1_i6t8kCHKm45xW5rygbi49c", color: "#ffffff", opacity: 1, weight: 700, size: 52 },
            style: { textTransform: "none" },
          },
          start: 0.4619047528221494, length: 3.5580952471778504,
          width: 500, height: 50,
          offset: { x: 0, y: -0.02314814814814814 },
          transition: { in: "fade", out: "fade" },
        }],
      });
    }

    // Track 6: Video clips (bottom layer)
    tracks.push({
      clips: videoUrls.map((url, i) => ({
        asset: { type: "video", src: url, transcode: false, volume: 1 },
        start: i * CLIP_DURATION, length: CLIP_DURATION, fit: "cover",
        offset: { x: 0, y: 0 },
      })),
    });

    return {
      timeline: {
        fonts: [{ src: "https://fonts.gstatic.com/s/montserrat/v31/JTUSjIg1_i6t8kCHKm45xW5rygbi49c.ttf" }],
        background: bgColor,
        tracks,
      },
      output: {
        format: "mp4",
        fps: 25,
        size: ratio === "9:16" ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 },
        destinations: [{ provider: "shotstack" }],
      },
    };
  };

  // Main generation flow
  const handleGenerate = async () => {
    if (images.length < 2) {
      toast({ title: "Need at least 2 images", variant: "destructive" });
      return;
    }
    if (!propertyName.trim()) {
      toast({ title: "Property name required", variant: "destructive" });
      return;
    }

    const cost = calculateCredits(images.length);
    if (credits < cost && !isAdmin) {
      toast({ title: "Not enough credits", description: `This generation costs ${cost} credits`, variant: "destructive" });
      setShowCreditsDialog(true);
      return;
    }

    abortRef.current = false;
    setStep("uploading");
    setProgress(0);
    setStatusMessage("Uploading images...");
    setShowResultDialog(true);

    try {
      const imageUrls: string[] = [];
      let logoUrl: string | null = null;
      let bgColor = "#000000";

      // Analyze logo colors before uploading
      if (logo) {
        bgColor = await analyzeLogoColors(logo);
        console.log("Logo analysis result - background color:", bgColor);
      }

      for (let i = 0; i < images.length; i++) {
        setStatusMessage(`Uploading image ${i + 1} of ${images.length}...`);
        setProgress(Math.round(((i + 1) / (images.length + (logo ? 1 : 0))) * 15));
        const url = await uploadToImgbb(images[i]);
        imageUrls.push(url);
      }

      if (logo) {
        setStatusMessage("Uploading logo...");
        logoUrl = await uploadToImgbb(logo);
      }
      setProgress(15);

      setStep("generating_videos");
      setStatusMessage("Generating video clips...");
      const videoSubmissions: { request_id: string; status_url?: string; response_url?: string }[] = [];

      for (const url of imageUrls) {
        const { data, error } = await supabase.functions.invoke("generate-virtual-tour", {
          body: { action: "generate_video", image_url: url, aspect_ratio: aspectRatio },
        });
        if (error || !data?.request_id) throw new Error("Failed to queue video generation");
        videoSubmissions.push({ request_id: data.request_id, status_url: data.status_url, response_url: data.response_url });
      }

      setStep("generating_music");
      const logoEndCardDuration = 4;
      const totalDurationSec = images.length * CLIP_DURATION + logoEndCardDuration;
      const selectedMood = MUSIC_MOODS.find(m => m.id === musicMood) || MUSIC_MOODS[0];
      const { data: musicData, error: musicError } = await supabase.functions.invoke("generate-virtual-tour", {
        body: { action: "generate_music", duration: totalDurationSec, prompt: selectedMood.prompt },
      });
      if (musicError || !musicData?.request_id) throw new Error("Failed to queue music generation");

      setStep("generating_videos");
      setStatusMessage("Generating video clips & music (this may take a few minutes)...");

      let completedVideos = 0;
      const totalJobs = videoSubmissions.length + 1; // videos + music

      const videoResults = await Promise.all(
        videoSubmissions.map((sub) =>
          pollStatus(sub.request_id, aspectRatio === "9:16" ? "video-portrait" : "video", sub.status_url, sub.response_url).then(result => {
            completedVideos++;
            setProgress(15 + Math.round((completedVideos / totalJobs) * 60));
            setStatusMessage(`Generated ${completedVideos} of ${videoSubmissions.length} clips...`);
            return result;
          })
        )
      );

      const musicResult = await pollStatus(musicData.request_id, "music", musicData.status_url, musicData.response_url);
      setProgress(75);
      setStatusMessage("All clips & music ready...");

      const videoUrls = videoResults.map(r => r?.video?.url).filter(Boolean);
      const musicUrl = musicResult?.audio?.url || musicResult?.audio_file?.url;

      if (videoUrls.length === 0) throw new Error("No video clips generated");
      if (!musicUrl) throw new Error("Music generation failed");

      setStep("merging");
      setStatusMessage("Preparing assets for merge...");
      setProgress(76);

      // Re-host FAL assets to persistent storage so Shotstack can fetch them
      const proxyAsset = async (url: string, filename: string): Promise<string> => {
        const { data, error } = await supabase.functions.invoke("generate-virtual-tour", {
          body: { action: "proxy_asset", url, filename },
        });
        if (error || !data?.url) throw new Error(`Failed to proxy asset: ${filename}`);
        return data.url;
      };

      const timestamp = Date.now();
      const [persistentVideoUrls, persistentMusicUrl] = await Promise.all([
        Promise.all(videoUrls.map((url: string, i: number) => proxyAsset(url, `${timestamp}-video-${i}.mp4`))),
        proxyAsset(musicUrl, `${timestamp}-music.wav`),
      ]);
      setProgress(80);

      setStatusMessage("Merging final video...");
      const timeline = buildShotstackTimeline(persistentVideoUrls, persistentMusicUrl, logoUrl, bgColor, aspectRatio);
      const { data: mergeData, error: mergeError } = await supabase.functions.invoke("generate-virtual-tour", {
        body: { action: "merge", timeline },
      });
      if (mergeError) throw mergeError;

      const renderId = mergeData?.response?.id;
      if (!renderId) throw new Error("Failed to start video merge");

      setStatusMessage("Rendering final video...");
      const finalUrl = await pollMerge(renderId);
      setProgress(100);

      if (!isAdmin) {
        const newBalance = await deductCredits(user.id, cost);
        setCredits(newBalance);

        const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("id", user.id).maybeSingle();
        if (profile) {
          await checkAndSendOutOfCreditsEmail(newBalance, profile.email || "", profile.full_name || "");
        }
      }

      await supabase.from("generations").insert({
        user_id: user.id,
        prompt: `Virtual Video Studio: ${propertyName}`,
        original_image_url: imageUrls[0],
        generated_image_url: finalUrl,
        status: "completed",
        tool_name: "virtual-tour",
      });

      setResultUrl(finalUrl);
      setStep("completed");
      setStatusMessage("Property video ready!");
      toast({ title: "Video generated!", description: "Your property video is ready to download" });
    } catch (error: any) {
      console.error("Generation error:", error);
      setStep("failed");
      setStatusMessage("Something went wrong. Please try again.");
      toast({ title: "Generation failed", description: "Something went wrong while generating your video. Please try again.", variant: "destructive" });
    }
  };

  const handleDownload = async () => {
    if (!resultUrl) return;
    try {
      const response = await fetch(resultUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vertical-video-studio-${propertyName.replace(/\s+/g, "-").toLowerCase()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(resultUrl, "_blank");
    }
  };

  const handleReset = () => {
    setImages([]);
    setLogo(null);
    setPropertyName("");
    setAddress("");
    setPrice("");
    setStep("idle");
    setProgress(0);
    setStatusMessage("");
    setResultUrl("");
    setShowResultDialog(false);
    abortRef.current = true;
  };

  const creditCost = images.length >= 1 ? calculateCredits(images.length) : 5;
  const isGenerating = step !== "idle" && step !== "completed" && step !== "failed";
  const showDialog = showResultDialog || isGenerating || step === "completed" || step === "failed";

  return (
    <div className="min-h-screen bg-background flex">
      {isAdmin && <AdminToolsSidebar />}
      
      <div className="flex-1 flex flex-col">
        {/* Navigation */}
        <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img src={logoImage} alt="Floowy.ai" className="h-8 w-auto" />
                <span className="font-bold text-xl text-foreground">Floowy.ai</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <PlanCreditsDisplay 
                plan={plan} 
                credits={credits} 
                onAddCredits={() => setShowCreditsDialog(true)}
              />
              <UserMenu onAddCredits={() => setShowCreditsDialog(true)} />
            </div>
          </div>
        </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Virtual Video Studio
          </h1>
          <p className="text-xl text-muted-foreground">
            Create cinematic property showcase videos with AI-generated clips and music
          </p>
        </div>

        {/* Main content grid - always visible */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
          {/* Left: Image upload + Logo */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Property images */}
            <div data-walkthrough-target="vt-images" className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6 shadow-elegant">
              <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                <div className="min-w-0">
                  <Label className="text-base sm:text-lg font-semibold block">Property Images</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Upload at least 2 photos · Drag to reorder · Each image = 4s clip
                  </p>
                </div>
                {images.length > 0 && (
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-primary/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shrink-0">
                    <Film className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                    <span className="text-[10px] sm:text-xs font-semibold text-primary">{images.length * CLIP_DURATION}s</span>
                  </div>
                )}
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
                  {images.map((file, i) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragEnter={() => handleDragEnter(i)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      className={`relative group rounded-lg sm:rounded-xl overflow-hidden border-2 aspect-[4/3] cursor-grab active:cursor-grabbing transition-all duration-200 ${
                        dragOverIndex === i ? "border-primary scale-[1.02] shadow-lg shadow-primary/20" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <img src={URL.createObjectURL(file)} alt={`Property ${i + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4 text-white drop-shadow-md" />
                      </div>
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <DragDropZone onFileDrop={(files) => { const valid = files.filter(f => ["image/jpeg", "image/png", "image/webp"].includes(f.type) && f.size <= 50 * 1024 * 1024); setImages(prev => [...prev, ...valid]); }} accept="image/jpeg,image/png,image/webp" multiple className="w-full">
              <label className="flex flex-col items-center justify-center gap-2 sm:gap-3 border-2 border-dashed border-primary/20 rounded-xl p-5 sm:p-8 cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02] transition-all group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="text-center">
                  <span className="text-xs sm:text-sm font-medium text-foreground block">
                    {images.length === 0 ? "Drop your property photos here" : "Add more images"}
                  </span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">JPG, PNG or WebP · Max 50MB each</span>
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImagesSelect} className="hidden" />
              </label>
              </DragDropZone>
            </div>

            {/* Logo upload - under images */}
            <div data-walkthrough-target="vt-logo" className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6 shadow-elegant">
              <Label className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 block">Logo (Optional)</Label>
              {logo ? (
                <div className="flex items-center gap-3 bg-muted/30 rounded-xl p-3">
                  <img src={URL.createObjectURL(logo)} alt="Logo" className="h-10 object-contain rounded" />
                  <span className="text-sm text-muted-foreground truncate flex-1">{logo.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => setLogo(null)} className="shrink-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <DragDropZone onFileDrop={(files) => { if (files[0]) { const e = { target: { files } } as any; handleLogoSelect(e); } }} accept="image/jpeg,image/png,image/webp" className="w-full">
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-colors">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs sm:text-sm text-muted-foreground">Drop or click to upload logo</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoSelect} className="hidden" />
                </label>
                </DragDropZone>
              )}
            </div>

            {/* Aspect Ratio - separate panel */}
            <div data-walkthrough-target="vt-aspect" className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6 shadow-elegant">
              <Label className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center gap-1.5">
                <Film className="w-4 h-4 text-muted-foreground" /> Aspect Ratio
              </Label>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                <button
                  onClick={() => setAspectRatio("16:9")}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-all text-left ${
                    aspectRatio === "16:9"
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <RectangleHorizontal className="w-4 h-4" />
                  <span>16:9 Landscape</span>
                </button>
                <button
                  onClick={() => setAspectRatio("9:16")}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-all text-left ${
                    aspectRatio === "9:16"
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <RectangleVertical className="w-4 h-4" />
                  <span>9:16 Portrait</span>
                </button>
              </div>
              {aspectRatio === "9:16" && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs sm:text-sm text-primary">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>For best results, upload images in <strong>9:16 portrait</strong> aspect ratio (e.g. 1080×1920). Landscape images will be cropped automatically.</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Property details */}
          <div className="lg:col-span-2 flex flex-col">
            <div data-walkthrough-target="vt-details" className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6 shadow-elegant space-y-3 sm:space-y-4 flex-1">
              <Label className="text-base sm:text-lg font-semibold block">Property Details</Label>

              <div className="space-y-1.5">
                <Label htmlFor="propertyName" className="text-xs sm:text-sm flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> Project Name *
                </Label>
                <Input id="propertyName" value={propertyName} onChange={e => setPropertyName(e.target.value)} placeholder="Luxury Beachfront Villa" className="h-9 sm:h-10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs sm:text-sm flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Address
                </Label>
                <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Ocean Drive, Miami, FL" className="h-9 sm:h-10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-xs sm:text-sm flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-muted-foreground" /> Price
                </Label>
                <Input id="price" value={price} onChange={e => setPrice(e.target.value)} placeholder="$2,500,000" className="h-9 sm:h-10" />
              </div>

              {/* Music Mood */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-muted-foreground" /> Music Style
                </Label>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  {MUSIC_MOODS.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => setMusicMood(mood.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-all text-left ${
                        musicMood === mood.id
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <span className="text-sm">{mood.emoji}</span>
                      <span className="truncate">{mood.label}</span>
                    </button>
                  ))}
              </div>

            </div>
            </div>
          </div>
        </div>

        {/* Generate panel - full width below the grid */}
        <div className="mt-4 sm:mt-8 bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6 shadow-elegant">
          <div className="flex flex-col gap-4">
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Images:</span>
                <span className="font-semibold">{images.length}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-semibold">{images.length * CLIP_DURATION}s</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Resolution:</span>
                <span className="font-semibold">{aspectRatio === "9:16" ? "1080 × 1920" : "1920 × 1080"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Logo:</span>
                <span className="font-semibold">{logo ? "✓" : "—"}</span>
              </div>
            </div>

            {/* Generate button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 sm:justify-end">
              {images.length < 2 && images.length > 0 && (
                <p className="text-xs text-amber-500 text-center sm:text-left">Add at least one more image</p>
              )}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || images.length < 2 || !propertyName.trim()}
                data-walkthrough-target="vt-generate"
                className="h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow transition-shadow w-full sm:w-auto"
                size="lg"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Generate Property Video · {creditCost} credits
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress / Result Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => {
        if (!open && (step === "completed" || step === "failed")) {
          setShowResultDialog(false);
          setStep("idle");
        }
      }}>
        <DialogContent className="p-0 overflow-hidden border-0 bg-gradient-to-b from-card to-background shadow-2xl sm:max-w-4xl rounded-2xl max-h-[90vh] overflow-y-auto">
          {/* Generating state */}
          {isGenerating && (
            <div className="p-5 sm:p-8 md:p-10">
              {/* Header */}
              <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-8">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-primary animate-ping opacity-40" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight truncate">Creating Your Property Video</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">{statusMessage}</p>
                </div>
              </div>

              {/* Video preview placeholder */}
              <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-muted/80 to-muted/30 aspect-video mb-5 sm:mb-8 flex items-center justify-center border border-border/50 backdrop-blur-sm relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.05)_0%,transparent_70%)]" />
                <div className="text-center relative z-10">
                  <div className="relative mx-auto mb-3 sm:mb-4 w-12 h-12 sm:w-16 sm:h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse" />
                    <div className="absolute inset-2 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Film className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-foreground font-semibold">Rendering your video...</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{Math.round(progress)}% complete</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative mb-5 sm:mb-8">
                <div className="h-1.5 sm:h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-primary/80 transition-all duration-700 ease-out relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
                  </div>
                </div>
              </div>

              {/* Pipeline steps - stack on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                {PIPELINE_STEPS.map(({ key, label, icon: Icon }) => {
                  const stepsOrder: string[] = PIPELINE_STEPS.map(s => s.key);
                  const currentIdx = stepsOrder.indexOf(step);
                  const stepIdx = stepsOrder.indexOf(key);
                  const isDone = stepIdx < currentIdx;
                  const isCurrent = key === step;

                  return (
                    <div
                      key={key}
                      className={`rounded-xl border p-2.5 sm:p-3.5 flex sm:flex-col items-center sm:text-center gap-3 sm:gap-0 transition-all duration-500 ${
                        isCurrent
                          ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/10"
                          : isDone
                          ? "border-primary/20 bg-primary/5"
                          : "border-border/50 bg-muted/20"
                      }`}
                    >
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:mx-auto sm:mb-2 flex items-center justify-center shrink-0 transition-all ${
                        isCurrent
                          ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm"
                          : isDone
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <span className={`text-xs font-medium ${
                        isCurrent ? "text-primary" : isDone ? "text-primary/80" : "text-muted-foreground"
                      }`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed state */}
          {step === "completed" && resultUrl && (
            <div className="flex flex-col h-full">
              {/* Video player area */}
              <div className="relative bg-black aspect-video">
                <video
                  ref={videoRef}
                  src={resultUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              </div>

              {/* Bottom panel */}
              <div className="p-4 sm:p-6 bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-foreground truncate">Your Property Video Is Ready</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {propertyName} · {images.length * CLIP_DURATION}s · 1920×1080
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button onClick={gate(handleDownload)} className="flex-1 h-10 sm:h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/20 transition-all font-semibold text-sm">
                    {canExport ? <Download className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                    {canExport ? "Download MP4" : "Unlock to Download"}
                  </Button>
                  <Button variant="outline" onClick={handleReset} className="flex-1 h-10 sm:h-11 rounded-xl border-2 border-emerald-700 text-emerald-700 hover:bg-emerald-700/10 text-sm">
                    <RotateCcw className="w-4 h-4 mr-2" /> Generate New Video
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Failed state */}
          {step === "failed" && (
            <div className="p-5 sm:p-8 md:p-10 text-center">
              <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-destructive/5 to-muted/30 aspect-video mb-5 sm:mb-8 flex items-center justify-center border border-destructive/20">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-destructive" />
                  </div>
                  <p className="text-destructive font-bold text-base sm:text-lg">Generation Failed</p>
                  <p className="text-muted-foreground text-xs sm:text-sm mt-2 max-w-sm mx-auto px-4">{statusMessage}</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleReset} className="rounded-xl h-10 sm:h-11 px-6">
                <RotateCcw className="w-4 h-4 mr-2" /> Try Again
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CreditsPurchaseDialog open={showCreditsDialog} onOpenChange={setShowCreditsDialog} />
      <UnlockDialog open={unlockOpen} onOpenChange={setUnlockOpen} />
      </div>
    </div>
  );
};

export default VirtualTourStudio;
