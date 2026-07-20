import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Info, TrendingUp, Clock, PiggyBank, Play } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Designer hourly rates by country (in EUR)
const DESIGNER_RATES: Record<string, number> = {
  "United States": 70,
  "United Kingdom": 65,
  "Canada": 60,
  "Australia": 63,
  "Germany": 55,
  "France": 53,
  "Netherlands": 58,
  "Spain": 46,
  "Italy": 48,
  "India": 23,
  "Other": 50
};

// Yearly plan costs for ROI calculation (matches stripe-config.ts)
const YEARLY_PLAN_COSTS = {
  starter: 470,       // €470/year
  professional: 1099, // €1,099/year
  enterprise: 2194    // €2,194/year
};

// Monthly prices (matches stripe-config.ts)
const MONTHLY_PLAN_PRICES = {
  starter: 49,        // €49/month
  professional: 119,  // €119/month
  enterprise: 229     // €229/month
};

const ROICalculator = () => {
  const [country, setCountry] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [creativesPerWeek, setCreativesPerWeek] = useState("");
  
  const [costSavings, setCostSavings] = useState<number | null>(null);
  const [timeSaved, setTimeSaved] = useState<number | null>(null);
  const [roi, setROI] = useState<number | null>(null);
  const [roiMultiplier, setROIMultiplier] = useState<number | null>(null);
  const [recommendedPlan, setRecommendedPlan] = useState<{name: string; price: number; monthlyPrice: number; isCustom?: boolean; annualPrice?: number} | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    if (country && teamSize && creativesPerWeek) {
      calculateROI();
    }
  }, [country, teamSize, creativesPerWeek]);

  const calculateROI = () => {
    if (!country || !teamSize || !creativesPerWeek) return;

    // Step 1: Get designer hourly rate for selected country
    const designerRate = DESIGNER_RATES[country] || DESIGNER_RATES["Other"];
    
    // Step 1: Get midpoint of weekly creatives
    const [min, max] = creativesPerWeek.split("-").map(Number);
    const weeklyCreativesMidpoint = (min + max) / 2;
    const maxWeeklyCreatives = max; // Use max for tier selection
    
    // Step 2: Convert to yearly total
    const yearlyCreatives = weeklyCreativesMidpoint * 52;
    
    // Step 3: Multiply by 1 hour per creative
    const hoursPerCreative = 1;
    const totalHours = yearlyCreatives * hoursPerCreative;
    
    // Step 4: Multiply hours by designer rate = Traditional Design Cost
    const traditionalCost = totalHours * designerRate;
    
    // Step 5: Determine plan tier using two-tier logic
    // - Use max weekly creatives to pick creative tier
    // - Use number of users to pick seat tier
    // - Select the higher-priced tier (smallest plan that satisfies BOTH)
    
    // Creative tier based on max weekly creatives
    let creativeTier: { name: string; yearlyPrice: number; monthlyPrice: number } = { 
      name: "Starter", 
      yearlyPrice: YEARLY_PLAN_COSTS.starter,
      monthlyPrice: MONTHLY_PLAN_PRICES.starter
    };
    if (maxWeeklyCreatives > 25) {
      creativeTier = { 
        name: "Enterprise", 
        yearlyPrice: YEARLY_PLAN_COSTS.enterprise,
        monthlyPrice: MONTHLY_PLAN_PRICES.enterprise
      };
    } else if (maxWeeklyCreatives > 5) {
      creativeTier = { 
        name: "Professional", 
        yearlyPrice: YEARLY_PLAN_COSTS.professional,
        monthlyPrice: MONTHLY_PLAN_PRICES.professional
      };
    }
    
    // Seat tier based on number of users
    const usersCount =
      teamSize === "1" ? 1 :
      teamSize === "2" ? 2 :
      teamSize === "3-10" ? 10 :
      teamSize === "11-25" ? 25 : 1;
    
    let seatTier: { name: string; yearlyPrice: number; monthlyPrice: number } = { 
      name: "Starter", 
      yearlyPrice: YEARLY_PLAN_COSTS.starter,
      monthlyPrice: MONTHLY_PLAN_PRICES.starter
    };
    if (usersCount > 10) {
      seatTier = { 
        name: "Enterprise", 
        yearlyPrice: YEARLY_PLAN_COSTS.enterprise,
        monthlyPrice: MONTHLY_PLAN_PRICES.enterprise
      };
    } else if (usersCount > 2) {
      seatTier = { 
        name: "Professional", 
        yearlyPrice: YEARLY_PLAN_COSTS.professional,
        monthlyPrice: MONTHLY_PLAN_PRICES.professional
      };
    }
    
    // Select the higher-priced tier (to satisfy both requirements)
    const selectedTier = seatTier.yearlyPrice >= creativeTier.yearlyPrice ? seatTier : creativeTier;
    const isCustom = maxWeeklyCreatives > 100 || usersCount > 25;
    
    let planName = selectedTier.name;
    let floowyYearlyCost = selectedTier.yearlyPrice;
    let monthlyPrice = selectedTier.monthlyPrice;
    
    if (isCustom) {
      planName = "Custom Plan";
      // Custom pricing estimate
      floowyYearlyCost = Math.max(YEARLY_PLAN_COSTS.enterprise, Math.ceil((usersCount * 180 + maxWeeklyCreatives * 60) / 100) * 100);
      monthlyPrice = Math.round(floowyYearlyCost / 12 * 1.2); // Custom monthly is ~20% more
    }
    
    // Step 6: ROI formula: (Traditional Design Cost – Floowy yearly fee) ÷ Floowy yearly fee
    const costSavingsAmount = traditionalCost - floowyYearlyCost;
    const roiMultiplierValue = floowyYearlyCost > 0 ? costSavingsAmount / floowyYearlyCost : 0;
    const finalMultiplier = Math.max(roiMultiplierValue, 0); // No cap, show actual value
    
    const timeInHours = totalHours;
    
    // Output: Savings, Hours saved, ROI amount
    // costSavings = traditionalCost - floowyPlanCost
    // roiAmount = costSavings - floowyPlanCost (net return after investment)
    const roiAmount = Math.max(costSavingsAmount - floowyYearlyCost, 0);
    
    setCostSavings(costSavingsAmount > 0 ? costSavingsAmount : 0);
    setTimeSaved(timeInHours);
    setROI(roiAmount);
    setROIMultiplier(finalMultiplier);
    setRecommendedPlan({ name: planName, price: monthlyPrice, monthlyPrice, isCustom, annualPrice: floowyYearlyCost });
  };

  return (
    <section className="container mx-auto px-4 pt-[31px] pb-10 md:pt-12 md:pb-14">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-header-dark mb-4">
            How Much Can <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Floowy.ai</span> Boost Your Efficiency?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            Take a 10-second quiz and get your personalized ROI estimate — powered by AI.
          </p>
        </div>

        <div className="space-y-6">
          {/* Form and Results in Two Columns */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Calculator Form - Left */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
              <CardContent className="p-8 space-y-6">
                <h3 className="text-2xl font-bold text-foreground">
                  Calculate your Return on Investment
                </h3>

                <div className="space-y-6 pb-4">
                  {/* Country Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="country" className="text-foreground font-medium">
                        Country of operation
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">This helps us calculate the typical designer hourly rate in your region</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger id="country" className="w-full">
                        <SelectValue placeholder="Please select" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(DESIGNER_RATES).map((countryName) => (
                          <SelectItem key={countryName} value={countryName}>
                            {countryName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Team Size */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="teamSize" className="text-foreground font-medium">
                        Number of team members who will use Floowy.ai
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">This determines the appropriate plan tier for your team</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select value={teamSize} onValueChange={setTeamSize}>
                      <SelectTrigger id="teamSize" className="w-full">
                        <SelectValue placeholder="Please select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 User</SelectItem>
                        <SelectItem value="2">2 Users</SelectItem>
                        <SelectItem value="3-10">3-10 Users</SelectItem>
                        <SelectItem value="11-25">11-25 Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Creatives Per Week */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="creatives" className="text-foreground font-medium">
                        How many creatives do you need per week on average?
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Estimated number of images or videos you need to create each week</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select value={creativesPerWeek} onValueChange={setCreativesPerWeek}>
                      <SelectTrigger id="creatives" className="w-full">
                        <SelectValue placeholder="Please select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-5">1-5 per week</SelectItem>
                        <SelectItem value="6-10">6-10 per week</SelectItem>
                        <SelectItem value="11-25">11-25 per week</SelectItem>
                        <SelectItem value="26-50">26-50 per week</SelectItem>
                        <SelectItem value="51-100">51-100 per week</SelectItem>
                        <SelectItem value="100-200">100+ per week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Display - Right */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">
                  Your Return on Investment with <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                    Floowy.ai
                  </span>
                </h3>
                
                {/* Large ROI Display */}
                <div className="text-center py-8">
                  <div className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                    {roiMultiplier !== null ? `${roiMultiplier.toFixed(1)}x` : "--"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {/* Cost Savings */}
                <Card className="border-border/50 bg-card shadow-sm">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground underline decoration-dotted whitespace-nowrap">Cost Savings</span>
                      <PiggyBank className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                    </div>
                    <div className="text-base sm:text-xl font-bold text-foreground whitespace-nowrap">
                      {costSavings !== null ? `${(costSavings / 1000).toFixed(1)}k EUR` : "-- EUR"}
                    </div>
                  </CardContent>
                </Card>

                {/* Time Saved */}
                <Card className="border-border/50 bg-card shadow-sm">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground underline decoration-dotted whitespace-nowrap">Time Saved</span>
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                    </div>
                    <div className="text-base sm:text-xl font-bold text-foreground">
                      {timeSaved !== null ? (
                        <><span className="whitespace-nowrap">≈ {timeSaved.toLocaleString()}</span><br className="sm:hidden" /><span className="sm:ml-1"> hours</span></>
                      ) : "-- hours"}
                    </div>
                  </CardContent>
                </Card>

                {/* ROI */}
                <Card className="border-border/50 bg-card shadow-sm">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground underline decoration-dotted">ROI</span>
                      <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                    </div>
                    <div className="text-base sm:text-xl font-bold text-foreground whitespace-nowrap">
                      {roi !== null ? `${(roi / 1000).toFixed(1)}k EUR` : "-- EUR"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-4 justify-center text-sm py-2">
                <span className="text-muted-foreground">Currency in EUR</span>
                <span className="text-muted-foreground">•</span>
                <span className="font-medium text-foreground">Annual Estimates</span>
              </div>
            </div>
          </div>

          {/* Disclaimer - Below Both Panels, Aligned Left */}
          <div className="text-left">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="link" className="text-sm text-muted-foreground hover:text-primary p-0 h-auto underline">
                  Disclaimer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>ROI Calculator Disclaimer</DialogTitle>
                </DialogHeader>
                <div className="text-left space-y-4 pt-4 text-muted-foreground">
                  <p>
                    The ROI calculator provided on this website is for informational and illustrative purposes only. The results are estimates based on the inputs you provide and general industry assumptions. Actual results may vary significantly depending on a variety of factors, including but not limited to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Your specific business model, industry, and market conditions</li>
                    <li>The accuracy and completeness of the data you enter</li>
                    <li>Regional variations in costs, labor rates, and economic conditions</li>
                    <li>Changes in technology, pricing, or service offerings</li>
                    <li>Individual team productivity and workflow efficiency</li>
                  </ul>
                  <p>
                    <strong>No Guarantee of Results:</strong> Floowy.ai does not guarantee any specific financial outcomes, cost savings, or return on investment. The calculator is a planning tool and should not be solely relied upon for making business or financial decisions.
                  </p>
                  <p>
                    <strong>Consult Professionals:</strong> Before making any significant business or financial commitments, we recommend consulting with qualified professionals such as accountants, financial advisors, or business consultants who can provide personalized advice based on your unique circumstances.
                  </p>
                  <p>
                    <strong>Limitation of Liability:</strong> By using this calculator, you acknowledge that Floowy.ai, its affiliates, and partners are not liable for any decisions made based on the calculator&apos;s output or for any direct, indirect, incidental, or consequential damages arising from its use.
                  </p>
                  <p>
                    For questions or concerns about this disclaimer, please contact us at <a href="mailto:hello@floowy.ai" className="text-primary hover:underline">hello@floowy.ai</a>.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Recommended Plan Card - Below Right Column */}
          <div className="grid md:grid-cols-2 gap-8">
            <div></div>
            <div>
              <Card className="border-border/50 bg-card shadow-lg">
                <CardContent className="p-6">
                  {recommendedPlan ? (
                    <>
                      <div className="mb-4">
                        <p className="text-sm font-medium bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent mb-1">Your recommended plan</p>
                        <h4 className="text-2xl font-bold text-foreground">{recommendedPlan.name}</h4>
                      </div>
                      
                      <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as "monthly" | "annual")} className="w-full mb-4">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="monthly">Monthly</TabsTrigger>
                          <TabsTrigger value="annual">
                            Annual
                            <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">-20%</span>
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                      
                      <div className="text-center mb-4">
                        {billingPeriod === "monthly" ? (
                          <div>
                            <p className="text-3xl font-bold text-foreground">
                              {recommendedPlan.price.toLocaleString()} EUR
                              <span className="text-base font-normal text-muted-foreground"> /month</span>
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-3xl font-bold text-foreground">
                              {recommendedPlan.annualPrice?.toLocaleString()} EUR
                              <span className="text-base font-normal text-muted-foreground"> /year</span>
                            </p>
                            <p className="text-sm text-primary font-medium mt-1">
                              Save {((recommendedPlan.monthlyPrice * 12) - (recommendedPlan.annualPrice || 0)).toLocaleString()} EUR per year
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <Link to={recommendedPlan.isCustom ? "/contact#message" : "/contact"} className="block">
                        <Button 
                          size="lg" 
                          className="w-full bg-offer hover:opacity-90 text-white shadow-lg"
                        >
                          {recommendedPlan.isCustom ? "Contact Sales" : "Start for €1"}
                          <Play className="w-4 h-4 ml-2 fill-white" />
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Complete the details in left side to unlock your recommended plan.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ROICalculator;
