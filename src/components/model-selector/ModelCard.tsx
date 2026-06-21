import { Card } from "@/components/ui/card";
import { Check, Crown, Eye } from "lucide-react";

interface ModelCardProps {
  id: string;
  url: string;
  preview: string;
  name: string;
  isPremium?: boolean;
  isSelected: boolean;
  onSelect: (url: string) => void;
  onPreview: () => void;
}

const ModelCard = ({ url, preview, name, isPremium, isSelected, onSelect, onPreview }: ModelCardProps) => {
  return (
    <Card
      className={`relative cursor-pointer overflow-hidden transition-all hover:scale-105 group ${
        isPremium ? "border-primary/30" : ""
      } ${isSelected ? "ring-2 ring-primary ring-offset-2" : ""}`}
      onClick={() => onSelect(url)}
    >
      <div className="aspect-[2/3] relative">
        <img
          src={preview}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {isSelected && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
            <div className="bg-primary rounded-full p-1">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        )}
        {isPremium && (
          <div className="absolute top-1 right-1">
            <Crown className="h-3 w-3 text-primary drop-shadow-md" />
          </div>
        )}
        {/* Preview button on hover */}
        <button
          className="absolute bottom-1 right-1 bg-background/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onPreview();
          }}
          title="View details"
        >
          <Eye className="h-3 w-3 text-foreground" />
        </button>
      </div>
      <div className="p-1.5 bg-background/95 text-center">
        <p className="text-xs font-medium truncate">{name}</p>
      </div>
    </Card>
  );
};

export default ModelCard;
