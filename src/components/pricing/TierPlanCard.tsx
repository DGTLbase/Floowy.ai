import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type PaidTier } from "@/lib/tier-access";
import TierFeatureGroups from "@/components/pricing/TierFeatureGroups";
import { cn } from "@/lib/utils";

/**
 * Shared tier plan card used on every pricing surface (public pricing, €1 offer,
 * and the logged-in upgrade screen) so they all look identical. Renders the
 * header (name + €1 tag, price, credits/images), a caller-supplied CTA, and the
 * grouped, itemised feature list. The CTA differs per surface, so it's passed in.
 */
interface Props {
  tier: PaidTier;
  name: string;
  description: string;
  /** Display price (already resolved for the chosen billing cycle). */
  price: number;
  /** "mo" or "yr". */
  priceSuffix?: string;
  /** Optional strikethrough anchor price (e.g. yearly). */
  strikePrice?: number;
  /** Optional custom price block (e.g. the "€1 for 3 days" offer). Overrides the
   *  default price line. Credits/images still render below it. */
  priceContent?: ReactNode;
  /** Credits for the shown billing cycle. */
  credits: number;
  /** Images / month. */
  images: number;
  /** Coral "Best value" treatment. */
  highlighted?: boolean;
  /** Purple "Unlimited access" treatment (Enterprise). */
  enterprise?: boolean;
  /** "Your Current Plan" treatment (logged-in upgrade screen). */
  current?: boolean;
  /** Show the "€1 first 3 days" tag next to the name. */
  showEuroTag?: boolean;
  /** The call-to-action button for this surface. */
  cta: ReactNode;
}

const TierPlanCard = ({
  tier,
  name,
  description,
  price,
  priceSuffix = "mo",
  strikePrice,
  priceContent,
  credits,
  images,
  highlighted,
  enterprise,
  current,
  showEuroTag = true,
  cta,
}: Props) => (
  <Card
    className={cn(
      "relative transition-all duration-300 flex flex-col",
      // The highlighted card keeps overflow visible so its floating "Best Value"
      // pill can sit above the top edge; the others clip their full-width bars.
      current
        ? "overflow-hidden border-2 border-primary shadow-glow"
        : highlighted
          ? "shadow-offer md:scale-105 border-2 border-offer z-10"
          : enterprise
            ? "overflow-hidden border-2 border-violet-400/60 dark:border-violet-500/50"
            : "overflow-hidden border border-border/50",
    )}
  >
    {current ? (
      <div className="absolute top-0 inset-x-0 bg-primary text-primary-foreground text-center py-2 text-xs font-bold uppercase tracking-wider">
        Your Current Plan
      </div>
    ) : highlighted ? (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-offer px-4 py-1 text-xs font-bold uppercase tracking-wider text-offer-foreground">
        <Sparkles className="h-3.5 w-3.5" /> Best Value
      </div>
    ) : enterprise ? (
      <div className="absolute top-0 inset-x-0 bg-violet-500 text-white text-center py-2 text-xs font-bold tracking-wide">
        Unlimited access
      </div>
    ) : null}

    <CardHeader className={cn("pb-5", current || enterprise ? "pt-11" : "pt-6")}>
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <CardTitle className="text-2xl">{name}</CardTitle>
        {showEuroTag && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap",
              highlighted ? "bg-offer-soft text-offer-hover" : "bg-accent text-accent-foreground",
            )}
          >
            €1 first 3 days
          </span>
        )}
      </div>
      <CardDescription className="text-sm mb-4 min-h-[2.5rem]">{description}</CardDescription>
      {priceContent ?? (
        <>
          {strikePrice != null && strikePrice > 0 && (
            <div className="text-base font-bold text-muted-foreground line-through">€{strikePrice}</div>
          )}
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-bold text-foreground">{price}</span>
            <span className="text-sm text-muted-foreground">EUR/{priceSuffix}</span>
          </div>
        </>
      )}
      <p className="mt-1 text-sm text-muted-foreground">
        {credits} credits, {images} images
      </p>
    </CardHeader>

    <CardContent className="flex-1 flex flex-col">
      <div className="mb-6">{cta}</div>
      <TierFeatureGroups tier={tier} className="flex-1" />
    </CardContent>
  </Card>
);

export default TierPlanCard;
