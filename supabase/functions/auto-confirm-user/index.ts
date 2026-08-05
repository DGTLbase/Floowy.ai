// Marks a just-created user's email as confirmed, so signup never depends on
// the project's "Confirm email" setting.
//
// WHY THIS EXISTS
// When Confirm email is enabled, signUp() returns a user but no session and
// signInWithPassword() refuses with "Email not confirmed" — the account exists
// but cannot be used, and the user is stuck. Floowy does not want email
// confirmation at all; the €1 payment is the real gate. This confirms the
// address server-side so the client can sign the user straight in.
//
// SECURITY
// This endpoint can confirm an email address, so it is deliberately narrow:
//
//   1. It only accepts a user id. Those are UUIDs, so an attacker cannot
//      enumerate or guess someone else's.
//   2. It refuses anyone already confirmed, so it cannot be replayed against an
//      established account.
//   3. It refuses anyone created more than CONFIRM_WINDOW_SECONDS ago, so the
//      window in which any given id is usable is seconds long, not forever.
//
// Together these mean it can only ever finish the signup it was called for. If
// "Confirm email" is later switched off in the dashboard this becomes dead
// weight and can be removed — signUp() returns a session on its own.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** How recently the account must have been created to be auto-confirmed. */
const CONFIRM_WINDOW_SECONDS = 120;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userId } = await req.json().catch(() => ({ userId: null }));
    if (!userId || typeof userId !== "string") {
      return json({ error: "userId required" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data?.user) {
      console.warn("[auto-confirm-user] unknown user:", userId);
      return json({ error: "User not found" }, 404);
    }
    const user = data.user;

    // Already usable — nothing to do. Also stops this being replayed against an
    // established account.
    if (user.email_confirmed_at) {
      return json({ confirmed: true, alreadyConfirmed: true });
    }

    const ageSeconds = (Date.now() - new Date(user.created_at).getTime()) / 1000;
    if (ageSeconds > CONFIRM_WINDOW_SECONDS) {
      console.warn(
        `[auto-confirm-user] refused: account is ${Math.round(ageSeconds)}s old, window is ${CONFIRM_WINDOW_SECONDS}s`,
      );
      return json({ error: "Outside the signup window" }, 403);
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });
    if (updateError) {
      console.error("[auto-confirm-user] update failed:", updateError.message);
      return json({ error: updateError.message }, 500);
    }

    console.log("[auto-confirm-user] confirmed", userId);
    return json({ confirmed: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[auto-confirm-user] error:", message);
    return json({ error: message }, 500);
  }
});
