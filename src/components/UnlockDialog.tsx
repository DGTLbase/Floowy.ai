import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";

interface UnlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional override for the heading copy. */
  title?: string;
  /** Optional override for the body copy. */
  description?: string;
}

/**
 * UnlockDialog
 *
 * Shown to free-tier users when they try to download or edit a watermarked
 * generation. Mirrors the Studioe paywall: explains the limitation and sends
 * users to the pricing page to upgrade.
 */
export function UnlockDialog({
  open,
  onOpenChange,
  title = "Unlock to download",
  description = "Image must be unlocked to download in full quality and use AI Edit. Upgrade to a paid plan to remove the watermark and access all features.",
}: UnlockDialogProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              navigate("/payment");
            }}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade to unlock
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}