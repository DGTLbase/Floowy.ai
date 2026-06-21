// Google Tag Manager dataLayer utility

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

const pushEvent = (event: string, params?: Record<string, unknown>) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
};

// --- Consent Mode ---

export const updateGoogleConsent = (preferences: {
  analytics: boolean;
  marketing: boolean;
}) => {
  if (typeof window.gtag !== "function") return;
  window.gtag("consent", "update", {
    analytics_storage: preferences.analytics ? "granted" : "denied",
    ad_storage: preferences.marketing ? "granted" : "denied",
    ad_user_data: preferences.marketing ? "granted" : "denied",
    ad_personalization: preferences.marketing ? "granted" : "denied",
  });
};

// --- User events ---

export const pushSignupEvent = () => {
  pushEvent("free_account_signup");
};

export const pushSubscriptionPurchaseEvent = (details: {
  plan_name: string;
  price: number;
  billing_cycle: "monthly" | "yearly";
  currency: string;
}) => {
  pushEvent("subscription_purchase", details);
};

// --- Form events ---

export const pushFormSubmitEvent = (
  formType: "contact_us" | "custom_plan" | "demo_request" | "social_media_scraper_inquiry",
) => {
  pushEvent("form_submission", { form_type: formType });
};

// Extend window for gtag
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}
