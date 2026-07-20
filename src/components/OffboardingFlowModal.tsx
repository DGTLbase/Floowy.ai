import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Pause, AlertTriangle, Check, X, PartyPopper, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * Multi-step offboarding / retention flow (per the offboarding mockup). The
 * "stay" action is coral on every step and the cancel path stays visible and
 * reachable throughout — persuading without obstructing (EU/NL compliance).
 * Steps: 0 reason · 1 save offer · 2 pause · 3 loss aversion · 4 confirm · 5 done.
 */

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired after a successful cancellation so the page can refresh. */
  onCancelled?: () => void;
  /** Fired after the user stays (discount / pause / reactivate). */
  onKept?: () => void;
  /** Optional usage stats for the loss-aversion step. */
  usage?: { visuals: number; hours: number; campaigns: number };
}

const REASONS = [
  { value: "expensive", label: "Too expensive" },
  { value: "usage", label: "Not using it enough" },
  { value: "feature", label: "Missing a feature I need" },
  { value: "quality", label: "Output quality not good enough" },
  { value: "switch", label: "Switching to another tool" },
  { value: "tech", label: "Technical issues or bugs" },
  { value: "other", label: "Other" },
];

const VISIBLE_STEPS = 5; // progress dots for steps 0..4 (step 5 is the end state)

