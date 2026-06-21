import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, CheckCircle } from "lucide-react";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  amount: number;
  credits?: number;
  onPaymentComplete: () => void;
}

const PaymentDialog = ({ open, onOpenChange, planName, amount, credits, onPaymentComplete }: PaymentDialogProps) => {
  const [step, setStep] = useState<"payment" | "success">("payment");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStep("success");
    setIsProcessing(false);
    
    // Complete payment after 2 seconds
    setTimeout(() => {
      onPaymentComplete();
      setStep("payment");
      setCardNumber("");
      setExpiryDate("");
      setCvv("");
      setCardName("");
    }, 2000);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    return formatted.slice(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const isFormValid = cardNumber.replace(/\s/g, "").length === 16 && 
                      expiryDate.length === 5 && 
                      cvv.length === 3 && 
                      cardName.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === "payment" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Details
              </DialogTitle>
              <DialogDescription>
                {credits ? `Purchase ${credits} credits` : `Subscribe to ${planName} plan`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    maxLength={3}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span className="text-primary">€{amount}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handlePayment}
              disabled={!isFormValid || isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? "Processing..." : `Pay €${amount}`}
            </Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 justify-center text-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </DialogTitle>
            </DialogHeader>
            <div className="py-8 text-center space-y-4">
              <h3 className="text-2xl font-bold text-foreground">Payment Successful!</h3>
              <p className="text-muted-foreground">
                {credits 
                  ? `${credits} credits have been added to your account`
                  : `You've been upgraded to ${planName}`
                }
              </p>
              <div className="pt-4">
                <CheckCircle className="w-16 h-16 mx-auto text-primary animate-pulse" />
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
