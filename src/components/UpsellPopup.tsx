import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, AlertTriangle, Gift, Play, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Upsell } from "@/lib/upsell-catalog";

/**
 * Contextual in-app upsell popup (In-app upsells briefing). Small, centered,
 * always dismissible, never blocks the canvas. Three escalating steps on each
 * dismiss: offer → are-you-sure (loss aversion) → 42% first-month → upgraded.
 * Coral is the Upgrade action; dismiss is a quiet text link. No €1 trial here.
 */

interface Props {
  upsell: Upsell;
  open: boolean;
  /** Called when the popup is closed without upgrading (with the step reached). */
  onDismiss: (stepReached: number) => void;
  /** Perform the upgrade; `discounted` = apply the 42% first-month coupon. Returns success. */
  onUpgrade: (discounted: boolean) => Promise<boolean>;
  /** Open the unlocked studio after a successful upgrade. */
  onOpenStudio: () => void;
}

const UpsellPopup = ({ upsell, open, onDismiss, onUpgrade, onOpenStudio }: Props) => {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const dismiss = () => onDismiss(step);

  const upgrade = async (discounted: boolean) => {
    setBusy(true);
    const ok = await onUpgrade(discounted);
    setBusy(false);
    if (ok) setStep(3);
  };

  const UpgradeBtn = ({ label, discounted }: { label: string; discounted: boolean }) => (
    <Button
      onClick={() => upgrade(discounted)}
      disabled={busy}
      size="lg"
      className="w-full bg-offer text-offer-foreground hover:bg-offer-hover active:bg-offer-hover shadow-glow font-bold"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
    </Button>
  );
  const Dismiss = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button onClick={onClick} disabled={busy} className="w-full py-1.5 text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50">
      {label}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && dismiss()}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
        {/* STEP 0 — contextual offer */}
        {step === 0 && (
          <div>
            <div className="relative mb-4 flex h-72 items-end overflow-hidden rounded-xl bg-gradient-to-br from-[#8A8170] to-[#C9C3B4] p-3">
              {upsell.previewVideo ? (
                <video
                  src={upsell.previewVideo}
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-white/90">
                  <Play className="h-8 w-8" />
                </span>
              )}
              <span className="relative z-10 rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-bold text-white">{upsell.previewLabel}</span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">{upsell.eyebrow}</p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight">{upsell.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{upsell.lead}</p>
            <div className="mt-4 rounded-xl bg-muted/50 p-4">
              <h4 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Upgrade unlocks</h4>
              <ul className="flex flex-col gap-2 text-sm">
                {upsell.unlocks.map((u) => (
                  <li key={u} className="flex items-center gap-2.5"><Check className="h-4 w-4 shrink-0 text-primary" /> {u}</li>
                ))}
              </ul>
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {upsell.planName} <span className="font-bold text-foreground">€{upsell.price}/mo</span>
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <UpgradeBtn label={`Upgrade to ${upsell.planName}`} discounted={false} />
              <Dismiss label="Not now" onClick={() => setStep(1)} />
            </div>
          </div>
        )}

        {/* STEP 1 — are you sure (loss aversion) */}
        {step === 1 && (
          <div>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-offer-soft text-offer-hover">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-center text-xl font-extrabold tracking-tight">Sure? You keep missing this</h2>
            <p className="mx-auto mt-2 max-w-sm text-center text-sm text-muted-foreground">
              On {upsell.planName === "Starter" ? "Lite" : "your current plan"} these stay locked, including the tools you would use next.
            </p>
            <div className="mt-4 rounded-xl border border-offer/20 bg-offer-soft p-4">
              <h4 className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-offer-hover">Still locked</h4>
              <ul className="flex flex-col gap-2 text-sm">
                {upsell.stillLocked.map((f) => (
                  <li key={f} className="flex items-center gap-2.5"><X className="h-4 w-4 shrink-0 text-offer-hover" /> {f}</li>
                ))}
              </ul>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <UpgradeBtn label={`Upgrade to ${upsell.planName}`} discounted={false} />
              <Dismiss label="Maybe later" onClick={() => setStep(2)} />
            </div>
          </div>
        )}

        {/* STEP 2 — last-chance 42% off */}
        {step === 2 && (
          <div>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-offer-soft text-offer-hover">
              <Gift className="h-6 w-6" />
            </div>
            <p className="text-center text-[11px] font-bold uppercase tracking-wider text-primary">One-time upgrade offer</p>
            <h2 className="mt-1 text-center text-xl font-extrabold tracking-tight">Get 42% off for 3 months</h2>
            <p className="mx-auto mt-2 max-w-sm text-center text-sm text-muted-foreground">
              Upgrade to {upsell.planName} now and pay 42% less for 3 months. {upsell.previewLabel} unlocks straight away.
            </p>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <span className="line-through">€{upsell.price}</span>{" "}
              <span className="font-bold text-foreground">€{upsell.discountedPrice}</span>/mo for 3 months, then €{upsell.price}/mo
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <UpgradeBtn label="Upgrade with 42% off" discounted={true} />
              <Dismiss label="No thanks" onClick={dismiss} />
            </div>
          </div>
        )}

        {/* STEP 3 — upgraded */}
        {step === 3 && (
          <div>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
              <Check className="h-6 w-6" />
            </div>
            <h2 className="text-center text-xl font-extrabold tracking-tight">You're on {upsell.planName}</h2>
            <p className="mx-auto mt-2 max-w-sm text-center text-sm text-muted-foreground">
              {upsell.previewLabel} is unlocked. Let's put your new tools to work.
            </p>
            <div className="mt-4">
              <Button onClick={onOpenStudio} size="lg" className="w-full bg-offer text-offer-foreground hover:bg-offer-hover shadow-glow font-bold">
                Open now <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpsellPopup;