const OffboardingFlowModal = ({ open, onOpenChange, onCancelled, onKept, usage }: Props) => {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [reason, setReason] = useState("expensive");
  const [otherText, setOtherText] = useState("");
  const [otherErr, setOtherErr] = useState(false);
  const [busy, setBusy] = useState<null | "discount" | "pause" | "cancel" | "reactivate">(null);

  const stats = usage ?? { visuals: 214, hours: 38, campaigns: 12 };

  const reset = () => {
    setStep(0);
    setReason("expensive");
    setOtherText("");
    setOtherErr(false);
    setBusy(null);
  };

  const close = () => {
    onOpenChange(false);
    // Delay reset so the closing animation doesn't flash step 0.
    setTimeout(reset, 250);
  };

  const stay = (msg?: string) => {
    if (msg) toast({ title: msg });
    onKept?.();
    close();
  };

  const continueFromReason = () => {
    if (reason === "other" && !otherText.trim()) {
      setOtherErr(true);
      return;
    }
    setStep(1);
  };

  const acceptDiscount = async () => {
    setBusy("discount");
    try {
      const { data, error } = await supabase.functions.invoke("apply-retention-discount");
      if (error) throw error;
      if (data?.success) {
        stay("Discount applied — welcome back! 🎉");
      } else {
        toast({ title: "Could not apply discount", description: data?.error || "Please contact support.", variant: "destructive" });
        setBusy(null);
      }
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to apply discount. Please try again.", variant: "destructive" });
      setBusy(null);
    }
  };

  const pausePlan = async () => {
    setBusy("pause");
    try {
      const { data, error } = await supabase.functions.invoke("pause-subscription");
      if (error) throw error;
      if (data?.success) {
        stay("Your plan is paused. Come back anytime — nothing charged while paused.");
      } else {
        toast({ title: "Could not pause", description: data?.error || "Please contact support.", variant: "destructive" });
        setBusy(null);
      }
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to pause your plan. Please try again.", variant: "destructive" });
      setBusy(null);
    }
  };

  const confirmCancel = async () => {
    setBusy("cancel");
    try {
      const details = reason === "other" ? otherText.trim() : otherText.trim() || undefined;
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: { reason, details },
      });
      if (error) throw error;
      if (data?.success) {
        onCancelled?.();
        setBusy(null);
        setStep(5);
      } else {
        toast({ title: "Could not cancel", description: data?.error || "Please contact support.", variant: "destructive" });
        setBusy(null);
      }
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to cancel. Please try again.", variant: "destructive" });
      setBusy(null);
    }
  };

  const reactivate = async () => {
    setBusy("reactivate");
    try {
      const { data, error } = await supabase.functions.invoke("reactivate-subscription");
      if (error) throw error;
      if (data?.success) {
        stay("Your plan is reactivated. Welcome back! 🎉");
      } else {
        toast({ title: "Could not reactivate", description: data?.error || "Please contact support.", variant: "destructive" });
        setBusy(null);
      }
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to reactivate. Please try again.", variant: "destructive" });
      setBusy(null);
    }
  };

  const RetainBtn = ({ children, onClick, loading }: { children: React.ReactNode; onClick?: () => void; loading?: boolean }) => (
    <Button
      onClick={onClick}
      disabled={!!busy}
      size="lg"
      className="w-full bg-offer text-offer-foreground hover:bg-offer-hover active:bg-offer-hover shadow-glow font-bold"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </Button>
  );

  const SecondaryBtn = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button
      onClick={onClick}
      disabled={!!busy}
      className="w-full py-2 text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50"
    >
      {children}
    </button>
  );

  const Dots = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: VISIBLE_STEPS }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all",
            i === Math.min(step, VISIBLE_STEPS - 1) ? "w-10 bg-primary" : i < step ? "w-6 bg-primary/40" : "w-6 bg-muted",
          )}
        />
      ))}
    </div>
  );

  const Circle = ({ tone, children }: { tone: "gift" | "warn" | "pause"; children: React.ReactNode }) => (
    <div
      className={cn(
        "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full",
        tone === "gift" && "bg-accent text-primary",
        tone === "warn" && "bg-offer-soft text-offer-hover",
        tone === "pause" && "bg-sky-500/15 text-sky-500",
      )}
    >
      {children}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        {step < 5 && <Dots />}

        {/* STEP 0 — reason */}
        {step === 0 && (
          <div>
            <h2 className="text-center text-2xl font-extrabold tracking-tight">Before you go</h2>
            <p className="mx-auto mt-2 max-w-sm text-center text-sm text-muted-foreground">
              Tell us what is not working. We will try to fix it in one step.
            </p>
            <div className="mt-5 flex flex-col">
              {REASONS.map((r) => (
                <label
                  key={r.value}
                  className="flex cursor-pointer items-center gap-3 border-b border-border py-3 text-[15px] last:border-b-0"
                >
                  <input
                    type="radio"
                    name="offb-reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => {
                      setReason(r.value);
                      if (r.value !== "other") setOtherErr(false);
                    }}
                    className="h-4 w-4 accent-black dark:accent-white"
                  />
                  {r.label}
                </label>
              ))}
            </div>
            {reason === "other" && (
              <div className="mt-3">
                <Textarea
                  value={otherText}
                  onChange={(e) => {
                    setOtherText(e.target.value);
                    if (e.target.value.trim()) setOtherErr(false);
                  }}
                  placeholder="Please tell us what did not work. This helps us fix it."
                  className={cn("min-h-[82px] resize-y", otherErr && "border-offer-hover bg-offer-soft")}
                />
                {otherErr && (
                  <p className="mt-1.5 text-xs font-semibold text-offer-hover">
                    Please let us know what went wrong before you continue.
                  </p>
                )}
              </div>
            )}
            <div className="mt-6 flex flex-col gap-2.5">
              <RetainBtn onClick={() => stay()}>Keep my subscription</RetainBtn>
              <SecondaryBtn onClick={continueFromReason}>Continue</SecondaryBtn>
            </div>
          </div>
        )}

        {/* STEP 1 — save offer */}
        {step === 1 && (
          <div>
            <Circle tone="gift"><Gift className="h-7 w-7" /></Circle>
            <h2 className="text-center text-2xl font-extrabold tracking-tight">A special offer, just for you</h2>
            <p className="mx-auto mt-2 max-w-sm text-center text-sm text-muted-foreground">
              We would love you to stay. Keep everything at a lower price.
            </p>
            <div className="mt-5 rounded-2xl border border-primary/20 bg-gradient-to-b from-background to-accent/40 p-6 text-center">
              <span className="inline-block rounded-full bg-primary px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
                Special offer
              </span>
              <div className="mt-2.5 text-4xl font-extrabold tracking-tight text-offer-hover">20% off</div>
              <div className="text-base font-bold">on your current plan, for 3 months</div>
              <p className="mt-2 text-sm text-muted-foreground">Same credits, same studios, same saved work.</p>
            </div>
            <div className="mt-6 flex flex-col gap-2.5">
              <RetainBtn onClick={acceptDiscount} loading={busy === "discount"}>
                <Gift className="h-4 w-4" /> Accept 20% off &amp; stay
              </RetainBtn>
              <SecondaryBtn onClick={() => setStep(2)}>No thanks, continue</SecondaryBtn>
            </div>
          </div>
        )}

        {/* STEP 2 — pause */}
        {step === 2 && (
          <div>
            <Circle tone="pause"><Pause className="h-7 w-7" /></Circle>
            <h2 className="text-center text-2xl font-extrabold tracking-tight">Not ready right now? Pause instead</h2>
            <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground">
              Freeze your plan for up to 3 months. You keep your library and pay nothing while paused.
            </p>
            <div className="mt-5 rounded-xl bg-muted/50 p-5">
              <h4 className="mb-2.5 text-[13px] font-bold">While paused you keep</h4>
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                {["All your saved generations and history", "Your current price when you return", "Your account and settings"].map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-primary" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 flex flex-col gap-2.5">
              <Button
                onClick={pausePlan}
                disabled={!!busy}
                size="lg"
                variant="outline"
                className="w-full border-primary/40 font-bold text-primary hover:bg-primary/10"
              >
                {busy === "pause" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pause my plan instead"}
              </Button>
              <SecondaryBtn onClick={() => setStep(3)}>No, continue to cancel</SecondaryBtn>
            </div>
          </div>
        )}

        {/* STEP 3 — loss aversion + usage */}
        {step === 3 && (
          <div>
            <Circle tone="warn"><AlertTriangle className="h-7 w-7" /></Circle>
            <h2 className="text-center text-2xl font-extrabold tracking-tight">You will lose your setup</h2>
            <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground">
              Cancelling removes access to everything below at the end of your billing period.
            </p>
            <div className="mt-5 flex gap-3">
              {[
                { n: stats.visuals, l: "visuals created" },
                { n: stats.hours, l: "hours saved" },
                { n: stats.campaigns, l: "campaigns shipped" },
              ].map((s) => (
                <div key={s.l} className="flex-1 rounded-xl bg-accent/40 p-3.5 text-center">
                  <div className="text-2xl font-extrabold tracking-tight text-primary">{s.n}</div>
                  <div className="text-xs text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-offer/20 bg-offer-soft p-5">
              <h4 className="mb-2.5 text-[13px] font-bold text-offer-hover">What you lose</h4>
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                {["All monthly credits", "Access to every AI studio", "Priority generation queue", "Your saved generations and history"].map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <X className="h-4 w-4 shrink-0 text-offer-hover/70" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 flex flex-col gap-2.5">
              <RetainBtn onClick={() => stay()}>Keep everything</RetainBtn>
              <SecondaryBtn onClick={() => setStep(4)}>Continue to cancel</SecondaryBtn>
            </div>
          </div>
        )}

        {/* STEP 4 — final confirm */}
        {step === 4 && (
          <div>
            <Circle tone="warn"><AlertTriangle className="h-7 w-7" /></Circle>
            <h2 className="text-center text-2xl font-extrabold tracking-tight">Are you sure you want to cancel?</h2>
            <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground">
              Your plan stays active until the end of your current billing period. You can come back anytime.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => stay()}
                disabled={!!busy}
                size="lg"
                className="flex-1 bg-offer text-offer-foreground hover:bg-offer-hover shadow-glow font-bold"
              >
                Keep my subscription
              </Button>
              <Button
                onClick={confirmCancel}
                disabled={!!busy}
                size="lg"
                variant="outline"
                className="flex-1 border-border font-bold text-muted-foreground hover:bg-muted/60"
              >
                {busy === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm cancellation"}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5 — cancelled end state */}
        {step === 5 && (
          <div>
            <Circle tone="warn"><PartyPopper className="h-7 w-7" /></Circle>
            <h2 className="text-center text-2xl font-extrabold tracking-tight">Your subscription is cancelled</h2>
            <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground">
              You keep access until your billing period ends. Changed your mind? You can reactivate in one click.
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <RetainBtn onClick={reactivate} loading={busy === "reactivate"}>
                <Sparkles className="h-4 w-4" /> Reactivate my plan
              </RetainBtn>
              <SecondaryBtn onClick={close}>Close</SecondaryBtn>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OffboardingFlowModal;
