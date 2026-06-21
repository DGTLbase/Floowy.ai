import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface FashionPromptInputProps {
  isGenerating: boolean;
  hasProduct: boolean;
  hasModel: boolean;
  credits: number;
  creditCost: number;
  onGenerate: () => void;
  isAdmin?: boolean;
}

const FashionPromptInput = ({
  isGenerating,
  hasProduct,
  hasModel,
  credits,
  creditCost,
  onGenerate,
  isAdmin = false,
}: FashionPromptInputProps) => {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="space-y-4">
        <Button
          onClick={onGenerate}
          disabled={isGenerating || !hasProduct || !hasModel || (!isAdmin && credits < creditCost)}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>Generating...</>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate ({creditCost} {creditCost === 1 ? 'credit' : 'credits'})
            </>
          )}
        </Button>

        {!hasProduct && (
          <p className="text-sm text-muted-foreground text-center">
            Please upload a product image to continue
          </p>
        )}

        {!hasModel && hasProduct && (
          <p className="text-sm text-muted-foreground text-center">
            Please select a model to continue
          </p>
        )}

        {!isAdmin && credits < creditCost && (
          <p className="text-sm text-destructive text-center">
            You need at least {creditCost} {creditCost === 1 ? 'credit' : 'credits'} to generate
          </p>
        )}
      </div>
    </div>
  );
};

export default FashionPromptInput;