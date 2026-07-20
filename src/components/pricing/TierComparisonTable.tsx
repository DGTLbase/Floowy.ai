import { Check, X } from "lucide-react";
import { PAID_TIERS, TIER_FEATURE_MATRIX, type PaidTier } from "@/lib/tier-access";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe-config";
import { cn } from "@/lib/utils";

/**
 * 4-column tier feature comparison (Lite / Starter / Professional / Enterprise),
 * driven entirely by TIER_FEATURE_MATRIX so every pricing surface stays in sync.
 * Each feature row shows an explicit check or cross per tier — no omitted rows.
 * Enterprise inherits Professional in the matrix, so it never needs its own list.
 */

const COLUMN_META: Record<PaidTier, { name: string; price: number; credits: number }> = {
  lite: { name: "Lite", price: SUBSCRIPTION_PLANS.lite.monthly.price, credits: SUBSCRIPTION_PLANS.lite.monthly.credits },
  starter: { name: "Starter", price: SUBSCRIPTION_PLANS.starter.monthly.price, credits: SUBSCRIPTION_PLANS.starter.monthly.credits },
  professional: { name: "Professional", price: SUBSCRIPTION_PLANS.professional.monthly.price, credits: SUBSCRIPTION_PLANS.professional.monthly.credits },
  enterprise: { name: "Enterprise", price: SUBSCRIPTION_PLANS.enterprise.monthly.price, credits: SUBSCRIPTION_PLANS.enterprise.monthly.credits },
};

interface Props {
  /** Optional tier column to visually emphasise (e.g. the recommended plan). */
  highlight?: PaidTier;
  className?: string;
}

const Cell = ({ included }: { included: boolean }) =>
  included ? (
    <Check className="mx-auto h-4 w-4 text-primary" aria-label="Included" />
  ) : (
    <X className="mx-auto h-4 w-4 text-muted-foreground/40" aria-label="Not included" />
  );

const TierComparisonTable = ({ highlight, className }: Props) => (
  <div className={cn("w-full overflow-x-auto", className)}>
    <table className="w-full min-w-[640px] border-collapse text-sm">
      <thead>
        <tr>
          <th className="w-[30%] p-3 text-left align-bottom" />
          {PAID_TIERS.map((tier) => {
            const meta = COLUMN_META[tier];
            const isHi = highlight === tier;
            return (
              <th
                key={tier}
                className={cn(
                  "p-3 text-center align-bottom border-b border-border",
                  isHi && "bg-offer-soft rounded-t-xl",
                )}
              >
                <div className={cn("text-sm font-bold", isHi ? "text-offer-hover" : "text-foreground")}>
                  {meta.name}
                </div>
                <div className="mt-0.5 text-xs font-medium text-muted-foreground">
                  €{meta.price}
                  <span className="font-normal">/mo</span>
                </div>
                <div className="text-[11px] text-muted-foreground">{meta.credits} credits</div>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {TIER_FEATURE_MATRIX.map((row, ri) => (
          <tr key={row.label} className={ri % 2 ? "bg-muted/20" : ""}>
            <td className="p-3 text-left font-medium text-foreground border-t border-border/50">
              {row.label}
            </td>
            {PAID_TIERS.map((tier) => {
              const isHi = highlight === tier;
              return (
                <td
                  key={tier}
                  className={cn(
                    "p-3 text-center border-t border-border/50",
                    isHi && "bg-offer-soft/50",
                  )}
                >
                  {row.kind === "value" ? (
                    <span className="font-semibold text-foreground">{row.values[tier]}</span>
                  ) : (
                    <Cell included={row.tiers[tier]} />
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default TierComparisonTable;
