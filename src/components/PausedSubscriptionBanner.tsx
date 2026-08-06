import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PauseCircle } from "lucide-react";

/**
 * Paused-subscription banner. When a user has paused their plan (billing on hold
 * via Stripe pause_collection, plan downgraded to free with subscription_paused
 * set), this gives them a clear, always-available way to resume — the only other
 * resume path is the offboarding/cancel modal, which a paused user won't revisit.
 *
 * Cheap gate: reads profiles.subscription_paused first; only paused users trigger
 * the check-subscription call that fetches the auto-resume date. Renders nothing
 * for everyone else.
 */
const PausedSubscriptionBanner = () => {
  const navigate = useNavigate();
  const [paused, setPaused] = useState(false);
  const [resumesAt, setResumesAt] = useState<string | null>(null);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setPaused(false); return; }
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_paused")
      .eq("id", session.user.id)
      .maybeSingle();
    if (!profile?.subscription_paused) { setPaused(false); return; }
    setPaused(true);
    // Best-effort: fetch the auto-resume date to show in the copy.
    try {
      const { data } = await supabase.functions.invoke("check-subscription");
      if (data?.pause_resumes_at) setResumesAt(data.pause_resumes_at);
    } catch {
      /* non-fatal — banner still shows without the date */
    }
  };

  useEffect(() => { void load(); }, []);

  if (!paused) return null;

  const resumeDate = resumesAt
    ? new Date(resumesAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-offer/30 bg-offer-soft p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <PauseCircle className="mt-0.5 h-5 w-5 shrink-0 text-offer-hover" />
        <div>
          <p className="font-semibold text-foreground">Your plan is paused</p>
          <p className="text-sm text-muted-foreground">
            Billing is on hold and your paid features are paused.
            {resumeDate ? ` It resumes automatically on ${resumeDate}.` : ""} Resume anytime to pick up where you left off.
          </p>
        </div>
      </div>
      <Button
        onClick={() => navigate("/payment")}
        className="shrink-0 bg-offer font-bold text-offer-foreground hover:bg-offer-hover"
      >
        Resume plan
      </Button>
    </div>
  );
};

export default PausedSubscriptionBanner;
