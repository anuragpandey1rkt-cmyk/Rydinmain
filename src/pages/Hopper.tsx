import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Users, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import HopperCard from "@/components/HopperCard";
import { useRealtimeHoppers, type Hopper as HopperType } from "@/hooks/useRealtimeHoppers";
import { useToast } from "@/hooks/use-toast";
import { useHopperMatching } from "@/hooks/useHopperMatching";

const Hopper = () => {
  const [mode, setMode] = useState<"view" | "create">("view");
  const { hoppers, isLoading, error } = useRealtimeHoppers();

  // Create Form State
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [flexibility, setFlexibility] = useState(30);
  const [isCreating, setIsCreating] = useState(false);

  // Match Logic State
  const [showMatchesDialog, setShowMatchesDialog] = useState(false);
  const [potentialMatches, setPotentialMatches] = useState<HopperType[]>([]);
  const { isTimeMatch, isLocationMatch, isDateMatch } = useHopperMatching();

  // View Filter State
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const { user } = useAuth();
  const { toast } = useToast();

  const checkMatchesAndCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromLocation.trim() || !toLocation.trim() || !departureDate || !departureTime) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Check for matches locally
    const matches = hoppers.filter((h) => {
      if (h.user_id === user?.id) return false; // Don't match own hoppers

      const locMatch = isLocationMatch(fromLocation, h.pickup_location, toLocation, h.drop_location);
      const dateMatch = isDateMatch(departureDate, h.departure_date);
      const timeMatch = isTimeMatch(
        { departureTime, flexibilityMinutes: flexibility },
        { departureTime: h.departure_time, flexibilityMinutes: 30 } // Schema doesn't have flexibility column
      );

      return locMatch && dateMatch && timeMatch;
    });

    if (matches.length > 0) {
      setPotentialMatches(matches);
      setShowMatchesDialog(true);
    } else {
      executeCreateHopper();
    }
  };

  const executeCreateHopper = async () => {
    if (!user) return;

    try {
      setIsCreating(true);

      const { error } = await supabase.from("hoppers").insert({
        user_id: user.id,
        pickup_location: fromLocation,
        drop_location: toLocation,
        departure_date: departureDate,
        departure_time: departureTime,
        seats_total: 4,
        seats_taken: 1,
        status: "active",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Hopper created! Other students can now find your ride.",
      });

      // Reset form
      setFromLocation("");
      setToLocation("");
      setDepartureDate("");
      setDepartureTime("");
      setFlexibility(30);
      setMode("view");
      setShowMatchesDialog(false);
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

  const handleJoinHopper = async (hopper: HopperType) => {
    if (!user) return;

    // Prevent joining own hopper
    if (hopper.user_id === user.id) {
      toast({
        title: "Action not allowed",
        description: "You cannot join your own hopper",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if already requested
      const { data: existing } = await supabase
        .from("hopper_requests")
        .select("*")
        .eq("hopper_id", hopper.id)
        .eq("sender_id", user.id)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Already Requested",
          description: "You have already sent a request for this ride.",
        });
        return;
      }

      const { error } = await supabase.from("hopper_requests").insert({
        hopper_id: hopper.id,
        sender_id: user.id,
        receiver_id: hopper.user_id,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Request sent! Waiting for driver approval.",
      });

      setShowMatchesDialog(false); // Close dialog if joining from there
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to join hopper",
        variant: "destructive",
      });
    }
  };

  // Filter hoppers in View mode
  const displayedHoppers = hoppers.filter(h => {
    const matchFrom = filterFrom === "" || h.pickup_location.toLowerCase().includes(filterFrom.toLowerCase());
    const matchTo = filterTo === "" || h.drop_location.toLowerCase().includes(filterTo.toLowerCase());
    return matchFrom && matchTo;
  });

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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "view"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
                }`}
            >
              Find Hoppers
            </button>
            <button
              onClick={() => setMode("create")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "create"
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
              {/* Filters */}
              <div className="bg-muted/30 p-4 rounded-lg space-y-3 mb-6">
                <h3 className="font-semibold text-sm">Filter Rides</h3>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="From..."
                      className="pl-9 h-10 bg-background"
                      value={filterFrom}
                      onChange={(e) => setFilterFrom(e.target.value)}
                    />
                  </div>
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="To..."
                      className="pl-9 h-10 bg-background"
                      value={filterTo}
                      onChange={(e) => setFilterTo(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {displayedHoppers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No hoppers match your filters
                  </p>
                  <Button onClick={() => setMode("create")}>
                    Create Your Hopper
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedHoppers.map((hopper, index) => (
                    <motion.div
                      key={hopper.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <HopperCard
                        hopper={hopper}
                        onJoin={() => handleJoinHopper(hopper)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )
        ) : (
          // Create Mode - Form
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <form onSubmit={checkMatchesAndCreate} className="space-y-4">
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

      {/* Matches Found Dialog */}
      <Dialog open={showMatchesDialog} onOpenChange={setShowMatchesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Similar Rides Found! 🚕</DialogTitle>
            <DialogDescription>
              We found {potentialMatches.length} existing rides that match your route and time.
              Checking them out saves money and reduces carbon footprint!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto py-2">
            {potentialMatches.map(match => (
              <div key={match.id} className="border rounded-lg p-3 bg-muted/20">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-sm">{match.user_name || "Student"}</p>
                    <p className="text-xs text-muted-foreground">{match.departure_time}</p>
                  </div>
                  <Button size="sm" onClick={() => handleJoinHopper(match)}>Join</Button>
                </div>
                <div className="text-xs flex gap-2 text-muted-foreground">
                  <span>From: {match.pickup_location}</span>
                  <span>To: {match.drop_location}</span>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex-col gap-2 sm:gap-0">
            <Button variant="outline" onClick={executeCreateHopper} disabled={isCreating}>
              {isCreating ? "Creating..." : "I still want to create my own"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Hopper;
