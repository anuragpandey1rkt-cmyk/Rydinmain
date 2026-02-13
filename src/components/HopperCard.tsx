import { MapPin, Clock, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HopperCardProps {
  hopper: {
    id: string;
    user_id: string;
    pickup_location: string;
    drop_location: string;
    departure_date: string;
    departure_time: string;
    user_name?: string;
    user_gender?: string;
  };
  onJoin: () => void;
}

const HopperCard = ({ hopper, onJoin }: HopperCardProps) => {
  const getInitials = (name?: string) => {
    return (name || "U")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (gender?: string) => {
    if (gender === "female") return "bg-pink-100";
    if (gender === "male") return "bg-blue-100";
    return "bg-gray-100";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="space-y-3">
        {/* Header with User Info */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className={`w-12 h-12 ${getAvatarColor(hopper.user_gender)}`}>
              <AvatarFallback>{getInitials(hopper.user_name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-sm">{hopper.user_name || "Student"}</p>
              <p className="text-xs text-muted-foreground">
                {hopper.user_gender ? hopper.user_gender.charAt(0).toUpperCase() + hopper.user_gender.slice(1) : ""}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            Available
          </Badge>
        </div>

        {/* Route Info */}
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center gap-3 justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{hopper.pickup_location}</p>
              <p className="text-xs text-muted-foreground">Pickup</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1 text-right">
              <p className="text-sm font-medium truncate">{hopper.drop_location}</p>
              <p className="text-xs text-muted-foreground">Dropoff</p>
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{hopper.departure_time}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="text-xs bg-muted px-2 py-1 rounded">
              {formatDate(hopper.departure_date)}
            </span>
          </div>
        </div>

        {/* Join Button */}
        <Button
          onClick={onJoin}
          className="w-full h-10 text-sm font-semibold gap-2"
        >
          Join This Hopper
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

const Badge = ({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}) => {
  const baseClasses = "inline-block px-2 py-1 rounded-md font-medium";
  const variants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-muted text-muted-foreground",
  };

  return (
    <span className={`${baseClasses} ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </span>
  );
};

export default HopperCard;
