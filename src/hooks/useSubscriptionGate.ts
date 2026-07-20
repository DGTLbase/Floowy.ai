import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { tierMeets, type Tier } from "@/lib/tier-access";

export type GateAccess = "checking" | "allowed";

interface GateOptions {
  /** Skip the check entirely (e.g. admin preview via ?fromAdmin). */
  bypass?: boolean;
  /**
   * Minimum subscription tier required for this area (Tier Briefing). When set,
   * a paid user whose plan is below this tier is redirected to /payment to
   * upgrade. Admins bypass. Undefined = subscription-only gate (any paid tier).
   */
  requiredTier?: Tier;
}

/**
 * Locks a logged-in area behind an active subscription (and optionally a minimum
 * tier). Unpaid, non-admin users are redirected to the €1 offer; paid users
 * below `requiredTier` are redirected to /payment. Admins bypass. Callers render
 * a loader while `checking` so the gated UI never flashes before a redirect.
 *
 * Back-compat: pass a boolean to keep the old `bypass`-only signature.
 */
export const useSubscriptionGate = (opts: boolean | GateOptions = false): GateAccess => {
  const { bypass = false, requiredTier } = typeof opts === "boolean" ? { bypass: opts } : opts;
  const navigate = useNavigate();
  const [access, setAccess] = useState<GateAccess>(bypass ? "allowed" : "checking");

  useEffect(() => {
    if (bypass) {
      setAccess("allowed");
      return;
    }

    let cancelled = false;

    // Hard safety net: a gate must NEVER trap the user on the loader. If the
    // whole check hasn't resolved within 8s (hung auth lock, slow DB, edge
    // function timeout, dropped network), fail open to the app — backend calls
    // still enforce real gating, so this only affects the client-side shell.
    const failOpenTimer = setTimeout(() => {
      if (!cancelled) setAccess("allowed");
    }, 8000);

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        // Not signed in → send to auth (which itself routes unpaid users onward).
        if (!session?.user) {
          navigate("/auth");
          return;
        }

        const userId = session.user.id;

        // Admins always have access. Use an array query (not .maybeSingle) so a
        // no-row result returns [] with a 200 instead of a 406.
        const { data: adminRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .limit(1);
        if (cancelled) return;
        if (adminRoles && adminRoles.length > 0) {
          setAccess("allowed");
          return;
        }

        // Read the plan up front — it doubles as the paid check AND the tier used
        // for tier gating (confirm-euro1 sets profiles.plan to the chosen tier even
        // during the €1 trial, so trialing users carry their real tier here).
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", userId)
          .maybeSingle();
        if (cancelled) return;
        const plan = (profile?.plan || "").toLowerCase();

        // Tier gate: a paid user below the required tier → upgrade screen.
        if (requiredTier && plan && plan !== "free" && !tierMeets(plan, requiredTier)) {
          navigate("/payment");
          return;
        }

        // Users with an assigned paid plan always have access. This covers plans
        // that don't show up as an "active" Stripe subscription for this email
        // (manual/admin grants, legacy plans, past-due, email mismatch) — those
        // must NOT be gated. Only `free`/no-plan users fall through to the Stripe
        // check below.
        if (plan && plan !== "free") {
          setAccess("allowed");
          return;
        }

        const { data: sub } = await supabase.functions.invoke("check-subscription");
        if (cancelled) return;
        // `subscribed` = full plan; `trialing` = €1-offer payer still on the
        // free plan but with an active Stripe trial.
        if (sub?.subscribed || sub?.trialing) {
          setAccess("allowed");
        } else {
          navigate("/pricing-1-euro-offer");
        }
      } catch {
        // Fail open on ANY error (hung/rejected session, roles, profile or
        // subscription lookup) so a paying customer is never locked out on the
        // loader. The previous version only caught the subscription call, so an
        // earlier failure left the gate stuck in "checking" forever.
        if (!cancelled) setAccess("allowed");
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(failOpenTimer);
    };
  }, [bypass, requiredTier, navigate]);

  return access;
};
