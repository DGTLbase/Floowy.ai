import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { EURO1_OFFER } from "@/lib/stripe-config";
import { useCountdown } from "@/hooks/useCountdown";

const pad = (n: number) => String(n).padStart(2, "0");

const Unit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="bg-foreground text-background rounded-xl w-14 h-14 md:w-16 md:h-16 flex items-center justify-center shadow-lg">
      <span className="text-2xl md:text-3xl font-bold tabular-nums">{pad(value)}</span>
    </div>
    <span className="text-[10px] md:text-xs text-muted-foreground mt-1.5 uppercase tracking-wide">{label}</span>
  </div>
);

/**
 * Pricing-page urgency module (Section 3).
 * Perpetual 3-day countdown — resets to 3 days per session. The whole block is
 * a CTA that routes to the €1 signup + purchase flow.
 */
const OfferCountdownSection = () => {
  const { days, hours, minutes, seconds } = useCountdown({
    totalSeconds: EURO1_OFFER.countdownDays * 86400,
    persistKey: EURO1_OFFER.countdownStorageKey,
  });

  return (
    <section className="container mx-auto px-4">
      <Link
        to={EURO1_OFFER.signupHref}
        aria-label="€1 offer — start now"
        className="group block max-w-3xl mx-auto"
      >
        <div className="relative overflow-hidden rounded-2xl border-2 border-accent/40 bg-gradient-to-br from-accent/10 via-background to-primary/5 px-6 py-6 md:px-10 md:py-7 text-center transition-shadow hover:shadow-glow">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-xs md:text-sm font-bold uppercase tracking-wider mb-4 px-4 py-1.5 rounded-full shadow-md">
            <Clock className="w-4 h-4" />
            Limited-time launch offer
          </div>
          <p className="text-lg md:text-xl font-semibold text-foreground mb-4">
            €1 offer expires in
          </p>
          <div className="flex items-center justify-center gap-2 md:gap-3">
            <Unit value={days} label="Days" />
            <span className="text-2xl md:text-3xl font-bold text-muted-foreground pb-5">:</span>
            <Unit value={hours} label="Hours" />
            <span className="text-2xl md:text-3xl font-bold text-muted-foreground pb-5">:</span>
            <Unit value={minutes} label="Min" />
            <span className="text-2xl md:text-3xl font-bold text-muted-foreground pb-5">:</span>
            <Unit value={seconds} label="Sec" />
          </div>
          <span className="mt-5 inline-flex items-center justify-center rounded-full bg-accent text-accent-foreground font-bold text-sm px-6 py-2.5 transition-transform group-hover:scale-105">
            {EURO1_OFFER.ctaLabel}
          </span>
        </div>
      </Link>
    </section>
  );
};

export default OfferCountdownSection;
