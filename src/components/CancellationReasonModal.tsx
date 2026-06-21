import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle, ShieldOff, Gift, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CancellationReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, details: string) => void;
  isLoading?: boolean;
}

const CancellationReasonModal = ({ open, onOpenChange, onConfirm, isLoading }: CancellationReasonModalProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);
  const { toast } = useToast();

  const reasons = [
    { value: "too-expensive", label: "Too expensive" },
    { value: "not-using-enough", label: "Not using it enough" },
    { value: "missing-features", label: "Missing features I need" },
    { value: "poor-quality", label: "Output quality not satisfactory" },
    { value: "switching-competitor", label: "Switching to a competitor" },
    { value: "technical-issues", label: "Technical issues or bugs" },
    { value: "other", label: "Other reason" },
  ];

  const handleClose = () => {
    setStep(1);
    setSelectedReason("");
    setAdditionalDetails("");
    setDiscountApplied(false);
    onOpenChange(false);
  };

  const handleAcceptDiscount = async () => {
    setApplyingDiscount(true);
    try {
      const { data, error } = await supabase.functions.invoke("apply-retention-discount");

      if (error) throw error;

      if (data?.success) {
        setDiscountApplied(true);
        toast({
          title: "Discount Applied! 🎉",
          description: "20% off has been applied to your subscription. Welcome back!",
        });
        setTimeout(() => handleClose(), 2000);
      } else {
        toast({
          title: "Could not apply discount",
          description: data?.error || "Please contact support.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error applying discount:", error);
      toast({
        title: "Error",
        description: "Failed to apply discount. Please try again.",
        variant: "destructive",
      });
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleFinalCancel = () => {
    if (!selectedReason) return;
    onConfirm(selectedReason, additionalDetails);
  };

  // Step indicators
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={`h-2 rounded-full transition-all duration-300 ${
            s === step ? "w-8 bg-primary" : s < step ? "w-8 bg-primary/40" : "w-8 bg-muted"
          }`}
        />
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <StepIndicator />

        {/* STEP 1: First confirmation */}
        {step === 1 && (
          <>
            <DialogHeader className="flex-shrink-0 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                <AlertTriangle className="w-7 h-7 text-destructive" />
              </div>
              <DialogTitle className="text-2xl">
                Are you sure you want to cancel?
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                You're about to cancel your subscription. This action will take effect at the end of your current billing period.
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-3 pt-6">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Keep My Subscription
              </Button>
              <Button
                variant="destructive"
                onClick={() => setStep(2)}
                className="flex-1"
              >
                Yes, I Want to Cancel
              </Button>
            </div>
          </>
        )}

        {/* STEP 2: Loss of benefits + reason */}
        {step === 2 && (
          <>
            <DialogHeader className="flex-shrink-0">
              <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                <ShieldOff className="w-7 h-7 text-destructive" />
              </div>
              <DialogTitle className="text-2xl text-center">
                You'll lose access to your benefits
              </DialogTitle>
              <DialogDescription className="text-base mt-2 text-center">
                By cancelling, you will lose access to all platform features and benefits. Please help us improve by sharing your reason.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4 overflow-y-auto flex-1">
              {/* Benefits being lost */}
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-destructive mb-2">What you'll lose:</p>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                  <li>All monthly credits</li>
                  <li>Access to all AI studio tools</li>
                  <li>Priority generation queue</li>
                  <li>Saved generations and history</li>
                </ul>
              </div>

              {/* Reason Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">What's the main reason?</Label>
                <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                  {reasons.map((reason) => (
                    <div key={reason.value} className="flex items-start space-x-3 space-y-0">
                      <RadioGroupItem value={reason.value} id={reason.value} className="mt-0.5" />
                      <Label
                        htmlFor={reason.value}
                        className="font-normal cursor-pointer text-sm leading-relaxed"
                      >
                        {reason.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Additional Details */}
              <div className="space-y-2">
                <Label htmlFor="details" className="text-sm font-semibold">
                  Additional details (optional)
                </Label>
                <Textarea
                  id="details"
                  placeholder="Tell us more about your experience..."
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  className="min-h-[80px] resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {additionalDetails.length}/500
                </p>
              </div>

              {/* Acknowledgement */}
              <p className="text-sm text-muted-foreground italic text-center">
                I understand that I will lose my benefits.
              </p>
            </div>

            <div className="flex gap-3 flex-shrink-0 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                onClick={() => setStep(3)}
                disabled={!selectedReason}
                className="flex-1"
              >
                Continue Cancellation
              </Button>
            </div>
          </>
        )}

        {/* STEP 3: Retention offer */}
        {step === 3 && (
          <>
            <DialogHeader className="flex-shrink-0 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                {discountApplied ? (
                  <CheckCircle className="w-7 h-7 text-primary" />
                ) : (
                  <Gift className="w-7 h-7 text-primary" />
                )}
              </div>
              <DialogTitle className="text-2xl">
                {discountApplied ? "Welcome Back! 🎉" : "Before you go..."}
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                {discountApplied
                  ? "Your 20% discount has been applied. Enjoy your subscription!"
                  : "We'd love you to stay. Here's a special offer just for you."
                }
              </DialogDescription>
            </DialogHeader>

            {!discountApplied && (
              <div className="py-4 space-y-5">
                {/* Discount offer card */}
                <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/30 rounded-xl p-6 text-center">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
                    SPECIAL OFFER
                  </div>
                  <p className="text-4xl font-black text-primary mt-2">20% OFF</p>
                  <p className="text-lg font-semibold text-foreground mt-1">
                    on your current subscription
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Keep full access to all features and benefits at a reduced price.
                  </p>
                </div>

                {/* Benefits reminder */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-foreground mb-2">Keep enjoying:</p>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      All your monthly credits
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      Full access to all AI studio tools
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      Priority generation queue
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      Your saved generations and history
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {!discountApplied && (
              <div className="flex flex-col gap-3 flex-shrink-0 pt-4 border-t border-border">
                <Button
                  onClick={handleAcceptDiscount}
                  disabled={applyingDiscount || isLoading}
                  className="w-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-glow text-base py-6"
                >
                  {applyingDiscount ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Applying Discount...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Accept 20% Off & Stay
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleFinalCancel}
                  disabled={applyingDiscount || isLoading}
                  className="w-full text-muted-foreground hover:text-destructive"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Canceling...
                    </>
                  ) : (
                    "No thanks, cancel my subscription"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CancellationReasonModal;
