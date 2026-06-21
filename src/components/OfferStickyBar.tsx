import { Link } from "react-router-dom";
import { Zap, ChevronRight } from "lucide-react";
import { EURO1_OFFER } from "@/lib/stripe-config";

/**
 * Global sticky promo bar (Section 2).
 * "Launch your first creative for €1" — the whole bar is a clickable CTA that
 * sends the user straight into the signup flow with the €1 offer attached.
 * Rendered inside the shared sticky header (see Navigation) so it stays fixed
 * during scroll on every marketing page, on both desktop and mobile.
 */
const OfferStickyBar = () => {
  return (
    <Link
      to={EURO1_OFFER.signupHref}
      aria-label={`${EURO1_OFFER.stickyText} — start now`}
      className="group sticky top-0 z-[60] flex h-10 w-full items-center justify-center gap-2 sm:gap-3 bg-primary px-4 text-center text-primary-foreground"
    >
      <Zap className="w-4 h-4 text-primary-foreground shrink-0" />
      <span className="text-xs sm:text-sm font-medium">
        {EURO1_OFFER.stickyText}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground text-primary text-xs font-bold px-3 py-1 transition-transform group-hover:translate-x-0.5">
        Try Now
        <ChevronRight className="w-3.5 h-3.5" />
      </span>
    </Link>
  );
};

export default OfferStickyBar;
