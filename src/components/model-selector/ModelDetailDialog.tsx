import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, User } from "lucide-react";
import type { ModelData } from "./modelData";

interface ModelDetailDialogProps {
  model: (ModelData & { isPremium?: boolean }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSelected: boolean;
  onSelect: (url: string) => void;
}

const ModelDetailDialog = ({ model, open, onOpenChange, isSelected, onSelect }: ModelDetailDialogProps) => {
  if (!model) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogTitle className="sr-only">{model.name} - Avatar Details</DialogTitle>
        <div className="relative">
          <img
            src={model.preview}
            alt={model.name}
            className="w-full aspect-[3/4] object-cover"
          />
          {model.isPremium && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="gap-1 bg-primary/90 text-primary-foreground">
                <Crown className="h-3 w-3" />
                Premium
              </Badge>
            </div>
          )}
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">{model.name}</h3>
            {isSelected && (
              <Badge variant="secondary" className="gap-1 bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
                Selected
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <User className="h-3 w-3" />
              {model.gender.charAt(0).toUpperCase() + model.gender.slice(1)}
            </Badge>
            {'ethnicity' in model && (
              <Badge variant="outline">{(model as ModelData).ethnicity}</Badge>
            )}
          </div>

          <Button
            className="w-full"
            variant={isSelected ? "outline" : "default"}
            onClick={() => {
              onSelect(model.url);
              onOpenChange(false);
            }}
          >
            {isSelected ? "Currently Selected" : "Select This Avatar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModelDetailDialog;
