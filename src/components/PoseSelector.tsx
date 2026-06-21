import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

interface PoseSelectorProps {
  selectedPose: string;
  onPoseSelect: (pose: string) => void;
}

const PoseSelector = ({ selectedPose, onPoseSelect }: PoseSelectorProps) => {
  const poses = [
    { id: "standing", name: "Standing", description: "Natural standing pose, facing forward" },
    { id: "casual", name: "Casual", description: "Relaxed pose with hands in pockets or arms crossed" },
    { id: "walking", name: "Walking", description: "Dynamic walking pose, mid-stride" },
    { id: "sitting", name: "Sitting", description: "Seated pose, comfortable position" },
    { id: "side-view", name: "Side View", description: "Standing pose, side profile view" },
    { id: "action", name: "Action", description: "Dynamic action pose, movement captured" },
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-lg font-semibold mb-4">Select Pose</h3>
      <div className="grid grid-cols-2 gap-4">
        {poses.map((pose) => (
          <Card
            key={pose.id}
            className={`relative cursor-pointer overflow-hidden transition-all hover:scale-105 ${
              selectedPose === pose.id
                ? "ring-2 ring-primary ring-offset-2"
                : ""
            }`}
            onClick={() => onPoseSelect(pose.id)}
          >
            <div className="p-4">
              <h4 className="font-semibold mb-2">{pose.name}</h4>
              <p className="text-xs text-muted-foreground">{pose.description}</p>
              {selectedPose === pose.id && (
                <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PoseSelector;
