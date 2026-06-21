import { Gift, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PERSONAL_PROMO } from "@/lib/stripe-config";
import { useCountdown } from "@/hooks/useCountdown";

const pad = (n: number) => String(n).padStart(2, "0");

interface PersonalDiscountModalProps {
  open: boolean;
  onClose: () => void;
  /** Fired when the user claims the discount — should proceed to the €1 payment step. */
  onClaim: () => void;
}

/**
 * Section 9 — "You're in 5%" personal-discount popup.
 * Shown immediately after account creation, before the €1 payment step.
 * The promocode is auto-applied (cosmetic in Phase 1; wired to a Stripe coupon
 * in Phase 2 via PERSONAL_PROMO.couponId).
 */
const PersonalDiscountModal = ({ open, onClose, onClaim }: PersonalDiscountModalProps) => {
  const { minutes, seconds } = useCountdown({
    totalSeconds: PERSONAL_PROMO.countdownSeconds,
    persistKey: "floowy_personal_promo_countdown",
  });

  if (!open) return null;

  const pct = PERSONAL_PROMO.discountPct;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-3xl bg-[#0d0d0d] border border-white/10 shadow-2xl overflow-hidden animate-fade-in">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <p className="text-sm text-white/90 flex items-center gap-2">
            <span>🎁</span> Congrats, you are in 5% who receives this offer
          </p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-7 text-center">
          {/* Gift icon */}
          <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow">
            <Gift className="w-10 h-10 text-primary-foreground" />
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold uppercase leading-tight text-white mb-3">
            You're in 5% who received this personal{" "}
            <span className="text-primary-glow">{pct}% off</span> with Floowy{" "}
            <span className="text-primary-glow">Pro Unlimited</span>
          </h2>

          <p className="text-sm text-white/60 mb-6">
            This offer is active for limited time only. Get Premium plans with {pct}% OFF
          </p>

          {/* Promo + stats block */}
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-sm text-white/90 pb-3 border-b border-dashed border-white/15">
              <Check className="w-4 h-4 text-primary-glow" />
              <span className="font-semibold">{PERSONAL_PROMO.code}</span>
              <span className="text-white/50">promocode is applied</span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-white/10 pt-4">
              <div>
                <div className="text-2xl font-extrabold text-primary-glow">{pct}% OFF</div>
                <div className="text-[11px] text-white/40 mt-1">With limited-offer promo</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white tabular-nums">
                  {pad(minutes)} : {pad(seconds)}
                </div>
                <div className="text-[11px] text-white/40 mt-1">minutes : seconds</div>
              </div>
            </div>
          </div>

          <Button
            onClick={onClaim}
            className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-bold hover:opacity-90 h-12 text-base rounded-xl"
          >
            Claim Discount
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PersonalDiscountModal;
