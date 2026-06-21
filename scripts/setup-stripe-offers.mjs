#!/usr/bin/env node
/**
 * Idempotent Stripe setup for the Floowy €1-offer funnel.
 *
 * Creates / verifies every product, price and coupon the funnel needs, then
 * (with --write) patches src/lib/stripe-config.ts with the resulting IDs.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_xxx node scripts/setup-stripe-offers.mjs           # dry-create + print IDs
 *   STRIPE_SECRET_KEY=sk_live_xxx node scripts/setup-stripe-offers.mjs --write   # also patch stripe-config.ts
 *
 * Safe to run repeatedly: existing objects are reused (matched by lookup_key /
 * deterministic coupon id / product metadata), nothing is duplicated.
 *
 * What it ensures exists:
 *   • Product "Ultra Monthly Plan" + recurring price €129/mo  (lookup_key: floowy_ultra_monthly)
 *   • Coupon floowy_ultra_52off        — 52% off, once          (Upsell #1 headline)
 *   • Coupon floowy_addon_74off        — €74 off, once          (Upsell #2: Ultra first invoice €129 → €55)
 *   • Coupon floowy_personal_10off_3mo — 10% off, 3 months      (Section 9 personal promo)
 *   • Verifies the existing €1-trial coupons + the 50%-off coupon are present.
 */

const KEY = process.env.STRIPE_SECRET_KEY;
const WRITE = process.argv.includes("--write");

if (!KEY) {
  console.error("\n✖ STRIPE_SECRET_KEY env var is required.\n");
  console.error("  Run:  STRIPE_SECRET_KEY=sk_live_xxx node scripts/setup-stripe-offers.mjs [--write]\n");
  process.exit(1);
}

const BASE = "https://api.stripe.com/v1";

/** Encode a (possibly nested) object as application/x-www-form-urlencoded for Stripe. */
function encode(obj, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object" && !Array.isArray(v)) encode(v, key, out);
    else if (Array.isArray(v)) v.forEach((item, i) => out.append(`${key}[${i}]`, String(item)));
    else out.append(key, String(v));
  }
  return out;
}

async function stripe(method, path, params, idempotencyKey) {
  const headers = {
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: params ? encode(params).toString() : undefined,
  });
  const json = await res.json();
  return { ok: res.ok, status: res.status, json };
}

async function ensureProduct(name, key) {
  // Match by metadata so re-runs reuse the same product.
  const search = await stripe(
    "GET",
    `/products/search?query=${encodeURIComponent(`metadata['floowy_key']:'${key}'`)}`,
  );
  if (search.ok && search.json.data?.length) {
    console.log(`  ✓ product exists: ${search.json.data[0].id} (${name})`);
    return search.json.data[0].id;
  }
  const created = await stripe("POST", "/products", {
    name,
    metadata: { floowy_key: key },
  });
  if (!created.ok) throw new Error(`product create failed: ${JSON.stringify(created.json)}`);
  console.log(`  + product created: ${created.json.id} (${name})`);
  return created.json.id;
}

async function ensurePrice(lookupKey, { product, amount, currency, interval, intervalCount }) {
  const found = await stripe("GET", `/prices?lookup_keys[]=${lookupKey}&active=true&limit=1`);
  if (found.ok && found.json.data?.length) {
    console.log(`  ✓ price exists: ${found.json.data[0].id} (${lookupKey})`);
    return found.json.data[0].id;
  }
  const created = await stripe("POST", "/prices", {
    product,
    unit_amount: amount,
    currency,
    recurring: { interval, ...(intervalCount ? { interval_count: intervalCount } : {}) },
    lookup_key: lookupKey,
    transfer_lookup_key: true,
  });
  if (!created.ok) throw new Error(`price create failed: ${JSON.stringify(created.json)}`);
  console.log(`  + price created: ${created.json.id} (${lookupKey}, ${amount} ${currency}/${interval})`);
  return created.json.id;
}

async function ensureCoupon(id, params) {
  const found = await stripe("GET", `/coupons/${id}`);
  if (found.ok) {
    console.log(`  ✓ coupon exists: ${id}`);
    return id;
  }
  const created = await stripe("POST", "/coupons", { id, ...params }, `floowy-coupon-${id}`);
  if (!created.ok) throw new Error(`coupon create failed (${id}): ${JSON.stringify(created.json)}`);
  console.log(`  + coupon created: ${id}`);
  return id;
}

