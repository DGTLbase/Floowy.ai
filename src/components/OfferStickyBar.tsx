import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Zap, ChevronRight } from "lucide-react";
import { EURO1_OFFER } from "@/lib/stripe-config";
import { supabase } from "@/integrations/supabase/client";

/**
 * Global sticky promo bar (Section 2).
 * "Launch your first creative for €1" — the whole bar is a clickable CTA that
 * sends the user straight into the signup flow with the €1 offer attached.
 * Rendered inside the shared sticky header (see Navigation) so it stays fixed
 * during scroll on every marketing page, on both desktop and mobile.
 *
 * Gated to NON-existing users only: the €1 acquisition offer is shown to
 * logged-out visitors and hidden from anyone with an account/session.
 */
const OfferStickyBar = () => {
  const { pathname } = useLocation();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setLoggedIn(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Never on the admin panel (admins use their own auth and would otherwise
  // see the logged-out acquisition bar there).
  if (pathname.startsWith("/admin")) return null;

  // Show only to logged-out visitors. While the session is still resolving
  // (null) keep it hidden so existing users never see a flash of the offer.
  if (loggedIn !== false) return null;

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
