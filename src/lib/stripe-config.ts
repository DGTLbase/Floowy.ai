// Stripe Price IDs and Plan Configuration

export const STRIPE_PRICES = {
  // Monthly Subscriptions (EUR)
  LITE_MONTHLY: "price_1TYhRdKbAjgJzP4OoKJLuqQT",
  STARTER_MONTHLY: "price_1SXv5wKbAjgJzP4OZ4ItVTI6",
  PROFESSIONAL_MONTHLY: "price_1SXv5zKbAjgJzP4OvMuBKt2O",
  ENTERPRISE_MONTHLY: "price_1ShA0EKbAjgJzP4OS9TVcaIP",
  
  // Yearly Subscriptions (EUR)
  LITE_YEARLY: "price_1TYiClKbAjgJzP4OFk8CfXy9",
  STARTER_YEARLY: "price_1SXv5yKbAjgJzP4OvGPL0OSw",
  PROFESSIONAL_YEARLY: "price_1SXv60KbAjgJzP4OvawG7K1A",
  ENTERPRISE_YEARLY: "price_1Sfu1DKbAjgJzP4O68Keb4AQ",
  
  // One-time Credit Packs (EUR)
  CREDITS_50: "price_1SXv5uKbAjgJzP4OZfdyN4I0",
  CREDITS_150: "price_1SXv5uKbAjgJzP4OkIs9TQU5",
  CREDITS_300: "price_1SXv5vKbAjgJzP4OrkY4KQ4S",
} as const;

// Promo coupon IDs (created in Stripe)
export const PROMO_COUPONS = {
  EURO1_TRIAL: {
    lite: "Rw0BPJrW",        // €18 off first invoice (Lite €19 → €1)
    starter: "0HKLV9SY",      // €48 off first invoice (Starter €49 → €1)
    professional: "lFOV2y0q", // €118 off first invoice (Pro €119 → €1)
  },
  FIFTY_OFF_3M: "6yNSM3K2",   // 50% off, repeating 3 months
} as const;

// ── €1 launch offer (Section 1–9) ─────────────────────────────────────────────
// Single source of truth for the "Launch your first creative for €1" funnel.
export const EURO1_OFFER = {
  price: 1,
  trialDays: 3,        // €1 access lasts 3 days
  trialCredits: 10,    // max credits during the €1 period
  offerKind: "euro1" as const,
  offerType: "euro1_trial" as const,
  ctaLabel: "Start for €1",
  stickyText: "Launch your first creative for €1",
  signupHref: "/auth?mode=signup&offer=euro1",
  // Countdown shown on the pricing page. Perpetual / resets per session.
  countdownDays: 3,
  countdownStorageKey: "floowy_euro1_countdown",
  // True 3-day €1 cycle (subscription schedule). Set by setup-stripe-offers.mjs.
  trialPriceId: "price_1Tkc7dKbAjgJzP4O8dVb72lC",
  // When true, the €1 offer charges €1 now for a 3-day trial, then auto-bills
  // the chosen plan at day 3 (via create-euro1-checkout + confirm-euro1, both
  // deployed). Verified end-to-end in Stripe test mode (scripts/test-euro1-flow.mjs).
  trueTrial: true,
};

// "You're in 5%" personal-discount popup (Section 9).
// couponId is a live Stripe coupon (10% off, repeating 3 months) created by
// scripts/setup-stripe-offers.mjs. It is auto-applied for display; applying it
// to billing requires attaching it to the subscription after the €1 trial
// (a single checkout can't stack it with the €1 first-invoice coupon).
export const PERSONAL_PROMO = {
  code: "floowy_PERSONAL_PROMO",
  discountPct: 10,        // 10% off subscription for the next 3 months
  durationMonths: 3,
  countdownSeconds: 10 * 60, // 10:00, resets per session
  couponId: "floowy_personal_10off_3mo",
};

// Post-purchase upsells (Sections 10 & 11) — use the REAL plans/credits.
// The offer upgrades the user to the next tier above what they bought, applying
// a discount to the first billing period via existing Stripe coupons.
const TIER_ORDER = ["lite", "starter", "professional", "enterprise"] as const;
export type PlanKey = typeof TIER_ORDER[number];

/** The next real plan above `plan` (caps at enterprise; defaults to professional). */
export function nextTier(plan?: string): PlanKey {
  const i = TIER_ORDER.indexOf((plan || "").toLowerCase() as PlanKey);
  if (i < 0) return "professional";
  return TIER_ORDER[Math.min(i + 1, TIER_ORDER.length - 1)];
}

export const UPSELL = {
  // #1 — full-page takeover: X% off the first month of the next-tier plan.
  ultraDiscountPct: 52,
  ultraCouponId: "floowy_ultra_52off",       // 52% off, once
  ultraCountdownSeconds: 7 * 60 + 45,        // 07:45
  // #2 — second-chance: stronger value, 50% off the first 3 months.
  addonDiscountPct: 50,
  addonMonths: 3,
  addonCouponId: PROMO_COUPONS.FIFTY_OFF_3M, // 50% off, repeating 3 months
  addonCountdownSeconds: 4 * 60 + 56,        // 04:56
};

// Credit packs. `price` is the real charge; `originalPrice` is the anchor
// (strikethrough) shown to frame everything at ~30% off (Section 12).
export const CREDIT_PACKS = [
  {
    credits: 50,
    price: 45,
    originalPrice: 65,
    discountPct: 31,
    priceId: STRIPE_PRICES.CREDITS_50,
    icon: "⚡",
    popular: false,
  },
  {
    credits: 150,
    price: 95,
    originalPrice: 135,
    discountPct: 30,
    priceId: STRIPE_PRICES.CREDITS_150,
    icon: "🚀",
    popular: true,
  },
  {
    credits: 300,
    price: 175,
    originalPrice: 250,
    discountPct: 30,
    priceId: STRIPE_PRICES.CREDITS_300,
    icon: "💎",
    popular: false,
  },
];

export const SUBSCRIPTION_PLANS = {
  lite: {
    name: "Lite",
    monthly: {
      credits: 40,
      price: 19,
      priceId: STRIPE_PRICES.LITE_MONTHLY,
    },
    yearly: {
      credits: 480,
      price: 190,
      priceId: STRIPE_PRICES.LITE_YEARLY,
    },
  },
  starter: {
    name: "Starter",
    monthly: {
      credits: 100,
      price: 49,
      priceId: STRIPE_PRICES.STARTER_MONTHLY,
    },
    yearly: {
      credits: 1200,
      price: 470,
      priceId: STRIPE_PRICES.STARTER_YEARLY,
    },
  },
  professional: {
    name: "Professional",
    monthly: {
      credits: 250,
      price: 119,
      priceId: STRIPE_PRICES.PROFESSIONAL_MONTHLY,
    },
    yearly: {
      credits: 3000,
      price: 1099,
      priceId: STRIPE_PRICES.PROFESSIONAL_YEARLY,
    },
  },
  enterprise: {
    name: "Enterprise",
    monthly: {
      credits: 500,
      price: 229,
      priceId: STRIPE_PRICES.ENTERPRISE_MONTHLY,
    },
    yearly: {
      credits: 6000,
      price: 2194,
      priceId: STRIPE_PRICES.ENTERPRISE_YEARLY,
    },
  },
};
