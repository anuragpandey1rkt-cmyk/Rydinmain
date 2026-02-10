import { AlertCircle, Train, Bus, MapPin, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FallbackOption {
  type: "shuttle" | "train" | "bus";
  name: string;
  time: string;
  cost: string;
  duration: string;
  icon: React.ReactNode;
}

interface SmartFallbackSystemProps {
  origin: string;
  destination: string;
  isVisible: boolean;
  onChooseOption?: (option: string) => void;
}

const SmartFallbackSystem = ({
  origin,
  destination,
  isVisible,
  onChooseOption,
}: SmartFallbackSystemProps) => {
  if (!isVisible) return null;

  const fallbackOptions: FallbackOption[] = [
    {
      type: "shuttle",
      name: "SRM Shuttle (Free!)",
      time: "Departs 5:00 PM",
      cost: "Free",
      duration: "45 mins",
      icon: <Bus className="w-5 h-5" />,
    },
    {
      type: "train",
      name: "Local Train - Sheraton Station",
      time: "Departs 5:15 PM",
      cost: "₹20",
      duration: "30 mins",
      icon: <Train className="w-5 h-5" />,
    },
    {
      type: "bus",
      name: "MTC Bus Route 2",
      time: "Departs 4:50 PM",
      cost: "₹25",
      duration: "50 mins",
      icon: <Bus className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* No hopper found message */}
      <Card className="p-4 bg-amber-50 border border-amber-200">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 text-sm">
              No Hopper matches right now
            </h3>
            <p className="text-xs text-amber-800 mt-1">
              But don't worry! Here are the best alternatives to reach {destination}:
            </p>
          </div>
        </div>
      </Card>

      {/* Fallback options */}
      <div className="space-y-3">
        {fallbackOptions.map((option, index) => (
          <Card
            key={index}
            className="p-4 hover:shadow-lg transition-shadow cursor-pointer hover:border-primary"
            onClick={() => onChooseOption?.(option.type)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  {option.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm">{option.name}</h4>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{option.time}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{option.duration}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <Badge
                  className={
                    option.cost === "Free"
                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                      : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                  }
                >
                  {option.cost}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Messaging */}
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">💡 Smart Design:</span> Even when Hopper fails, you still
          save money or time. That's the Rydin promise.
        </p>
      </Card>

      {/* Create hopper retry */}
      <Card className="p-4 bg-purple-50 border border-purple-200">
        <p className="text-sm text-purple-900 mb-3">
          Want to wait for a Hopper match? Try again later.
        </p>
        <Button variant="outline" className="w-full">
          Check Hopper Matches Later
        </Button>
      </Card>
    </div>
  );
};

export default SmartFallbackSystem;
