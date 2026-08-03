import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Chrome, Eye, EyeOff, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";
// Version labels are recorded alongside the consent, so we can prove which
// document the user actually agreed to.
import { termsConditions, privacyPolicy } from "@/content/legal";
import TermsConsentCheckbox from "@/components/TermsConsentCheckbox";
import { stashConsent, redeemStashedConsent, needsConsent } from "@/lib/terms-consent";
import logoImage from "@/assets/floowy-logo.png";
import authBackground from "@/assets/auth-background.png";
import googleIcon from "@/assets/google-icon.png";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import teamNiels from "@/assets/team-niels.png";

// Import partner logos
import cetaphilLogo from "@/assets/cetaphil-logo.png";
import curlyGirlLogo from "@/assets/curly-girl-logo.png";
import lothLogo from "@/assets/loth-logo.png";
import marcelsGreenSoapLogo from "@/assets/marcels-green-soap-logo.png";
import nimaniLogo from "@/assets/nimani-logo.png";
import rbLogo from "@/assets/rb-logo.png";
import welhofLogo from "@/assets/welhof-logo.png";

// Gallery media for scrolling background (matches website ScrollingGallery)
import { useGalleryItems } from "@/hooks/useGalleryItems";

const emailSchema = z.string().email("Invalid email address").max(255);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain uppercase letter")
  .regex(/[a-z]/, "Must contain lowercase letter")
  .regex(/[0-9]/, "Must contain number")
  .regex(/[^A-Za-z0-9]/, "Must contain special character");

