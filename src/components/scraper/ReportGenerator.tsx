// Report generation UI for the Social Scraper (Scraper Report Briefing v1).
// Two buttons after a scrape — "Create Insights Report" / "Create Contentplan" —
// each plan-gated + credit-priced, opening a short brand/website form. Handles
// the 5-minute bundle-window price (Professional), double-submit protection,
// insufficient-credits + upsell prompts, and download of the resulting PDF.
//
// The backend (generate-report) is the source of truth for gating and price;
// this component mirrors it for display and only ever *shows* estimated prices.

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUpsell } from "@/hooks/useUpsell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { FileText, FileBarChart2, Download, Lock, Loader2, Sparkles, X } from "lucide-react";
import { TIER_NAME } from "@/lib/tier-access";
import {
  REPORTS, REPORT_TYPES, REPORT_LANGUAGES, DEFAULT_REPORT_LANGUAGE,
  canRunReport, reportPrice, bundleWindowRemaining, type ReportType,
} from "@/lib/report-config";

interface Props {
  projectId: string;
  userPlan: string;
  isAdmin: boolean;
  hasData: boolean;
}

type ExistingReport = { id: string; pdf_url: string | null; completed_at: string };

const ICONS: Record<ReportType, typeof FileText> = {
  insights: FileBarChart2,
  contentplan: FileText,
};

// Short display name (REPORTS[*].label is the button copy "Create …").
const NICE: Record<ReportType, string> = {
  insights: "Insights Report",
  contentplan: "Contentplan",
};

const fmtCountdown = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// Pull the real server error out of a supabase.functions.invoke failure (the body
// of a non-2xx lives in the FunctionsHttpError context, not in `data`).
async function invokeError(error: any, data: any): Promise<{ msg: string; code?: string }> {
  if (data?.error) return { msg: String(data.error), code: data.code };
  const ctx = error?.context;
  if (ctx && typeof ctx.clone === "function") {
    try { const b = await ctx.clone().json(); if (b?.error) return { msg: String(b.error), code: b.code }; } catch { /* not json */ }
    try { const t = await ctx.clone().text(); if (t) return { msg: t.slice(0, 400) }; } catch { /* ignore */ }
  }
  return { msg: error?.message ?? "Unknown error" };
}

