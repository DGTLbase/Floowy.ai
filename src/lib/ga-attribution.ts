// GA4 / Google Ads attribution identifiers, read in the browser and handed to
// the backend when a Checkout Session is created.
//
// WHY THIS EXISTS
// Checkout happens on checkout.stripe.com, where our GTM container does not
// run, and the purchase is reported server-side from the Stripe webhook. The
// GA4 client_id lives in the _ga cookie on floowy.ai and is NOT available to
// the webhook — so unless we capture it here and store it on the Stripe
// objects, every server-side purchase lands in GA4 as a brand-new anonymous
// user and the session that actually drove the sale gets no credit.

/**
 * GA4 client_id from the _ga cookie.
 *   _ga = "GA1.1.1234567890.1234567890" -> "1234567890.1234567890"
 * Returns null before GA has set the cookie (first paint, or blocked), in
 * which case the purchase is still recorded — just without user stitching.
 */
export const getGaClientId = (): string | null => {
  const m = document.cookie.match(/_ga=GA\d\.\d\.(\d+\.\d+)/);
  return m ? m[1] : null;
};

/**
 * Google Ads click id. Prefer the current URL (freshest, set on the ad click)
 * and fall back to the _gcl_aw cookie, whose value looks like
 * "GCL.1735689600.Cj0KCQiA..." — the click id is the last dot-separated part.
 */
export const getGclid = (): string | null => {
  const fromUrl = new URLSearchParams(window.location.search).get("gclid");
  if (fromUrl) return fromUrl;

  const m = document.cookie.match(/_gcl_aw=([^;]+)/);
  if (!m) return null;
  const parts = decodeURIComponent(m[1]).split(".");
  return parts.length >= 3 ? parts.slice(2).join(".") : null;
};

/** Both identifiers, omitting whichever is unavailable. */
export const getAttribution = (): { gaClientId?: string; gclid?: string } => {
  const gaClientId = getGaClientId();
  const gclid = getGclid();
  return {
    ...(gaClientId ? { gaClientId } : {}),
    ...(gclid ? { gclid } : {}),
  };
};