type SignupStep = 'details' | 'password';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  
  // Signup flow state
  const [signupStep, setSignupStep] = useState<SignupStep>('details');

  // T&C + Privacy consent. Unchecked by default is a hard legal requirement:
  // pre-ticked boxes are not valid consent under GDPR, so never seed this from
  // storage or props.
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const termsCheckboxRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Single-flight guard: initAuth (getSession) AND onAuthStateChange both see a
    // session on login and would each fire the redirect, so it ran 2–3× with racing
    // navigate() calls (inconsistent landing). Let whichever fires first own it.
    let redirectStarted = false;
    const startRedirect = (userId: string) => {
      if (redirectStarted) return;
      redirectStarted = true;
      // Small delay so the profile trigger has completed before we read it.
      setTimeout(() => checkRoleAndRedirect(userId), 500);
    };

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) startRedirect(session.user.id);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        console.log("[Auth] Auth state changed:", event);
        // Defer to avoid the auth-lock deadlock; guarded so it runs once.
        startRedirect(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);


  const handleAuthStateChange = async (event: string, session: any) => {
    checkRoleAndRedirect(session.user.id);
  };

  const checkRoleAndRedirect = async (userId: string, retryCount = 0) => {
    console.log("[Auth] Checking role and redirect for user:", userId, "retry:", retryCount);
    
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    // Check if onboarding is completed
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("onboarding_completed, plan")
      .eq("id", userId)
      .single();
    
    // Get user's auth provider information
    const { data: { user } } = await supabase.auth.getUser();
    const isGoogleUser = user?.app_metadata?.provider === 'google' || 
                         user?.identities?.some(identity => identity.provider === 'google');
    
    console.log("[Auth] Profile data:", { 
      onboardingCompleted: profile?.onboarding_completed,
      isGoogleUser,
      error: error?.message
    });

    // If profile doesn't exist yet and we haven't retried too many times, retry
    if (!profile && retryCount < 3) {
      console.log("[Auth] Profile not found, retrying in 500ms...");
      setTimeout(() => {
        checkRoleAndRedirect(userId, retryCount + 1);
      }, 500);
      return;
    }

    // OAuth returns here. If the user ticked consent before the redirect, redeem
    // it now — this is the only path that records consent for Google signups.
    // If there is nothing to redeem (abandoned mid-OAuth, or "Login" → Google
    // with no account), they stay unconsented and the onboarding gate catches
    // them. Admins are exempt: they are staff, not consumer signups.
    if (!data && await needsConsent(userId)) {
      await redeemStashedConsent();
    }

    // Existing/admin/onboarded accounts are not in the €1 signup funnel — drop
    // any funnel flags a Google signup-button click may have set.
    const clearFunnelFlags = () => {
      sessionStorage.removeItem("floowy_post_signup");
      sessionStorage.removeItem("floowy_show_personal_promo");
    };

    if (data) {
      console.log("[Auth] User is admin, redirecting to /admin");
      clearFunnelFlags();
      navigate("/admin");
    } else if (!profile?.onboarding_completed) {
      // New / incomplete signup — ANY method, including clicking "Login" then
      // "Google" without an account (that path never set the flags at click time).
      // Force the €1-funnel flags here so onboarding forwards to the offer (with the
      // "You're in 5%" promo), then to payment — instead of dropping them on /home.
      sessionStorage.setItem("floowy_post_signup", "1");
      sessionStorage.setItem("floowy_show_personal_promo", "1");
      console.log("[Auth] Onboarding not complete → /onboarding (€1 funnel armed)");
      navigate("/onboarding");
    } else {
      // Onboarded, non-admin. A paid plan ALWAYS wins: paid users go straight to
      // the app and are never held in the €1 funnel — even if a "Start for €1" /
      // Google-signup click left the funnel flag set in sessionStorage. Only
      // genuinely unpaid users are routed to the €1 offer.
      const plan = (profile?.plan || "").toLowerCase();
      let hasPaid = !!(plan && plan !== "free");
      if (!hasPaid) {
        try {
          const { data: sub } = await supabase.functions.invoke("check-subscription");
          // `subscribed` = full plan; `trialing` = €1-offer payer on an active trial.
          hasPaid = !!(sub?.subscribed || sub?.trialing);
        } catch {
          // Fail open on a transient check error so a paying customer is never
          // locked out of their dashboard.
          hasPaid = true;
        }
      }

      if (!hasPaid) {
        console.log("[Auth] Onboarded, unpaid → /pricing-1-euro-offer");
        navigate("/pricing-1-euro-offer");
        return;
      }

      clearFunnelFlags();
      const nextParam = searchParams.get("next");
      const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/home";
      console.log("[Auth] Paid & onboarded → redirecting to", safeNext);
      navigate(safeNext);
    }
  };

  // Step 1: Validate email and check if it exists, then move to password step
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailValidation = emailSchema.safeParse(email.trim());
    if (!emailValidation.success) {
      toast({
        title: "Invalid email",
        description: emailValidation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }
    
    if (!fullName.trim() || fullName.trim().length < 2) {
      toast({
        title: "Full name required",
        description: "Please enter your full name (at least 2 characters)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("[Auth] Checking email eligibility:", email.trim());

      // Check if email already exists using the backend function
      // (which has service role access to check auth.users and profiles)
      const { data: eligibilityData, error: eligibilityError } = await supabase.functions.invoke(
        "check-signup-eligibility",
        {
          body: { email: email.trim(), phone: null },
        }
      );

      if (eligibilityError) throw eligibilityError;

      if (!eligibilityData?.allowed) {
        if (eligibilityData.reason === "email_exists") {
          toast({
            title: "Email already registered",
            description: eligibilityData.message || "This email is already in use. Please use a different email or login.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: eligibilityData?.message || "Unable to proceed with this email.",
            variant: "destructive",
          });
        }
        setIsLoading(false);
        return;
      }

      console.log("[Auth] Email is available, proceeding to password step");
      setSignupStep('password');
    } catch (error: any) {
      console.error("[Auth] Error checking email:", error);
      toast({
        title: "Error",
        description: "Failed to verify email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  // Step 4: Create account with email and password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // The submit button is disabled until the box is ticked, so this is the
    // safety net for implicit submission (Enter in a field) and any future
    // caller — consent must never be bypassable.
    if (!acceptedTerms) {
      setTermsError(true);
      termsCheckboxRef.current?.focus();
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    const passwordValidation = passwordSchema.safeParse(password);
    if (!passwordValidation.success) {
      toast({
        title: "Weak password",
        description: passwordValidation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create Supabase user with email and password
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName.trim(),
            // Consent metadata. The handle_new_user trigger copies this onto
            // the profile in the same transaction as the account insert, and
            // stamps the accepted-at time server-side (see migration
            // 20260803120000_terms_consent_on_signup.sql).
            terms_accepted: true,
            terms_version: termsConditions.version,
            privacy_version: privacyPolicy.version,
          }
        }
      });

      if (signUpError) throw signUpError;

      if (!signUpData.user) {
        throw new Error("Failed to create account");
      }

      // Update profile with email and name
      await supabase
        .from("profiles")
        .update({ 
          email: email.trim(),
          full_name: fullName.trim(),
        } as any)
        .eq("id", signUpData.user.id);

      // Track IP
      await supabase.functions.invoke("track-user-ip", {
        body: {
          userId: signUpData.user.id,
        },
      });

      // Send admin notification (don't wait for it, fire and forget)
      supabase.functions.invoke("send-admin-signup-notification", {
        body: {
          userEmail: email.trim(),
          userName: fullName.trim(),
        },
      }).catch(err => console.error("Failed to send admin notification:", err));

      // Push dataLayer event for free account signup
      const { pushSignupEvent } = await import("@/lib/gtm-datalayer");
      pushSignupEvent();

      toast({
        title: "Account created",
        description: "Welcome! One last step to unlock your €1 access...",
      });

      // €1 launch funnel: capture onboarding first, then the €1 offer (which shows
      // the "You're in 5%" personal-discount popup). Flags persist through
      // onboarding so it can forward to the offer on completion.
      sessionStorage.setItem("floowy_post_signup", "1");
      sessionStorage.setItem("floowy_show_personal_promo", "1");
      navigate("/onboarding");
    } catch (error: any) {
      console.error("[Auth] Error creating account:", error);
      toast({
        title: "Error creating account",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const emailValidation = emailSchema.safeParse(email.trim());
      if (!emailValidation.success) {
        toast({
          title: "Invalid email",
          description: emailValidation.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }

      const { data: loginData, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Login failed",
            description: "Invalid email or password",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // Consent must be given before we hand off — the account is created during
    // the OAuth callback and signInWithOAuth carries no metadata, so this is the
    // last moment we control. Stash it now and redeem it on return.
    if (!isLogin) {
      if (!acceptedTerms) {
        setTermsError(true);
        termsCheckboxRef.current?.focus();
        return;
      }
      stashConsent();
    }

    setIsLoading(true);
    // €1 funnel: when signing UP with Google, flag so the post-OAuth redirect
    // lands on the €1 page with the "You're in 5%" popup. Cleared again in
    // checkRoleAndRedirect if the returning user turns out to be an existing
    // (already-onboarded) account, so logins don't get the funnel.
    if (!isLogin) {
      sessionStorage.setItem("floowy_post_signup", "1");
      sessionStorage.setItem("floowy_show_personal_promo", "1");
    }
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        toast({
          title: 'Google Sign-In Error',
          description: error.message,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (data?.url) {
        try {
          if (window.top && window.top !== window.self) {
            (window.top as Window).location.href = data.url;
          } else {
            window.location.href = data.url;
          }
        } catch {
          window.location.href = data.url;
        }
        return;
      }

      setIsLoading(false);
      toast({
        title: 'Google Sign-In',
        description: 'Unable to start Google sign-in',
        variant: 'destructive',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to initiate Google sign-in',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);

    try {
      const emailValidation = emailSchema.safeParse(resetEmail.trim());
      if (!emailValidation.success) {
        toast({
          title: "Invalid email",
          description: emailValidation.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.functions.invoke("request-password-reset", {
        body: { email: resetEmail.trim() },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Email sent",
        description: "If an account exists, a reset link has been sent",
      });
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  const galleryItems = useGalleryItems();
  // Distribute items round-robin across 3 columns to match home page gallery
  const galleryMedia: { src: string; alt: string; type: "image" | "video" }[][] = [[], [], []];
  galleryItems.forEach((item, i) => {
    galleryMedia[i % 3].push(item);
  });

  const partnerLogos = [
    cetaphilLogo, nimaniLogo, welhofLogo, lothLogo, curlyGirlLogo, rbLogo,
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Form Column */}
      <div className={`flex items-center justify-center p-4 lg:p-8 ${isLogin ? 'w-full' : 'w-full lg:w-1/2'}`}>
        <div className="w-full max-w-md">
          <div className="bg-card rounded-3xl shadow-2xl p-8 md:p-12 border border-border/50">
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <img src={logoImage} alt="Floowy.ai" className="h-12 w-auto" />
          </Link>

          {/* Heading */}
          <div className="text-center mb-8">
            {!isLogin && sessionStorage.getItem("pendingOffer") && (
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                Step 2 of 3 — your details
              </p>
            )}
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isLogin ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin ? "Sign in to continue creating" : 
               signupStep === 'details' ? "Enter your details" :
               "Set your password"}
            </p>
          </div>

          {/* Google Sign In. In SIGNUP mode this is gated on the same consent
              state as the email form: OAuth cannot carry consent into account
              creation, so it has to be given before we hand off to Google. */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-14 mb-6 text-base font-medium"
            onClick={handleGoogleSignIn}
            disabled={isLoading || (!isLogin && !acceptedTerms)}
          >
            <img src={googleIcon} alt="Google" className="w-6 h-6 mr-2" />
            {isLogin ? "Sign in with Google" : "Sign up with Google"}
          </Button>

          {/* Consent for the Google path. Rendered on the first signup step only
              — on the password step the same control sits above "Create
              Account" (briefed placement) and shares this state. */}
          {!isLogin && signupStep === 'details' && (
            <TermsConsentCheckbox
              id="terms-consent-oauth"
              checked={acceptedTerms}
              error={termsError}
              onChange={(next) => {
                setAcceptedTerms(next);
                if (next) setTermsError(false);
              }}
              className="-mt-2 mb-6"
            />
          )}

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-4 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Signup Step 1: Email & Full Name */}
          {!isLogin && signupStep === 'details' && (
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-12 h-14 text-base bg-muted/50 border-border/50"
                />
              </div>

              <Input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-14 text-base bg-muted/50 border-border/50"
               />

              <Button
                className="w-full h-14 text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}


          {/* Signup Step 3: Password */}
          {!isLogin && signupStep === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-12 pr-12 h-14 text-base bg-muted/50 border-border/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-12 pr-12 h-14 text-base bg-muted/50 border-border/50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* T&C consent — required, never pre-ticked. Shares state with the
                  Google gate above, so ticking either satisfies both. */}
              <TermsConsentCheckbox
                ref={termsCheckboxRef}
                id="terms-consent"
                checked={acceptedTerms}
                error={termsError}
                onChange={(next) => {
                  setAcceptedTerms(next);
                  if (next) setTermsError(false);
                }}
              />

              <Button
                type="submit"
                className="w-full h-14 text-base font-semibold"
                disabled={isLoading || !acceptedTerms}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          )}

          {/* Login Form */}
          {isLogin && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-12 h-14 text-base bg-muted/50 border-border/50"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-12 pr-12 h-14 text-base bg-muted/50 border-border/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <label htmlFor="remember" className="text-sm font-medium">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </div>
            </form>
          )}
        </div>
        </div>
      </div>

      {/* Right Column - Visual Content */}
      {!isLogin && (
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
        <div className="absolute inset-0 flex gap-4 p-4 will-change-transform">
          {galleryMedia.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="flex-1 flex flex-col gap-4"
              style={{
                animation: `scroll-vertical ${20 + rowIndex * 5}s linear infinite`,
                animationDirection: rowIndex % 2 === 0 ? "normal" : "reverse",
                willChange: "transform",
                transform: "translateZ(0)",
              }}
            >
              {row.map((media, mediaIndex) => (
                <div
                  key={mediaIndex}
                  className="relative rounded-2xl overflow-hidden aspect-[3/4] flex-shrink-0"
                >
                  {media.type === "video" ? (
                    <video
                      src={media.src}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={media.src}
                      alt={media.alt}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="absolute inset-x-0 bottom-0 h-[75%] bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col justify-end p-8 lg:p-12 w-full">
          <div className="mb-4">
            <div className="rounded-3xl p-8 max-w-md mx-auto text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-16 w-16 ring-2 ring-primary/30">
                  <AvatarImage src={teamNiels} />
                  <AvatarFallback>N</AvatarFallback>
                </Avatar>
              </div>
              
              <div className="mb-3">
                <p className="font-bold text-lg">Niels</p>
                <p className="text-sm text-muted-foreground">
                  Head of Marketing at Nimani
                </p>
              </div>
              
              <div className="flex gap-1 justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              
              <p className="text-foreground leading-relaxed text-base italic">
                "Floowy.ai has completely changed how we create visuals for campaigns."
              </p>
            </div>
          </div>

          <div className="rounded-3xl p-6 max-w-md mx-auto">
            <p className="text-center text-sm font-medium text-muted-foreground mb-5">
              Trusted by leading brands
            </p>
            <div className="flex items-center justify-between gap-3">
              {partnerLogos.map((logo, index) => (
                <div key={index} className="flex items-center justify-center flex-shrink-0">
                  <img
                    src={logo}
                    alt={`Partner ${index + 1}`}
                    className="h-6 w-auto max-w-[80px] object-contain opacity-70 grayscale"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email to receive a reset link
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="pl-12 h-12"
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForgotPassword(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isResetLoading}
                className="flex-1"
              >
                {isResetLoading ? "Sending..." : "Send Link"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
