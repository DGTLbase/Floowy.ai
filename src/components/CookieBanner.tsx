import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { updateGoogleConsent } from "@/lib/gtm-datalayer";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

export const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    const accepted = { essential: true, analytics: true, marketing: true };
    localStorage.setItem("cookieConsent", "accepted");
    localStorage.setItem("cookiePreferences", JSON.stringify(accepted));
    updateGoogleConsent({ analytics: true, marketing: true });
    setShowBanner(false);
    setIsMinimized(false);
  };

  const handleDecline = () => {
    const declined = { essential: true, analytics: false, marketing: false };
    localStorage.setItem("cookieConsent", "declined");
    localStorage.setItem("cookiePreferences", JSON.stringify(declined));
    updateGoogleConsent({ analytics: false, marketing: false });
    setShowBanner(false);
    setIsMinimized(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem("cookieConsent", "custom");
    localStorage.setItem("cookiePreferences", JSON.stringify(preferences));
    updateGoogleConsent({ analytics: preferences.analytics, marketing: preferences.marketing });
    setShowBanner(false);
    setIsMinimized(false);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'essential') return; // Essential cookies cannot be disabled
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!showBanner) return null;

  // Minimized floating button
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center transition-all hover:scale-110 animate-in slide-in-from-bottom-5 duration-500 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3),0_0_40px_rgba(var(--primary-rgb),0.2)]"
        style={{ boxShadow: '0 0 20px hsl(var(--primary) / 0.3), 0 0 40px hsl(var(--primary) / 0.15)' }}
        aria-label="Show cookie settings"
      >
        <span className="text-2xl">🍪</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md ml-auto animate-in slide-in-from-bottom-5 duration-500">
      <div className="bg-background border border-border rounded-lg shadow-lg p-6">
        {!showPreferences ? (
          <>
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">🍪</span>
              <div className="flex-1">
                <p className="text-sm text-foreground leading-relaxed">
                  We use cookies to personalize content, provide social media features, and analyze our traffic. The collection, sharing, and use of personal data can be used for the personalization of ads.
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(true)}
                  className="h-6 w-6 -mt-1"
                  title="Minimize"
                >
                  <span className="text-xs">−</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDecline}
                  className="h-6 w-6 -mt-1 -mr-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
              <a href="/privacy-policy" className="underline hover:text-primary">
                Learn more
              </a>
              <span>•</span>
              <a href="/privacy-policy" className="underline hover:text-primary">
                Google's Privacy Terms
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleAccept}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Accept
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPreferences(true)}
                  className="flex-1"
                >
                  Preferences
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDecline}
                  className="flex-1"
                >
                  Decline
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold">Cookie Preferences</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPreferences(false)}
                className="h-6 w-6 -mt-1 -mr-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Manage your cookie settings. Essential cookies are always enabled as they are necessary for the website to function.
            </p>

            <div className="space-y-4 mb-4 max-h-[60vh] overflow-y-auto">
              {/* Essential Cookies */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label htmlFor="essential" className="text-sm font-semibold cursor-pointer">
                    Essential Cookies
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Required for basic site functionality. These cannot be disabled.
                  </p>
                </div>
                <Switch
                  id="essential"
                  checked={preferences.essential}
                  disabled
                  className="mt-1"
                />
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label htmlFor="analytics" className="text-sm font-semibold cursor-pointer">
                    Analytics Cookies
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Help us understand how visitors interact with our website.
                  </p>
                </div>
                <Switch
                  id="analytics"
                  checked={preferences.analytics}
                  onCheckedChange={() => togglePreference('analytics')}
                  className="mt-1"
                />
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label htmlFor="marketing" className="text-sm font-semibold cursor-pointer">
                    Marketing Cookies
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Used to track visitors across websites for personalized ads.
                  </p>
                </div>
                <Switch
                  id="marketing"
                  checked={preferences.marketing}
                  onCheckedChange={() => togglePreference('marketing')}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPreferences(false)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSavePreferences}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Save Preferences
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
