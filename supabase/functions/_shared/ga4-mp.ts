// GA4 Measurement Protocol — server-side e-commerce reporting.
//
// Checkout runs on checkout.stripe.com, where our GTM container cannot run, so
// the browser never sees the sale. This sends it from the Stripe webhook
// instead: ad-blocker-proof, and it cannot be lost to a closed tab or a failed
// redirect. This is the source of truth for revenue.
//
// WHY invoice.paid AND NOT checkout.session.completed
// The €1 offer creates the Checkout Session with mode:"setup" — it collects a
// card and charges nothing. Its checkout.session.completed therefore arrives
// with payment_status "no_payment_required" and no amount, so a handler keyed
// on that event (and guarded on payment_status === "paid") silently skips
// every €1 signup, which is the main acquisition funnel. Invoices are the only
// event both funnels share, and they are also the only way renewals are ever
// seen at all.

const GA4_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const GA4_DEBUG_ENDPOINT = "https://www.google-analytics.com/debug/mp/collect";

/** First payment of a subscription vs. a later cycle. */
export type PurchaseKind = "purchase" | "subscription_renewal";

/**
 * Stripe sets billing_reason on every invoice, so the first payment can be
 * told from a renewal without any bookkeeping of our own.
 *
 * "subscription_create" — first invoice, including the discounted €1 one.
 * "subscription_cycle"  — an automatic renewal.
 * "subscription_update" — a plan change / proration; counted as a renewal so
 *                         it never inflates the Ads conversion count.
 */
export const purchaseKindFor = (billingReason: string | null | undefined): PurchaseKind =>
  billingReason === "subscription_create" ? "purchase" : "subscription_renewal";

export interface Ga4Item {
  item_id: string;
  item_name: string;
  item_variant?: string;
  price: number;
  quantity: number;
  coupon?: string;
}

export interface Ga4PurchasePayload {
  /** GA4 client_id captured in the browser; see src/lib/ga-attribution.ts. */
  clientId: string | null;
  eventName: PurchaseKind;
  transactionId: string;
  value: number;
  currency: string;
  items: Ga4Item[];
  /** Passed through for reporting; Ads attribution itself comes via GA4 import. */
  gclid?: string | null;
  debug?: boolean;
}

/**
 * Sends one e-commerce event. Never throws: analytics must not be able to fail
 * a webhook and make Stripe retry a payment we already processed. Returns
 * whether the send was accepted so the caller can decide about marking the
 * invoice as reported.
 */
export async function sendGa4Purchase(p: Ga4PurchasePayload): Promise<boolean> {
  const measurementId = Deno.env.get("GA4_MEASUREMENT_ID");
  const apiSecret = Deno.env.get("GA4_API_SECRET");

  if (!measurementId || !apiSecret) {
    console.warn("[ga4-mp] GA4_MEASUREMENT_ID / GA4_API_SECRET not set — skipping send");
    return false;
  }

  // With no client_id GA4 rejects the payload outright. A random id still
  // records the revenue (unattributed) rather than losing the sale entirely —
  // better an orphaned conversion than a missing one.
  const clientId = p.clientId || `${Math.floor(Math.random() * 1e10)}.${Math.floor(Date.now() / 1000)}`;

  const body = {
    client_id: clientId,
    // Server-side events carry no cookie, so tell GA4 when this happened
    // rather than letting it stamp arrival time. Micros, per the MP spec.
    timestamp_micros: Date.now() * 1000,
    non_personalized_ads: false,
    events: [
      {
        name: p.eventName,
        params: {
          transaction_id: p.transactionId,
          value: p.value,
          currency: p.currency,
          items: p.items,
          ...(p.gclid ? { gclid: p.gclid } : {}),
          ...(p.debug ? { debug_mode: true } : {}),
        },
      },
    ],
  };

  const url = `${p.debug ? GA4_DEBUG_ENDPOINT : GA4_ENDPOINT}?measurement_id=${measurementId}&api_secret=${apiSecret}`;

  try {
    const res = await fetch(url, { method: "POST", body: JSON.stringify(body) });

    // The live endpoint answers 204 with no body. The debug endpoint answers
    // 200 with validationMessages — surface those, they are the only way to
    // catch a malformed payload before it silently disappears.
    if (p.debug) {
      const text = await res.text();
      console.log("[ga4-mp] debug response:", text);
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.validationMessages) && parsed.validationMessages.length > 0) {
          console.error("[ga4-mp] validation errors:", JSON.stringify(parsed.validationMessages));
          return false;
        }
      } catch { /* non-JSON body — fall through to the status check */ }
    }

    if (!res.ok) {
      console.error("[ga4-mp] send failed:", res.status);
      return false;
    }
    console.log(`[ga4-mp] sent ${p.eventName} txn=${p.transactionId} value=${p.value} ${p.currency}`);
    return true;
  } catch (err) {
    console.error("[ga4-mp] send threw:", err instanceof Error ? err.message : String(err));
    return false;
  }
}