export default function ReportGenerator({ projectId, userPlan, isAdmin, hasData }: Props) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { showLockedToolUpsell } = useUpsell();

  const [existing, setExisting] = useState<Partial<Record<ReportType, ExistingReport>>>({});
  const [formType, setFormType] = useState<ReportType | null>(null);
  const [brand, setBrand] = useState("");
  const [website, setWebsite] = useState("");
  const [language, setLanguage] = useState<string>(DEFAULT_REPORT_LANGUAGE);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("");
  // Which report is generating (survives the modal closing) + the completed float.
  const [genType, setGenType] = useState<ReportType | null>(null);
  const [done, setDone] = useState<{ type: ReportType; url: string } | null>(null);
  const idemRef = useRef<string>("");
  const genStartRef = useRef<number>(0);

  const loadExisting = useCallback(async () => {
    const { data } = await supabase
      .from("report_generations")
      .select("id, report_type, pdf_url, completed_at")
      .eq("project_id", projectId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false });
    const map: Partial<Record<ReportType, ExistingReport>> = {};
    for (const r of (data ?? []) as any[]) {
      const t = r.report_type as ReportType;
      if (!map[t]) map[t] = { id: r.id, pdf_url: r.pdf_url, completed_at: r.completed_at };
    }
    setExisting(map);
  }, [projectId]);

  useEffect(() => { void loadExisting(); }, [loadExisting]);

  // Tick every second while the form is open so the bundle-window countdown moves.
  useEffect(() => {
    if (!formType) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [formType]);

  // Realtime-feel progress while generating. The Claude render is a single opaque
  // call (no true %), so the bar eases toward ~92% on a time curve and snaps to
  // 100% when the row completes (handled in generate()). Phase labels advance so
  // it reads as real work, not a fake spinner.
  useEffect(() => {
    if (!busy) return;
    genStartRef.current = Date.now();
    setProgress(6);
    setPhase("Reading your scrape data…");
    const t = window.setInterval(() => {
      const el = (Date.now() - genStartRef.current) / 1000;
      // Renders typically take ~2-5 min, so ease slowly (reach ~94% near ~5min).
      const pct = Math.min(94, Math.round(100 * (1 - Math.exp(-el / 130))));
      setProgress((p) => Math.max(p, pct));
      setPhase(
        el < 15 ? "Reading your scrape data…"
          : el < 75 ? "Analyzing themes and top performers…"
            : el < 210 ? "Writing the report…"
              : "Rendering the branded PDF…",
      );
    }, 400);
    return () => window.clearInterval(t);
  }, [busy]);

  const otherCompletedAtMs = (type: ReportType): number | null => {
    const other: ReportType = type === "insights" ? "contentplan" : "insights";
    const c = existing[other]?.completed_at;
    return c ? new Date(c).getTime() : null;
  };
  const priceFor = (type: ReportType) => reportPrice(userPlan, type, otherCompletedAtMs(type), now);
  const windowLeftFor = (type: ReportType) => bundleWindowRemaining(otherCompletedAtMs(type), now);
  const allowed = (type: ReportType) => isAdmin || canRunReport(userPlan, type);

  const openForm = (type: ReportType) => {
    if (!allowed(type)) {
      const shown = showLockedToolUpsell("social-scraper");
      if (!shown) navigate("/payment");
      return;
    }
    idemRef.current = (crypto as any).randomUUID?.() ?? String(Date.now());
    setBrand("");
    setWebsite("");
    setNow(Date.now());
    setProgress(0);
    setPhase("");
    setDone(null);
    setFormType(type);
  };

  // The backend renders in the background and returns 202 { status:"processing" };
  // poll the row (RLS: select-own) until it settles. ~5 min ceiling.
  // Renders can take several minutes; poll generously (240 × 3s = 12 min) so we
  // never give up before the background task finishes.
  const pollReport = async (id: string): Promise<ExistingReport & { status: string; credits_charged?: number; error?: string } | null> => {
    for (let i = 0; i < 240; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const { data } = await supabase
        .from("report_generations")
        .select("id, status, pdf_url, completed_at, credits_charged, error")
        .eq("id", id)
        .maybeSingle();
      if (data && (data as any).status !== "processing") return data as any;
    }
    return null;
  };

  const generate = async () => {
    if (!formType || !brand.trim() || !website.trim() || busy) return;
    const type = formType;
    setBusy(true);
    setGenType(type);   // survives the modal closing → drives the background float
    setDone(null);
    const { data, error } = await supabase.functions.invoke("generate-report", {
      body: {
        reportType: type,
        projectId,
        brandName: brand.trim(),
        websiteUrl: website.trim(),
        language,
        idempotencyKey: idemRef.current,
      },
    });
    // A 402/403 (insufficient credits / wrong plan) comes back as an error body.
    if (error || data?.error || !data?.id) {
      setBusy(false);
      setGenType(null);
      setProgress(0);
      const { msg, code } = await invokeError(error, data);
      const low = code === "insufficient_credits" || /not enough credits/i.test(msg);
      toast({
        title: low ? "Not enough credits" : "Report generation failed",
        description: low ? `${msg} You can top up credits or upgrade your plan.` : msg,
        variant: "destructive",
      });
      return;
    }

    // 202 processing → poll to completion (stub finishes on the first poll).
    let row: any = data;
    if (data.status !== "completed") row = await pollReport(data.id);

    const ok = row && row.status === "completed" && row.pdf_url;
    if (ok) { setProgress(100); setPhase("Done"); }
    setBusy(false);
    setGenType(null);

    if (!ok) {
      setProgress(0);
      toast({
        title: "Report generation failed",
        description: row?.error || "It took too long or failed — you were not charged. Please try again.",
        variant: "destructive",
      });
      await loadExisting();
      return;
    }

    toast({
      title: `${NICE[type]} ready`,
      description: row.credits_charged ? `${row.credits_charged} credits used.` : "Generated.",
    });
    window.dispatchEvent(new Event("credits:refresh"));
    // Show a "ready" float with an explicit Open button rather than auto-opening
    // (a window.open after an async poll is unreliable / popup-blocked). If the
    // modal is still open we close it; the float carries the download.
    setDone({ type, url: row.pdf_url as string });
    setFormType(null);
    await loadExisting();
  };

  const activeMeta = formType ? REPORTS[formType] : null;
  const activePrice = formType ? priceFor(formType) : 0;
  const activeWindow = formType ? windowLeftFor(formType) : 0;
  const bundleActive = formType ? activePrice < REPORTS[formType].credits && activeWindow > 0 : false;

  return (
    <>
      {REPORT_TYPES.map((type) => {
        const meta = REPORTS[type];
        const Icon = ICONS[type];
        const can = allowed(type);
        const price = priceFor(type);
        const has = existing[type];
        const shortLabel = meta.type === "insights" ? "Insights" : "Contentplan";
        if (!can) {
          return (
            <Button
              key={type}
              size="sm"
              variant="outline"
              onClick={() => openForm(type)}
              className="gap-1.5 border-offer/40 text-offer-hover hover:bg-offer-soft"
              title={`${meta.label} — available on ${TIER_NAME[meta.minTier]} and higher`}
            >
              <Lock className="h-3.5 w-3.5" />
              {shortLabel}
              <span className="rounded bg-offer/15 px-1 py-px text-[9px] font-bold uppercase leading-none tracking-wide">
                {TIER_NAME[meta.minTier].slice(0, 3)}
              </span>
            </Button>
          );
        }
        return (
          <div key={type} className="inline-flex items-center">
            <Button
              size="sm"
              variant="outline"
              disabled={!hasData}
              onClick={() => openForm(type)}
              className={has?.pdf_url ? "gap-1.5 rounded-r-none border-r-0" : "gap-1.5"}
              title={!hasData ? "Run a scrape first" : `${meta.label} — ${price} credits`}
            >
              <Icon className="h-3.5 w-3.5" />
              {shortLabel}
              <span className="rounded bg-muted px-1 py-px text-[10px] font-semibold tabular-nums text-muted-foreground">
                {price} cr
              </span>
            </Button>
            {has?.pdf_url && (
              <Button
                size="sm"
                variant="outline"
                className="rounded-l-none px-2 text-muted-foreground hover:text-foreground"
                onClick={() => window.open(has.pdf_url!, "_blank")}
                title={`Download the ${meta.label} PDF`}
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        );
      })}

      <Dialog open={!!formType} onOpenChange={(o) => { if (!o) setFormType(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{activeMeta?.label}</DialogTitle>
            <DialogDescription>
              We&apos;ll turn this scrape into a Floowy-styled PDF. Add your brand details so the report is written for you.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Brand / company name</label>
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. CurlyGirlMovement" autoFocus />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Website URL</label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourbrand.com" />
            </div>

            {/* Report language — required, always has a value, so there is no
                empty state and no separate validation error. */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="report-language">Report language</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="report-language" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Cost</span>
              <span className="font-semibold">
                {activePrice} credits
                {bundleActive && (
                  <span className="ml-2 rounded bg-offer-soft px-1.5 py-0.5 text-[11px] font-semibold text-offer-hover">
                    bundle price · {fmtCountdown(activeWindow)} left
                  </span>
                )}
              </span>
            </div>
          </div>

          {busy && (
            <div className="space-y-1.5 pt-1">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" /> {phase}
                </span>
                <span className="tabular-nums font-medium">{progress}%</span>
              </div>
              <p className="text-center text-[11px] text-muted-foreground/80">
                This can take a minute or two. You can close this — it keeps running in the background.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setFormType(null)}>
              {busy ? "Run in background" : "Cancel"}
            </Button>
            <Button onClick={generate} disabled={busy || !brand.trim() || !website.trim()}>
              {busy ? (
                <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Generating…</>
              ) : (
                <><Sparkles className="mr-1.5 h-4 w-4" /> Generate · {activePrice} cr</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Background float: shows while a report renders after the modal is closed,
          and flips to a "ready" card with an Open button on completion. */}
      {((busy && genType && !formType) || done) && (
        <div className="fixed bottom-4 right-4 z-[70] w-72 rounded-xl border border-border bg-background p-3 shadow-lg">
          {done ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm font-semibold">{NICE[done.type]} ready</span>
                <button
                  className="ml-auto text-muted-foreground hover:text-foreground"
                  onClick={() => setDone(null)}
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={() => { window.open(done.url, "_blank"); setDone(null); }}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" /> Open report
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                <span className="text-sm font-medium">
                  Generating {genType ? NICE[genType] : "report"}…
                </span>
              </div>
              <Progress value={progress} className="h-1.5" />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="truncate">{phase}</span>
                <span className="tabular-nums font-medium">{progress}%</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
