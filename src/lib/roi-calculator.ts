export interface ROIInput {
  weeklyMinCreatives: number;
  weeklyMaxCreatives: number;
  designerHourlyRate: number;
  userCount: number;
}

export interface ROIResult {
  costSavingsEur: number;
  roiAmountEur: number;
  roiMultiplier: number;
  timeSavedHours: number;
  yearlyPlanCostEur: number;
  planName: string;
}

const YEARLY_PLAN_COSTS = {
  starter: 588,
  professional: 1428,
  enterprise: 11988,
};

const PLAN_LIMITS = {
  starter: { maxUsers: 1, maxWeeklyCreatives: 10 },
  professional: { maxUsers: 3, maxWeeklyCreatives: 50 },
  enterprise: { maxUsers: 25, maxWeeklyCreatives: Infinity },
};

function pickPlan(userCount: number, weeklyMaxCreatives: number): { cost: number; name: string } {
  // Pick the smallest plan that satisfies BOTH user count and creative volume
  if (userCount <= PLAN_LIMITS.starter.maxUsers && weeklyMaxCreatives <= PLAN_LIMITS.starter.maxWeeklyCreatives) {
    return { cost: YEARLY_PLAN_COSTS.starter, name: 'Starter' };
  }
  
  if (userCount <= PLAN_LIMITS.professional.maxUsers && weeklyMaxCreatives <= PLAN_LIMITS.professional.maxWeeklyCreatives) {
    return { cost: YEARLY_PLAN_COSTS.professional, name: 'Professional' };
  }
  
  return { cost: YEARLY_PLAN_COSTS.enterprise, name: 'Enterprise' };
}

export function calculateFloowyROI(input: ROIInput): ROIResult {
  const { weeklyMinCreatives, weeklyMaxCreatives, designerHourlyRate, userCount } = input;

  // Step 1: Compute midpoint of weekly creative range
  const weeklyMid = (weeklyMinCreatives + weeklyMaxCreatives) / 2;

  // Step 2: Compute creatives per year
  const creativesPerYear = weeklyMid * 52;

  // Step 3: Time saved (1 hour per creative)
  const timeSavedHours = creativesPerYear;

  // Step 4: Traditional yearly design cost
  const traditionalCost = timeSavedHours * designerHourlyRate;

  // Step 5: Pick Floowy plan
  const { cost: yearlyPlanCostEur, name: planName } = pickPlan(userCount, weeklyMaxCreatives);

  // Step 6: Cost savings
  const costSavingsEur = Math.max(traditionalCost - yearlyPlanCostEur, 0);

  // Step 7: ROI amount (net return)
  const roiAmountEur = Math.max(costSavingsEur - yearlyPlanCostEur, 0);

  // Step 8: ROI multiplier (capped at 10.8x)
  const rawMultiplier = yearlyPlanCostEur > 0 ? costSavingsEur / yearlyPlanCostEur : 0;
  const roiMultiplier = Math.min(rawMultiplier, 10.8);

  // Round values
  return {
    costSavingsEur: Math.round(costSavingsEur / 100) * 100,
    roiAmountEur: Math.round(roiAmountEur / 100) * 100,
    roiMultiplier: Math.round(roiMultiplier * 10) / 10,
    timeSavedHours: Math.round(timeSavedHours),
    yearlyPlanCostEur,
    planName,
  };
}
