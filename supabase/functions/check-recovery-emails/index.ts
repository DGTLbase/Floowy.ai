import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (s: string, d?: unknown) =>
  console.log(`[CHECK-RECOVERY-EMAILS] ${s}${d ? " - " + JSON.stringify(d) : ""}`);

// Non-payer recovery sequence. Run hourly (pg_cron). Sends at most ONE due flow
// per user per run, in order, so a normal signup gets A→B→C→E at 24h/48h/7d/30d.
const FLOWS = [
  { flow: "A", hours: 24 },
  { flow: "B", hours: 48 },
  { flow: "C", hours: 24 * 7 },
  { flow: "E", hours: 24 * 30 },
];

// Only target users who signed up on/after this flow launched. Existing users
// from before must NOT be pulled into the sequence.
const LAUNCH_CUTOFF = "2026-06-21T00:00:00Z";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // KILL SWITCH — the €1 non-payer recovery / "expiration" email sequence
    // (Flows A/B/C/E) is DISABLED. It no longer sends anything, even though the
    // hourly cron still fires. Set RECOVERY_EMAILS_ENABLED=true (function secret)
    // to turn it back on. Flow D (welcome, sent on purchase) is unaffected.
    if (Deno.env.get("RECOVERY_EMAILS_ENABLED") !== "true") {
      log("recovery/expiration emails disabled — skipping run");
      return new Response(JSON.stringify({ disabled: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const now = Date.now();
    // Candidates: still-free users, signed up after launch, old enough for Flow A.
    const aThreshold = new Date(now - 24 * 3600 * 1000).toISOString();
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, plan, created_at")
      .eq("plan", "free")
      .gte("created_at", LAUNCH_CUTOFF)
      .lte("created_at", aThreshold);
    if (error) throw error;

    if (!users || users.length === 0) {
      return json({ success: true, message: "No candidates", sent: 0 });
    }

    // Which flows each candidate already received.
    const ids = users.map((u) => u.id);
    const { data: logs } = await supabase
      .from("recovery_email_log")
      .select("user_id, flow")
      .in("user_id", ids);
    const sentSet = new Set((logs || []).map((l) => `${l.user_id}|${l.flow}`));

    let sent = 0;
    const results: unknown[] = [];

    for (const u of users) {
      if (!u.email) continue;
      const ageHours = (now - new Date(u.created_at).getTime()) / 3600000;
      // First due-but-unsent flow (keeps sequence; max one email per run).
      const due = FLOWS.find((f) => ageHours >= f.hours && !sentSet.has(`${u.id}|${f.flow}`));
      if (!due) continue;

      const firstName = u.full_name?.split(" ")[0] || "there";
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/send-lifecycle-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
          body: JSON.stringify({ flow: due.flow, email: u.email, firstName }),
        });
        if (!res.ok) {
          const err = await res.text();
          log("send failed", { user: u.id, flow: due.flow, err });
          results.push({ user: u.id, flow: due.flow, status: "failed" });
          continue;
        }
        // Record so it never repeats (and so the next run advances to the next flow).
        const { error: insErr } = await supabase
          .from("recovery_email_log")
          .insert({ user_id: u.id, flow: due.flow });
        if (insErr) log("log insert failed", { user: u.id, flow: due.flow, err: insErr.message });
        sent++;
        results.push({ user: u.id, flow: due.flow, status: "sent" });
      } catch (e) {
        log("error", { user: u.id, flow: due.flow, err: e instanceof Error ? e.message : String(e) });
        results.push({ user: u.id, flow: due.flow, status: "error" });
      }
    }

    log("done", { candidates: users.length, sent });
    return json({ success: true, candidates: users.length, sent, results });
  } catch (e) {
    log("ERROR", { err: e instanceof Error ? e.message : String(e) });
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
