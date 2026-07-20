import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, AlertTriangle, X, Loader2, ArrowRight, CalendarClock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe-config";
import { lostFeaturesOnDowngrade, type PaidTier } from "@/lib/tier-access";

/**
 * Downgrade retention flow (per the downgrade briefing/mockup). Making a
 * downgrade a few deliberate steps with strong loss aversion and a real
 * alternative — never obstructing. Coral is the "keep current plan" action on
 * every step; the downgrade path stays visible. The change only takes effect at
 * the NEXT billing date (Stripe subscription schedule), so the user keeps their
 * current features until then. What-you-lose is computed from the tier matrix.
 */

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: PaidTier;
  targetPlan: PaidTier;
  /** Cycle-resolved Stripe price id for the target plan. */
  targetPriceId: string;
  /** Fired after the plan is scheduled to change, or after the user keeps it. */
  onChanged?: () => void;
  /** Usage of the about-to-be-lost features for the loss-aversion step. */
  usage?: { videoRenders: number; scraperRuns: number; images: number };
}

const VISIBLE_STEPS = 4; // dots for steps 0..3 (4 processing, 5 end)

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const DowngradeFlowModal = ({ open, onOpenChange, currentPlan, targetPlan, targetPriceId, onChanged, usage }: Props) => {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState<null | "discount" | "downgrade" | "undo">(null);

  const curName = cap(currentPlan);
  const tgtName = cap(targetPlan);
  const curPrice = SUBSCRIPTION_PLANS[currentPlan]?.monthly.price ?? 0;
  const tgtPrice = SUBSCRIPTION_PLANS[targetPlan]?.monthly.price ?? 0;
  const curCredits = SUBSCRIPTION_PLANS[currentPlan]?.monthly.credits ?? 0;
  const tgtCredits = SUBSCRIPTION_PLANS[targetPlan]?.monthly.credits ?? 0;
  const creditsLost = Math.max(0, curCredits - tgtCredits);
  const curImages = Math.round(curCredits / 2);
  const tgtImages = Math.round(tgtCredits / 2);
  const imagesLost = Math.max(0, curImages - tgtImages);
  const lostFeatures = lostFeaturesOnDowngrade(currentPlan, targetPlan);
  const discounted = Math.round(curPrice * 0.8);
  const stats = usage ?? { videoRenders: 14, scraperRuns: 22, images: 47 };

  const reset = () => { setStep(0); setBusy(null); };
  const close = () => { onOpenChange(false); setTimeout(reset, 250); };
  const keep = (msg?: string) => { if (msg) toast({ title: msg }); onChanged?.(); close(); };

  const acceptDiscount = async () => {
    setBusy("discount");
    try {
      const { data, error } = await supabase.functions.invoke("apply-retention-discount");
      if (error) throw error;
      if (data?.success) keep(`20% off applied — you're staying on ${curName}. 🎉`);
      else { toast({ title: "Could not apply discount", description: data?.error || "Please contact support.", variant: "destructive" }); setBusy(null); }
    } catch { toast({ title: "Error", description: "Failed to apply discount. Please try again.", variant: "destructive" }); setBusy(null); }
  };

  const confirmDowngrade = async () => {
    setBusy("downgrade");
    setStep(4); // processing
    try {
      const { data, error } = await supabase.functions.invoke("schedule-downgrade", { body: { priceId: targetPriceId } });
      if (error) throw error;
      if (data?.success) { onChanged?.(); setBusy(null); setStep(5); }
      else { toast({ title: "Could not schedule downgrade", description: data?.error || "Please contact support.", variant: "destructive" }); setBusy(null); setStep(3); }
    } catch { toast({ title: "Error", description: "Failed to schedule the downgrade. Please try again.", variant: "destructive" }); setBusy(null); setStep(3); }
  };

  const undo = async () => {
    setBusy("undo");
    try {
      const { data, error } = await supabase.functions.invoke("undo-downgrade");
      if (error) throw error;
      if (data?.success) keep(`Downgrade cancelled — you're staying on ${curName}.`);
      else { toast({ title: "Could not undo", description: data?.error || "Please contact support.", variant: "destructive" }); setBusy(null); }
    } catch { toast({ title: "Error", description: "Failed to undo. Please try again.", variant: "destructive" }); setBusy(null); }
  };

  const RetainBtn = ({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
    <Button onClick={onClick} disabled={!!busy} size="lg" className={cn("bg-offer text-offer-foreground hover:bg-offer-hover active:bg-offer-hover shadow-glow font-bold", className)}>
      {children}
    </Button>
  );
  const SecondaryBtn = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} disabled={!!busy} className="w-full py-2 text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50">
      {children}
    </button>
  );
  const Dots = () => (
    <div className="mb-6 flex items-center justify-center gap-2">
      {Array.from({ length: VISIBLE_STEPS }).map((_, i) => (
        <span key={i} className={cn("h-1.5 rounded-full transition-all", i === Math.min(step, VISIBLE_STEPS - 1) ? "w-10 bg-primary" : i < step ? "w-6 bg-primary/40" : "w-6 bg-muted")} />
      ))}
    </div>
  );
  const Circle = ({ tone, children }: { tone: "gift" | "warn"; children: React.ReactNode }) => (
    <div className={cn("mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full", tone === "gift" ? "bg-accent text-primary" : "bg-offer-soft text-offer-hover")}>{children}</div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        {step < 4 && <Dots />}

        {/* STEP 0 — what you lose */}
        {step === 0 && (
          <div>
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="rounded-xl border border-primary/20 bg-accent/40 px-4 py-2.5 text-center">
                <div className="text-sm font-bold">{curName}</div>
                <div className="text-xs text-muted-foreground">€{curPrice}/mo</div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <div className="rounded-xl border border-border px-4 py-2.5 text-center">
                <div className="text-sm font-bold">{tgtName}</div>
                <div className="text-xs text-muted-foreground">€{tgtPrice}/mo</div>
              </div>
            </div>
            <h2 className="text-center text-2xl font-extrabold tracking-tight">Downgrade to {tgtName}?</h2>
            <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground">
              {tgtName} is lighter. Here is what you give up if you move down.
            </p>
            <div className="mt-4 rounded-xl border border-offer/20 bg-offer-soft p-5">
              <h4 className="mb-3 text-[12px] font-bold uppercase tracking-wider text-offer-hover">You will lose</h4>
              <ul className="flex flex-col gap-2.5 text-sm text-foreground">
                {creditsLost > 0 && (
                  <li className="flex items-start gap-2.5"><X className="mt-0.5 h-4 w-4 shrink-0 text-offer-hover" /> {creditsLost} monthly credits ({curCredits} drops to {tgtCredits})</li>
                )}
                {imagesLost > 0 && (
                  <li className="flex items-start gap-2.5"><X className="mt-0.5 h-4 w-4 shrink-0 text-offer-hover" /> {imagesLost} images per month (up to {curImages} drops to up to {tgtImages})</li>
                )}
                {lostFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2.5"><X className="mt-0.5 h-4 w-4 shrink-0 text-offer-hover" /> {f}</li>
                ))}
              </ul>
            </div>
            <div className="mt-6 flex flex-col gap-2.5">
              <RetainBtn onClick={() => keep()} className="w-full">Keep my {curName} plan</RetainBtn>
              <SecondaryBtn onClick={() => setStep(1)}>Continue downgrade</SecondaryBtn>
            </div>
          </div>
        )}

        {/* STEP 1 — alternative offer */}
        {step === 1 && (
          <div>
            <Circle tone="gift"><Gift className="h-7 w-7" /></Circle>
            <h2 className="text-center text-2xl font-extrabold tracking-tight">Stay on {curName}, for less</h2>
            <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground">
              Before you drop features, keep everything you have at a lower price.
            </p>
            <div className="mt-4 rounded-2xl border border-primary/20 bg-gradient-to-b from-background to-accent/40 p-6 text-center">
              <span className="inline-block rounded-full bg-primary px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">Special offer</span>
              <div className="mt-2.5 text-4xl font-extrabold tracking-tight text-offer-hover">20% off</div>
              <div className="text-base font-bold">{curName} for €{discounted}/mo, for 3 months</div>
              <p className="mt-2 text-sm text-muted-foreground">Keep all your credits, studios and features.</p>
            </div>
            <div className="mt-6 flex flex-col gap-2.5">
              <RetainBtn onClick={acceptDiscount} className="w-full">
                {busy === "discount" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Gift className="h-4 w-4" /> Keep {curName} with 20% off</>}
              </RetainBtn>
              <SecondaryBtn onClick={() => setStep(2)}>No thanks, continue</SecondaryBtn>
            </div>
          </div>
        )}

        {/* STEP 2 — loss aversion + usage */}
        {step === 2 && (
          <div>
            <Circle tone="warn"><AlertTriangle className="h-7 w-7" /></Circle>
            <h2 className="text-center text-2xl font-extrabold tracking-tight">You actively use these</h2>
            <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground">
              This month you leaned on the exact features {tgtName} does not include.
            </p>
            <div className="mt-4 flex gap-3">
              {[
                { n: stats.videoRenders, l: "Video Studio renders" },
                { n: stats.scraperRuns, l: "Social Scraper runs" },
                { n: stats.images, l: "images generated" },
              ].map((s) => (
                <div key={s.l} className="flex-1 rounded-xl bg-accent/40 p-3.5 text-center">
                  <div className="text-2xl font-extrabold tracking-tight text-primary">{s.n}</div>
                  <div className="text-xs leading-tight text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
            <p className="mt-3.5 text-center text-sm text-foreground">
              On {tgtName} you would have hit your limit and <span className="font-semibold text-offer-hover">lost the features you rely on</span>.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <RetainBtn onClick={() => keep()} className="w-full">Keep my plan</RetainBtn>
              <SecondaryBtn onClick={() => setStep(3)}>Continue downgrade</SecondaryBtn>
            </div>
          </div>
        )}

        {/* STEP 3 — final confirm */}
        {step === 3 && (
          <div>
            <Circle tone="warn"><AlertTriangle className="h-7 w-7" /></Circle>
            <h2 className="text-center text-2xl font-extrabold tracking-tight">Confirm downgrade to {tgtName}</h2>
            <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground">One last check before we change your plan.</p>
            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
              Your plan changes from <span className="font-semibold text-foreground">{curName}</span> to <span className="font-semibold text-foreground">{tgtName}</span> on your <span className="font-semibold text-foreground">next billing date</span>. You keep all {curName} features until then. After that you drop to <span className="font-semibold text-foreground">{tgtCredits} credits</span>{lostFeatures.length > 0 && <> and lose <span className="font-semibold text-foreground">{lostFeatures.length} feature{lostFeatures.length > 1 ? "s" : ""}</span></>}.
            </div>
            <div className="mt-6 flex gap-3">
              <RetainBtn onClick={() => keep()} className="flex-1">Keep {curName}</RetainBtn>
              <Button onClick={confirmDowngrade} disabled={!!busy} size="lg" variant="outline" className="flex-1 border-border font-bold text-muted-foreground hover:bg-muted/60">
                Confirm downgrade
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4 — processing */}
        {step === 4 && (
          <div className="py-4 text-center">
            <Circle tone="gift"><Loader2 className="h-7 w-7 animate-spin" /></Circle>
            <h2 className="text-2xl font-extrabold tracking-tight">Processing</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Please wait while we schedule your plan change.</p>
          </div>
        )}

        {/* STEP 5 — downgraded end state */}
        {step === 5 && (
          <div>
            <Circle tone="gift"><CalendarClock className="h-7 w-7" /></Circle>
            <h2 className="text-center text-2xl font-extrabold tracking-tight">Downgrade scheduled</h2>
            <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground">
              You move to {tgtName} on your next billing date. Until then you keep every {curName} feature. Changed your mind? Undo in one click.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <RetainBtn onClick={undo} className="w-full">
                {busy === "undo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4" /> Undo, keep {curName}</>}
              </RetainBtn>
              <SecondaryBtn onClick={close}>Close</SecondaryBtn>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DowngradeFlowModal;