/**
 * The subscription that generated an invoice, across API versions.
 *
 * Basil (2025-03-31 onward) REMOVED `invoice.subscription` and moved it to
 * `invoice.parent.subscription_details.subscription`. Reading only the old
 * field yields undefined on any Basil-rendered event, which fails silently:
 * attribution metadata is never read, so every conversion lands in GA4 with a
 * random client_id and no gclid — reported, but useless for Ads.
 *
 * Webhook payloads are rendered with the ENDPOINT's API version, which can
 * differ from the version this code pins, so both shapes are checked.
 */
export function subscriptionIdFromInvoice(invoice: any): string | null {
  const parent = invoice?.parent;
  if (parent?.subscription_details?.subscription) {
    const sub = parent.subscription_details.subscription;
    return typeof sub === "string" ? sub : (sub?.id ?? null);
  }
  return typeof invoice?.subscription === "string" ? invoice.subscription : null;
}

/**
 * Reports one paid Stripe invoice to GA4.
 *
 * Safe to call for both invoice.paid and invoice.payment_succeeded. Stripe
 * emits both for the same invoice, and which of them an endpoint actually
 * receives is dashboard configuration this code cannot see — gating on one
 * event name means analytics silently never fire if that name is not
 * subscribed. Dedup is the ga4_reported stamp below, not the event name.
 *
 * Idempotency without a database: the invoice is stamped with ga4_reported in
 * its own Stripe metadata once sent, which also survives Stripe's at-least-once
 * redelivery. GA4 dedupes `purchase` by transaction_id anyway, but a custom
 * `subscription_renewal` event gets no such protection, so the stamp matters.
 *
 * Never throws — analytics must not be able to fail a webhook and make Stripe
 * retry a payment that was already processed.
 */
