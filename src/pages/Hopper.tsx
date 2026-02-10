import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Users, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import HopperCard from "@/components/HopperCard";
import { useRealtimeHoppers } from "@/hooks/useRealtimeHoppers";
import { useToast } from "@/hooks/use-toast";

const Hopper = () => {
  const [mode, setMode] = useState<"view" | "create">("view");
  const { hoppers, isLoading, error } = useRealtimeHoppers();
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [flexibility, setFlexibility] = useState(30);
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleCreateHopper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsCreating(true);

      if (
        !fromLocation.trim() ||
        !toLocation.trim() ||
        !departureDate ||
        !departureTime
      ) {
        throw new Error("Please fill in all fields");
      }

      const { error } = await supabase.from("hoppers").insert({
        user_id: user.id,
        pickup_location: fromLocation,
        drop_location: toLocation,
        date: departureDate,
        departure_time: departureTime,
        flexibility_minutes: flexibility,
        status: "active",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Hopper created! Other students can now find your ride.",
      });

      setFromLocation("");
      setToLocation("");
      setDepartureDate("");
      setDepartureTime("");
      setFlexibility(30);
      setMode("view");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create hopper",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinHopper = async (hopperId: string) => {
    try {
      toast({
        title: "Success",
        description: "Request sent! Waiting for driver approval.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join hopper",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Hoppers</h1>
              <p className="text-sm text-muted-foreground">
                Find co-passengers for your trip (Real-time)
              </p>
            </div>
            {mode === "view" && (
              <Button
                onClick={() => setMode("create")}
                size="icon"
                className="rounded-lg"
              >
                <Plus className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode("view")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "view"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Find Hoppers
            </button>
            <button
              onClick={() => setMode("create")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "create"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Create Hopper
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {mode === "view" ? (
          // View Mode - List Hoppers
          isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading hoppers in real-time...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>Error: {error}</p>
            </div>
          ) : hoppers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No hoppers available right now
              </p>
              <Button onClick={() => setMode("create")}>
                Create Your Hopper
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {hoppers.map((hopper, index) => (
                <motion.div
                  key={hopper.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <HopperCard
                    hopper={hopper}
                    onJoin={() => handleJoinHopper(hopper.id)}
                  />
                </motion.div>
              ))}
            </div>
          )
        ) : (
          // Create Mode - Form
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <form onSubmit={handleCreateHopper} className="space-y-4">
              {/* From Location */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Picking up from
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Campus, hostel, home..."
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                    className="pl-10 h-12 bg-card"
                    required
                  />
                </div>
              </div>

              {/* To Location */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Going to
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Airport, station, office..."
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    className="pl-10 h-12 bg-card"
                    required
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <Input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="h-12 bg-card"
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Departure time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="pl-10 h-12 bg-card"
                    required
                  />
                </div>
              </div>

              {/* Flexibility */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Flexible by {flexibility} minutes
                </label>
                <input
                  type="range"
                  min="0"
                  max="120"
                  step="15"
                  value={flexibility}
                  onChange={(e) => setFlexibility(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Create Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold gap-2"
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create Hopper"}
                <ArrowRight className="w-4 h-4" />
              </Button>

              {/* Cancel Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-12"
                onClick={() => setMode("view")}
              >
                Cancel
              </Button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Hopper;
