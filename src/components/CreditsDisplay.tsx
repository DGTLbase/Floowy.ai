import { Coins, Plus } from "lucide-react";

interface CreditsDisplayProps {
  credits: number;
  onAddCredits?: () => void;
}

const CreditsDisplay = ({ credits, onAddCredits }: CreditsDisplayProps) => {
  return (
    <div 
      className="flex items-center gap-2 bg-accent/50 px-4 py-2 rounded-full cursor-pointer hover:bg-accent transition-colors"
      onClick={onAddCredits}
    >
      <Coins className="w-4 h-4 text-yellow-500" />
      <span className="font-medium text-sm text-foreground">
        {credits} {credits === 1 ? "credit" : "credits"}
      </span>
      <Plus className="w-4 h-4 text-foreground" />
    </div>
  );
};

export default CreditsDisplay;