async function verifyCoupon(id, label) {
  const found = await stripe("GET", `/coupons/${id}`);
  if (found.ok) console.log(`  ✓ ${label}: ${id} present`);
  else console.warn(`  ⚠ ${label}: ${id} NOT found in this Stripe account`);
}

async function main() {
  const mode = KEY.includes("_live_") ? "LIVE" : "TEST";
  console.log(`\nFloowy → Stripe offer setup  (${mode} key)\n`);

  console.log("Products & prices:");
  const ultraProduct = await ensureProduct("Ultra Monthly Plan", "ultra_monthly");
  const ultraPriceId = await ensurePrice("floowy_ultra_monthly", {
    product: ultraProduct,
    amount: 12900, // €129.00
    currency: "eur",
    interval: "month",
  });

  // €1 / 3-day price — phase 1 of the true 3-day €1 subscription schedule.
  const trialProduct = await ensureProduct("Floowy €1 Launch Trial", "euro1_trial");
  const trialPriceId = await ensurePrice("floowy_euro1_3day", {
    product: trialProduct,
    amount: 100, // €1.00
    currency: "eur",
    interval: "day",
    intervalCount: 3,
  });

  console.log("\nCoupons (new):");
  const ultraCoupon = await ensureCoupon("floowy_ultra_52off", {
    percent_off: 52,
    duration: "once",
    name: "Ultra upsell — 52% off first month",
  });
  const addonCoupon = await ensureCoupon("floowy_addon_74off", {
    amount_off: 7400, // €74 off → €129 first invoice becomes €55
    currency: "eur",
    duration: "once",
    name: "Ultra add-on — €55 first month",
  });
  const personalCoupon = await ensureCoupon("floowy_personal_10off_3mo", {
    percent_off: 10,
    duration: "repeating",
    duration_in_months: 3,
    name: "Personal promo — 10% off for 3 months",
  });

  console.log("\nExisting coupons (verify):");
  await verifyCoupon("Rw0BPJrW", "€1 trial · Lite");
  await verifyCoupon("0HKLV9SY", "€1 trial · Starter");
  await verifyCoupon("lFOV2y0q", "€1 trial · Professional");
  await verifyCoupon("6yNSM3K2", "50% off · 3 months");

  const ids = {
    "EURO1_OFFER.trialPriceId": trialPriceId,
    "ULTRA_UPSELL.priceId": ultraPriceId,
    "ULTRA_UPSELL.couponId": ultraCoupon,
    "ADDON_UPSELL.priceId": ultraPriceId, // add-on = Ultra subscription, first invoice discounted
    "ADDON_UPSELL.couponId": addonCoupon,
    "PERSONAL_PROMO.couponId": personalCoupon,
  };

  console.log("\n──────────────────────────────────────────────");
  console.log("Resulting IDs:");
  for (const [k, v] of Object.entries(ids)) console.log(`  ${k.padEnd(24)} = ${v}`);
  console.log("──────────────────────────────────────────────\n");

  if (WRITE) {
    const { readFileSync, writeFileSync } = await import("node:fs");
    const path = new URL("../src/lib/stripe-config.ts", import.meta.url);
    let src = readFileSync(path, "utf8");
    const patches = [
      ['trialPriceId: "",', `trialPriceId: "${trialPriceId}",`],
      ['priceId: "", // TODO Phase 2: Stripe price id for Ultra Monthly', `priceId: "${ultraPriceId}",`],
      ['couponId: "", // TODO Phase 2: Stripe coupon id for the upsell discount', `couponId: "${ultraCoupon}",`],
      ['priceId: "", // TODO Phase 2: Stripe price id for the add-on', `priceId: "${ultraPriceId}",`],
      ['couponId: "", // TODO Phase 2: Stripe coupon id for the add-on', `couponId: "${addonCoupon}",`],
      ['couponId: "", // TODO Phase 2: Stripe coupon id', `couponId: "${personalCoupon}",`],
    ];
    for (const [from, to] of patches) {
      if (src.includes(from)) src = src.replace(from, to);
      else console.warn(`  ⚠ placeholder not found (already patched?): ${from}`);
    }
    writeFileSync(path, src);
    console.log("✓ Patched src/lib/stripe-config.ts with the IDs above.\n");
  } else {
    console.log("Run again with --write to patch src/lib/stripe-config.ts automatically.\n");
  }
}

main().catch((e) => {
  console.error("\n✖ Setup failed:", e.message, "\n");
  process.exit(1);
});
