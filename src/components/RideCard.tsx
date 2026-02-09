import { motion } from "framer-motion";
import { MapPin, Clock, Users, Star, Shield, Plane } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Ride } from "@/data/mockRides";

interface RideCardProps {
  ride: Ride;
  index: number;
  onJoin?: (id: string) => void;
}

const RideCard = ({ ride, index, onJoin }: RideCardProps) => {
  const seatsLeft = ride.seatsTotal - ride.seatsTaken;
  const farePerPerson = Math.round(ride.estimatedFare / (ride.seatsTaken + 1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Route */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex flex-col items-center gap-1 mt-1">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-0.5 h-6 bg-border" />
          <div className="w-2 h-2 rounded-full bg-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{ride.source}</p>
          <p className="text-base font-semibold font-display truncate mt-1">{ride.destination}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold font-display text-primary">₹{farePerPerson}</p>
          <p className="text-xs text-muted-foreground">/person</p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {ride.date.slice(5)} · {ride.time}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {seatsLeft} seat{seatsLeft !== 1 ? "s" : ""} left
        </span>
        {ride.flightTrain && (
          <span className="flex items-center gap-1">
            <Plane className="w-3 h-3" />
            {ride.flightTrain}
          </span>
        )}
      </div>

      {/* Tags & Host */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {ride.girlsOnly && (
            <Badge variant="outline" className="text-xs border-safety text-safety gap-1">
              <Shield className="w-3 h-3" /> Girls only
            </Badge>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="w-3 h-3 fill-primary text-primary" />
            {ride.hostRating} · {ride.hostName}
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => onJoin?.(ride.id)}
          disabled={seatsLeft === 0}
          className="h-8 text-xs font-semibold"
        >
          {seatsLeft === 0 ? "Full" : "Join"}
        </Button>
      </div>
    </motion.div>
  );
};

export default RideCard;