export async function reportInvoiceToGa4(stripe: any, invoice: any): Promise<void> {
  try {
    if (invoice?.status !== "paid") {
      console.log("[ga4-mp] invoice not paid, skipping:", invoice?.id, "status:", invoice?.status);
      return;
    }
    if (invoice?.metadata?.ga4_reported) {
      console.log("[ga4-mp] invoice already reported, skipping:", invoice.id);
      return;
    }

    // A €0 invoice is a bookkeeping artefact, not revenue.
    const amount = (invoice.amount_paid ?? 0) / 100;
    if (amount <= 0) {
      console.log("[ga4-mp] zero-amount invoice, skipping:", invoice.id);
      return;
    }

    // Attribution lives on the subscription, because renewals have no session.
    let clientId: string | null = invoice?.metadata?.ga_client_id ?? null;
    let gclid: string | null = invoice?.metadata?.gclid ?? null;
    const subscriptionId = subscriptionIdFromInvoice(invoice);
    if (!subscriptionId) {
      console.warn(
        "[ga4-mp] no subscription id on invoice",
        invoice.id,
        "— parent.type:", invoice?.parent?.type ?? "(none)",
        "· conversion will be reported unattributed",
      );
    }
    if ((!clientId || !gclid) && subscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        clientId = clientId || sub?.metadata?.ga_client_id || null;
        gclid = gclid || sub?.metadata?.gclid || null;
      } catch (err) {
        console.warn("[ga4-mp] could not read subscription metadata:", err instanceof Error ? err.message : err);
      }
    }

    const eventName = purchaseKindFor(invoice.billing_reason);
    console.log(
      `[ga4-mp] reporting ${eventName} invoice=${invoice.id}`,
      `billing_reason=${invoice.billing_reason}`,
      `amount=${amount}`,
      `attributed=${clientId ? "yes" : "no (random client_id)"}`,
      `gclid=${gclid ? "yes" : "no"}`,
    );
    const ok = await sendGa4Purchase({
      clientId,
      eventName,
      transactionId: invoice.id,
      value: amount,
      currency: (invoice.currency || "eur").toUpperCase(),
      items: itemsFromInvoice(invoice),
      gclid,
      debug: Deno.env.get("GA4_DEBUG") === "1",
    });

    // Only stamp on success, so a transient failure can be retried by Stripe's
    // redelivery rather than being silently swallowed forever.
    //
    // The stamp now records WHICH property the event was sent to and whether it
    // carried real attribution. `ga4_reported: "purchase"` on its own says the
    // send returned 2xx — which the Measurement Protocol does even for a
    // rejected credential — so it could never distinguish "landed in GA4" from
    // "silently discarded". It also could not reveal that a warm isolate was
    // still holding a stale GA4_MEASUREMENT_ID and posting to the old property,
    // which is exactly what happened and cost two days to find.
    //
    // Stripe is the one surface here that is readable without log access, so
    // the invoice is where this belongs: every future invoice now says, on its
    // own, where its conversion went.
    if (ok) {
      await stripe.invoices.update(invoice.id, {
        metadata: {
          ...(invoice.metadata ?? {}),
          ga4_reported: eventName,
          ga4_measurement_id: Deno.env.get("GA4_MEASUREMENT_ID") ?? "unset",
          ga4_attributed: clientId ? "yes" : "no",
        },
      });
    }
  } catch (err) {
    console.error("[ga4-mp] reportInvoiceToGa4 failed:", err instanceof Error ? err.message : String(err));
  }
}

/**
 * Maps Stripe invoice line items to GA4 items.
 *
 * `value` must be what was actually invoiced, not the plan's list price: the
 * first €1 invoice is genuinely €1 of revenue, and reporting €49 there would
 * inflate ROAS on every trial.
 */
export function itemsFromInvoice(invoice: any): Ga4Item[] {
  const lines: any[] = invoice?.lines?.data ?? [];
  if (lines.length === 0) {
    return [{
      item_id: "subscription",
      item_name: "Subscription",
      price: (invoice?.amount_paid ?? 0) / 100,
      quantity: 1,
    }];
  }

  return lines.map((line) => {
    // Basil also moved the price onto line.pricing.price_details and removed the
    // top-level line.price. Verified against a live invoice: reading only
    // line.price yielded item_id "il_…" — an invoice LINE id, which is unique
    // per invoice and so groups with nothing — and item_name "Subscription" for
    // every product, making the GA4 item report useless.
    const priceDetails = line.pricing?.price_details ?? null;
    const legacyPrice = line.price ?? line.plan ?? {};
    const product = typeof legacyPrice.product === "object" ? legacyPrice.product : null;
    // Stripe's own price id is the most stable identifier we have here; the
    // human-readable plan name is best-effort.
    const itemId = priceDetails?.price || legacyPrice.id || line.id || "subscription";
    const interval = legacyPrice.recurring?.interval;

    return {
      item_id: itemId,
      // line.description is the only human-readable name Basil leaves on the
      // line itself ("Floowy €1 launch access (3 days)").
      item_name: line.description || legacyPrice.nickname || product?.name || "Subscription",
      ...(interval ? { item_variant: interval === "year" ? "yearly" : "monthly" } : {}),
      price: (line.amount ?? 0) / 100,
      quantity: line.quantity ?? 1,
      ...(line.discount_amounts?.length ? { coupon: "discount" } : {}),
    };
  });
}
