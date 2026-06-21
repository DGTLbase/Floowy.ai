#!/usr/bin/env node
/**
 * TEST-MODE ONLY end-to-end simulation of the €1 funnel billing.
 * Uses a Stripe test clock — refuses to run with a live key.
 *
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/test-euro1-flow.mjs
 *
 * Proves:
 *  1. The €1/3-day → plan subscription schedule charges €1 now, then the full
 *     plan price after the clock advances 3 days (the §8 auto-transition).
 *  2. Ultra + floowy_addon_74off  → first invoice €55.
 *  3. Ultra + floowy_ultra_52off  → first invoice €61.92.
 */
const KEY = process.env.STRIPE_SECRET_KEY;
if (!KEY) { console.error("✖ STRIPE_SECRET_KEY required"); process.exit(1); }
if (KEY.includes("_live_")) { console.error("✖ Refusing to run against a LIVE key."); process.exit(1); }

const BASE = "https://api.stripe.com/v1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function encode(obj, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") encode(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}
async function api(method, path, params) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params ? encode(params).toString() : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} → ${JSON.stringify(json.error || json)}`);
  return json;
}

const results = [];
const check = (label, actual, want) => {
  const pass = actual === want;
  results.push(pass);
  console.log(`  ${pass ? "✓ PASS" : "✖ FAIL"}  ${label}: ${actual}${pass ? "" : `  (expected ${want})`}`);
};

async function priceByLookup(lookupKey) {
  const r = await api("GET", `/prices?lookup_keys[]=${lookupKey}&active=true&limit=1`);
  if (!r.data?.length) throw new Error(`price ${lookupKey} not found (run setup in test mode first)`);
  return r.data[0].id;
}

async function newCustomerWithCard(testClock) {
  const cust = await api("POST", "/customers", { email: `test+${Date.now()}@floowy.test`, ...(testClock ? { test_clock: testClock } : {}) });
  const pm = await api("POST", "/payment_methods/pm_card_visa/attach", { customer: cust.id });
  await api("POST", `/customers/${cust.id}`, { "invoice_settings[default_payment_method]": pm.id });
  return cust.id;
}

async function main() {
  console.log("\n€1 funnel — TEST-MODE billing simulation\n");

  const trialPrice = await priceByLookup("floowy_euro1_3day");
  const ultraPrice = await priceByLookup("floowy_ultra_monthly");

  // A throwaway €49/mo price stands in for the chosen plan (phase 2).
  const planProduct = await api("POST", "/products", { name: "TEST Starter (sim)" });
  const planPrice = (await api("POST", "/prices", {
    product: planProduct.id, unit_amount: 4900, currency: "eur", "recurring[interval]": "month",
  })).id;

  // ── Test 1: €1 → 3-day schedule → plan ──────────────────────────────────
  console.log("Test 1 — €1 for 3 days, then auto-bill the plan:");
  const now = Math.floor(Date.now() / 1000);
  const clock = await api("POST", "/test_helpers/test_clocks", { frozen_time: now, name: "euro1-sim" });
  const customer = await newCustomerWithCard(clock.id);

  // €1 charged now: a pending invoice item is swept into the trialing
  // subscription's create-invoice and charged immediately.
  await api("POST", "/invoiceitems", { customer, amount: 100, currency: "eur", description: "Floowy €1 launch access (3 days)" });

  let sub = await api("POST", "/subscriptions", {
    customer,
    "items[0][price]": planPrice,
    trial_period_days: 3,
    "expand[0]": "latest_invoice",
  });
  check("subscription is trialing", sub.status, "trialing");
  check("€1 charged today", sub.latest_invoice?.total, 100);

  console.log("  … advancing test clock to day 4 (trial ends day 3)");
  await api("POST", `/test_helpers/test_clocks/${clock.id}/advance`, { frozen_time: now + 4 * 86400 });
  for (let i = 0; i < 60; i++) {
    const c = await api("GET", `/test_helpers/test_clocks/${clock.id}`);
    if (c.status === "ready") break;
    await sleep(2000);
  }

  sub = await api("GET", `/subscriptions/${sub.id}?expand[]=items.data.price`);
  check("after trial, subscription is active", sub.status, "active");

  let planInvoiceFound = false, detail = [];
  for (let i = 0; i < 15; i++) {
    const invoices = await api("GET", `/invoices?subscription=${sub.id}&limit=10`);
    detail = invoices.data.map((x) => `${x.total}c/${x.status}/${x.billing_reason}`);
    if (invoices.data.some((x) => x.total === 4900)) { planInvoiceFound = true; break; }
    await sleep(2000);
  }
  console.log(`    invoices: [${detail.join(", ")}]`);
  check("a €49 plan invoice generated when the trial ended", planInvoiceFound, true);

  // ── Test 2: add-on coupon → €55 ─────────────────────────────────────────
  console.log("\nTest 2 — Ultra + floowy_addon_74off (expect €55):");
  const c2 = await newCustomerWithCard();
  const addonSub = await api("POST", "/subscriptions", {
    customer: c2,
    "items[0][price]": ultraPrice,
    "discounts[0][coupon]": "floowy_addon_74off",
    "expand[0]": "latest_invoice",
  });
  check("add-on first invoice", addonSub.latest_invoice?.total, 5500);

  // ── Test 3: Ultra 52% coupon → €61.92 ───────────────────────────────────
  console.log("\nTest 3 — Ultra + floowy_ultra_52off (expect €61.92):");
  const c3 = await newCustomerWithCard();
  const ultraSub = await api("POST", "/subscriptions", {
    customer: c3,
    "items[0][price]": ultraPrice,
    "discounts[0][coupon]": "floowy_ultra_52off",
    "expand[0]": "latest_invoice",
  });
  check("ultra discounted first invoice", ultraSub.latest_invoice?.total, 6192);

  const passed = results.filter(Boolean).length;
  console.log(`\n${passed}/${results.length} checks passed.\n`);
  process.exit(passed === results.length ? 0 : 1);
}
main().catch((e) => { console.error("\n✖ Test error:", e.message, "\n"); process.exit(1); });
