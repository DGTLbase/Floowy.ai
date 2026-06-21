#!/usr/bin/env node
/**
 * Read-only verification of the Floowy offer objects in Stripe.
 * Makes only GET calls — never creates or charges anything.
 *
 * Usage: STRIPE_SECRET_KEY=sk_... node scripts/verify-stripe-offers.mjs
 */
const KEY = process.env.STRIPE_SECRET_KEY;
if (!KEY) {
  console.error("✖ STRIPE_SECRET_KEY required");
  process.exit(1);
}
const BASE = "https://api.stripe.com/v1";

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${KEY}` } });
  return { ok: res.ok, json: await res.json() };
}

const checks = [];
const expect = (label, actual, want) => {
  const pass = actual === want;
  checks.push(pass);
  console.log(`  ${pass ? "✓" : "✖"} ${label}: ${actual}${pass ? "" : `  (expected ${want})`}`);
};

async function main() {
  console.log(`\nVerifying Floowy offers  (${KEY.includes("_live_") ? "LIVE" : "TEST"} mode) — read-only\n`);

  console.log("Ultra Monthly price (price_1TkbwJKbAjgJzP4OaHqIAkLN):");
  const ultra = await get("/prices/price_1TkbwJKbAjgJzP4OaHqIAkLN");
  if (ultra.ok) {
    expect("amount", ultra.json.unit_amount, 12900);
    expect("currency", ultra.json.currency, "eur");
    expect("interval", ultra.json.recurring?.interval, "month");
    expect("active", ultra.json.active, true);
  } else console.log("  ✖ not found");

  console.log("\n€1 / 3-day price (price_1Tkc7dKbAjgJzP4O8dVb72lC):");
  const trial = await get("/prices/price_1Tkc7dKbAjgJzP4O8dVb72lC");
  if (trial.ok) {
    expect("amount", trial.json.unit_amount, 100);
    expect("currency", trial.json.currency, "eur");
    expect("interval", trial.json.recurring?.interval, "day");
    expect("interval_count", trial.json.recurring?.interval_count, 3);
    expect("active", trial.json.active, true);
  } else console.log("  ✖ not found");

  console.log("\nCoupon floowy_ultra_52off:");
  const c1 = await get("/coupons/floowy_ultra_52off");
  if (c1.ok) {
    expect("percent_off", c1.json.percent_off, 52);
    expect("duration", c1.json.duration, "once");
    expect("valid", c1.json.valid, true);
  } else console.log("  ✖ not found");

  console.log("\nCoupon floowy_addon_74off:");
  const c2 = await get("/coupons/floowy_addon_74off");
  if (c2.ok) {
    expect("amount_off", c2.json.amount_off, 7400);
    expect("currency", c2.json.currency, "eur");
    expect("duration", c2.json.duration, "once");
    expect("valid", c2.json.valid, true);
  } else console.log("  ✖ not found");

  console.log("\nCoupon floowy_personal_10off_3mo:");
  const c3 = await get("/coupons/floowy_personal_10off_3mo");
  if (c3.ok) {
    expect("percent_off", c3.json.percent_off, 10);
    expect("duration", c3.json.duration, "repeating");
    expect("duration_in_months", c3.json.duration_in_months, 3);
    expect("valid", c3.json.valid, true);
  } else console.log("  ✖ not found");

  console.log("\n€1-trial + 50%-off coupons:");
  for (const [id, label] of [
    ["Rw0BPJrW", "Lite €18 off"],
    ["0HKLV9SY", "Starter €48 off"],
    ["lFOV2y0q", "Pro €118 off"],
    ["6yNSM3K2", "50% / 3mo"],
  ]) {
    const c = await get(`/coupons/${id}`);
    console.log(`  ${c.ok ? "✓" : "✖"} ${label} (${id})${c.ok ? "" : " — MISSING"}`);
    checks.push(c.ok);
  }

  const passed = checks.filter(Boolean).length;
  console.log(`\n${passed}/${checks.length} checks passed.\n`);
  process.exit(passed === checks.length ? 0 : 1);
}
main().catch((e) => { console.error("✖", e.message); process.exit(1); });
