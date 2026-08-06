// Finding the subscription to act on, for a customer.
//
// THE BUG THIS EXISTS TO PREVENT
// €1-trial users ("€1 first 3 days") are created by confirm-euro1 with
// trial_period_days: 3, so Stripe reports them as "trialing" — NOT "active".
// Stripe's status filter is exact, so `subscriptions.list({ status: "active" })`
// returns nothing for them, and every caller that used it reported "No active
// subscription found" to a customer who plainly has a subscription. For
// cancellation that surfaced as "Failed to cancel. Please try again.", which
// leaves a paying user unable to leave — the worst possible failure.
//
// apply-retention-discount hit this and patched itself with an active-then-
// trialing fallback. Rather than repeat that per function, the lookup lives
// here once and covers every status a live subscription can hold.

/**
 * Statuses a subscription can be in and still be worth acting on, in the order
 * we'd rather find them. "canceled", "incomplete" and "incomplete_expired" are
 * deliberately absent: there is nothing to cancel, pause or discount there.
 */
export const ACTIONABLE_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
] as const;

/**
 * The subscription a customer-facing action should operate on, or null.
 *
 * One request with status "all" rather than a filter per status: it is a single
 * round trip and it cannot miss a state we forgot to enumerate.
 */
export async function findActionableSubscription(
  stripe: any,
  customerId: string,
): Promise<any | null> {
  const list = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 100,
  });

  const subs: any[] = list?.data ?? [];
  for (const status of ACTIONABLE_STATUSES) {
    const match = subs.find((s) => s.status === status);
    if (match) return match;
  }
  return null;
}

/**
 * When a subscription set to cancel_at_period_end actually ends.
 *
 * cancel_at is normally populated once cancel_at_period_end is set, but Basil
 * moved billing periods onto subscription ITEMS, so the old
 * subscription.current_period_end fallback is gone. Returns null rather than
 * inventing a date — `new Date(null * 1000)` silently yields 1 Jan 1970, which
 * is worse than admitting we do not know.
 */
export function cancellationDate(subscription: any): string | null {
  const ts = subscription?.cancel_at
    ?? subscription?.current_period_end
    ?? subscription?.items?.data?.[0]?.current_period_end
    ?? subscription?.trial_end;
  return typeof ts === "number" ? new Date(ts * 1000).toISOString() : null;
}
