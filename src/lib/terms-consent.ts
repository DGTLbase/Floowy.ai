// T&C + Privacy consent — shared plumbing for every signup path.
//
// Two mechanisms, because one is not enough:
//
// (A) Email/password signup passes consent through auth.signUp(options.data),
//     and the handle_new_user trigger writes it in the same transaction as the
//     account. Nothing here is involved.
//
// (B) Google OAuth cannot do that — signInWithOAuth has no metadata channel and
//     the account is created during the callback. So we stash the consent the
//     user gave BEFORE the redirect, and redeem it as soon as they come back.
//     `redeemStashedConsent` is that redemption step.
//
// The stash is best-effort: if the user abandons mid-OAuth, or clicks "Login"
// then Google without an account, they arrive with no consent recorded. The
// onboarding consent gate is the backstop that catches those cases — never
// treat the stash as the guarantee.

import { supabase } from "@/integrations/supabase/client";
import { termsConditions, privacyPolicy } from "@/content/legal";

/** localStorage, not sessionStorage: the OAuth round-trip can land in a fresh
 *  browsing context, and sessionStorage would not survive it. */
const STASH_KEY = "floowy_terms_consent_pending";

export const CONSENT_VERSIONS = {
  terms_version: termsConditions.version,
  privacy_version: privacyPolicy.version,
} as const;

/** Call immediately before handing off to an external identity provider. */
export const stashConsent = () => {
  try {
    localStorage.setItem(
      STASH_KEY,
      JSON.stringify({ ...CONSENT_VERSIONS, at: new Date().toISOString() }),
    );
  } catch {
    /* private mode / storage disabled — the onboarding gate still covers it */
  }
};

export const clearStashedConsent = () => {
  try {
    localStorage.removeItem(STASH_KEY);
  } catch {
    /* ignore */
  }
};

/**
 * Record consent for the signed-in user. The timestamp is generated server-side
 * by the RPC; the client only asserts *that* consent was given and which
 * document versions were shown. Idempotent — safe to call more than once.
 */
export const recordConsent = async (
  versions: { terms_version: string; privacy_version: string } = CONSENT_VERSIONS,
): Promise<boolean> => {
  const { error } = await supabase.rpc("record_terms_acceptance" as never, {
    p_terms_version: versions.terms_version,
    p_privacy_version: versions.privacy_version,
  } as never);

  if (error) {
    console.error("[consent] Failed to record acceptance:", error.message);
    return false;
  }
  clearStashedConsent();
  return true;
};

/**
 * Redeem consent captured before an OAuth redirect. Returns true only when an
 * acceptance is now on record. No stash → false, and the caller must send the
 * user through the consent gate instead of assuming consent.
 */
export const redeemStashedConsent = async (): Promise<boolean> => {
  let stashed: { terms_version?: string; privacy_version?: string } | null = null;
  try {
    stashed = JSON.parse(localStorage.getItem(STASH_KEY) || "null");
  } catch {
    stashed = null;
  }
  if (!stashed?.terms_version || !stashed?.privacy_version) return false;

  return recordConsent({
    terms_version: stashed.terms_version,
    privacy_version: stashed.privacy_version,
  });
};

/** True when this user has no acceptance on record and must be gated. */
export const needsConsent = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("terms_accepted_at")
    .eq("id", userId)
    .maybeSingle();

  // Fail CLOSED on error: an unreadable consent state must not be treated as
  // consent given. The gate is cheap to show; a missing consent record is not.
  if (error) return true;
  return !(data as { terms_accepted_at?: string | null } | null)?.terms_accepted_at;
};
