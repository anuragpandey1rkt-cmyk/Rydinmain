import { Users, Clock, MapPin, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface EventRideRoom {
  id: string;
  type: "to_event" | "from_event";
  departure_time: string;
  joined_users: number;
  max_capacity: number;
}

interface EventAutoRideRoomsProps {
  eventName: string;
  eventTime: string;
  eventLocation: string;
  rideRooms: EventRideRoom[];
  interestedCount: number;
  onCreateRide?: () => void;
  onJoinRide?: (roomId: string) => void;
}

const EventAutoRideRooms = ({
  eventName,
  eventTime,
  eventLocation,
  rideRooms,
  interestedCount,
  onCreateRide,
  onJoinRide,
}: EventAutoRideRoomsProps) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-sm">Rides to {eventName}</h3>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Users className="w-3 h-3" />
            {interestedCount} students going
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">🚗 Auto Created</Badge>
      </div>

      {/* Magic message */}
      <Card className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <p className="text-xs text-blue-900 font-medium">
          ✨ <span className="font-bold">Smart Feature:</span> We created rides automatically so you don't have to!
        </p>
      </Card>

      {/* Ride rooms */}
      <div className="space-y-3">
        {/* Going to event */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">🚗 TO EVENT</h4>
          {rideRooms
            .filter((r) => r.type === "to_event")
            .map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="mb-2"
              >
                <Card className="p-3 bg-green-50 border border-green-200 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-sm">{room.departure_time}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Users className="w-3 h-3" />
                        <span>
                          {room.joined_users}/{room.max_capacity} people
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onJoinRide?.(room.id)}
                      disabled={room.joined_users >= room.max_capacity}
                      className="text-xs"
                    >
                      {room.joined_users >= room.max_capacity ? "Full" : "Join"}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
        </div>

        {/* Returning from event */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">🏠 RETURN</h4>
          {rideRooms
            .filter((r) => r.type === "from_event")
            .map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index + 2) * 0.1 }}
                className="mb-2"
              >
                <Card className="p-3 bg-blue-50 border border-blue-200 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-sm">{room.departure_time}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Users className="w-3 h-3" />
                        <span>
                          {room.joined_users}/{room.max_capacity} people
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onJoinRide?.(room.id)}
                      disabled={room.joined_users >= room.max_capacity}
                      className="text-xs"
                    >
                      {room.joined_users >= room.max_capacity ? "Full" : "Join"}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Create custom ride option */}
      <Button
        onClick={onCreateRide}
        variant="outline"
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Custom Ride
      </Button>

      {/* Demo insight */}
      <Card className="p-3 bg-yellow-50 border border-yellow-200">
        <p className="text-xs text-yellow-900">
          <span className="font-bold">🔥 Demo insight:</span> "We don't wait for users to create rides. We create rides around intent." This is proactive product design.
        </p>
      </Card>
    </div>
  );
};

export default EventAutoRideRooms;
