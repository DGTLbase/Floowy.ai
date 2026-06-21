import { Coins, Plus } from "lucide-react";

interface PlanCreditsDisplayProps {
  plan: string;
  credits: number;
  onAddCredits: () => void;
}

const PlanCreditsDisplay = ({ plan, credits, onAddCredits }: PlanCreditsDisplayProps) => {
  return (
    <div className="hidden md:flex items-center">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary-glow rounded-lg opacity-20 group-hover:opacity-40 blur-sm transition duration-300"></div>
        <div className="relative bg-card border border-border rounded-lg px-3 py-1.5 flex items-center gap-2.5">
          {/* Plan Section */}
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide leading-none">
              Plan
            </span>
            <span className="text-xs font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent uppercase tracking-wide mt-0.5">
              {plan}
            </span>
          </div>
          
          <div className="w-px h-7 bg-border"></div>
          
          {/* Credits Section */}
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center">
              <Coins className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide leading-none">
                Credits
              </span>
              <span className="text-xs font-bold text-foreground mt-0.5">
                {credits.toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="w-px h-7 bg-border"></div>
          
          <button
            onClick={onAddCredits}
            className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-glow hover:shadow-glow flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            aria-label="Add credits"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanCreditsDisplay;
