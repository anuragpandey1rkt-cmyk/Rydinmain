import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";
import { MapPin, Clock, Users, ArrowRight, Plus, Users2, Zap, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import MapPicker from "@/components/MapPicker";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";
import { Info, Zap as ZapIcon } from "lucide-react";
import { useRideClustering } from "@/hooks/useRideClustering";
import RideClusteringSuggestion from "@/components/RideClusteringSuggestion";
import { checkSuspiciousActivity, flagUser } from "@/lib/moderation";
import FallbackTransport from "@/components/FallbackTransport";
import { useEffect as useEff } from "react";

const Hopper = () => {
  const [mode, setMode] = useState<"view" | "create">("view");
  const { hoppers, isLoading, error } = useRealtimeHoppers();

  // Create Form State
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropCoords, setDropCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [flexibility, setFlexibility] = useState(30);
  const [isCreating, setIsCreating] = useState(false);

  // Match Logic State
  const [showMatchesDialog, setShowMatchesDialog] = useState(false);
  const [potentialMatches, setPotentialMatches] = useState<HopperType[]>([]);
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const { isTimeMatch, isGeospatialMatch, isDateMatch } = useHopperMatching();
  const { findNearestHub, calculateSavings } = useRideClustering();
  const [suggestedHub, setSuggestedHub] = useState<{ name: string; center_latitude: number; center_longitude: number } | null>(null);
  const [savingsValue, setSavingsValue] = useState(0);

  // View Filter State
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [demandData, setDemandData] = useState<{ activeUsers: number, ridesForming: number } | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  useEff(() => {
    // Simulate live demand logic - in production we'd use a real-time presence channel or a table count
    const active = Math.floor(Math.random() * 8) + 4;
    const forming = Math.floor(active / 2);
    setDemandData({ activeUsers: active, ridesForming: forming });
  }, []);

  const checkMatchesAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupCoords || !dropCoords || !departureDate || !departureTime) {
      toast({
        title: "Error",
        description: "Please select locations on map and fill in date/time",
        variant: "destructive",
      });
      return;
    }

    // Check for matches locally
    const matches = hoppers.filter((h) => {
      if (h.user_id === user?.id) return false; // Don't match own hoppers

      const locMatch = h.pickup_latitude && h.pickup_longitude && h.drop_latitude && h.drop_longitude
        ? isGeospatialMatch(
          pickupCoords,
          { lat: h.pickup_latitude, lng: h.pickup_longitude },
          dropCoords,
          { lat: h.drop_latitude, lng: h.drop_longitude }
        )
        : false;

      const dateMatch = isDateMatch(departureDate, h.departure_date);
      const timeMatch = isTimeMatch(
        { departureTime, flexibilityMinutes: flexibility },
        { departureTime: h.departure_time, flexibilityMinutes: 30 }
      );

      return locMatch && dateMatch && timeMatch;
    });

    if (matches.length > 0) {
      setPotentialMatches(matches);

      // Intelligent clustering suggestion
      const hub = await findNearestHub(pickupCoords);
      if (hub) {
        setSuggestedHub(hub);
        setSavingsValue(calculateSavings(250, matches.length + 1));
      }

      setShowMatchesDialog(true);
    } else {
      // Suggest adjustments if no matches found
      setShowAdjustmentDialog(true);
    }
  };

  const handleAdjustAndSearch = () => {
    // Increase flexibility to 60 minutes for better match chance
    setFlexibility(60);
    setShowAdjustmentDialog(false);
    // User can trigger search again with increased flexibility
    toast({ title: "Flexibility Increased", description: "Search window increased to 1 hour. Try searching again!" });
  };

  const executeCreateHopper = async () => {
    if (!user || !pickupCoords || !dropCoords) return;

    try {
      setIsCreating(true);

      // Moderation check
      const modCheck = await checkSuspiciousActivity(user.id);
      if (modCheck.isSuspicious) {
        if (modCheck.action === 'flag') {
          await flagUser(user.id, modCheck.reason || "Suspicious hopper creation pattern.");
          toast({
            title: "Account under review",
            description: "Your account is being reviewed for suspicious behavior. Visibility may be affected.",
            variant: "destructive"
          });
        } else if (modCheck.action === 'block') {
          toast({ title: "Action Blocked", description: "You cannot create more hoppers right now.", variant: "destructive" });
          setIsCreating(false);
          return;
        }
      }

      const { error } = await supabase.from("hoppers").insert({
        user_id: user.id,
        pickup_location: fromLocation || `${pickupCoords.lat.toFixed(4)}, ${pickupCoords.lng.toFixed(4)}`,
        drop_location: toLocation || `${dropCoords.lat.toFixed(4)}, ${dropCoords.lng.toFixed(4)}`,
        pickup_latitude: pickupCoords.lat,
        pickup_longitude: pickupCoords.lng,
        drop_latitude: dropCoords.lat,
        drop_longitude: dropCoords.lng,
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

      {/* Demand Indicator */}
      <div className="bg-primary px-4 py-2 flex items-center justify-between text-[11px] font-bold text-primary-foreground uppercase tracking-widest overflow-hidden relative">
        <motion.div
          animate={{ x: [-100, 400] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 bottom-0 w-12 bg-white/20 skew-x-12"
        />
        <div className="flex items-center gap-2">
          <Users2 className="w-3 h-3" />
          <span>{demandData?.activeUsers || 4} Students Searching Nearby</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>{demandData?.ridesForming || 2} Rides Forming</span>
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
            <div className="space-y-8">
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4 font-medium text-lg">
                  No hoppers active right now 🚕
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setMode("create")} size="lg">
                    Create Your Hopper
                  </Button>
                </div>
              </div>

              <FallbackTransport />
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
                <div className="space-y-8">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                      No hoppers match your filters
                    </p>
                    <Button onClick={() => setMode("create")}>
                      Create Your Hopper
                    </Button>
                  </div>
                  <FallbackTransport from={filterFrom} to={filterTo} />
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
            className="max-w-md mx-auto space-y-6"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <Info className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-sm text-blue-700">
                Select your trip route. Hopper matches you with others heading in the same direction!
              </p>
            </div>

            <form onSubmit={checkMatchesAndCreate} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Pickup Location
                  </label>
                  <PlaceAutocomplete
                    placeholder="Where are you starting from?"
                    onSelect={(p) => {
                      setFromLocation(p.name);
                      if (p.lat && p.lng) setPickupCoords({ lat: p.lat, lng: p.lng });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Destination
                  </label>
                  <PlaceAutocomplete
                    placeholder="Where are you going?"
                    onSelect={(p) => {
                      setToLocation(p.name);
                      if (p.lat && p.lng) setDropCoords({ lat: p.lat, lng: p.lng });
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Fine-tune on Map</label>
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-primary">Optional</Badge>
                </div>
                <MapPicker
                  initialPickup={pickupCoords || undefined}
                  initialDrop={dropCoords || undefined}
                  onSelect={(p, d) => {
                    setPickupCoords(p);
                    setDropCoords(d);
                  }}
                />
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
            {suggestedHub && (
              <RideClusteringSuggestion
                hub={suggestedHub}
                savings={savingsValue}
                onAccept={() => {
                  setPickupCoords({ lat: suggestedHub.center_latitude, lng: suggestedHub.center_longitude });
                  setFromLocation(suggestedHub.name);
                  executeCreateHopper();
                }}
              />
            )}

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

      {/* Adjustment Dialog */}
      <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center">No Exact Matches Yet</DialogTitle>
            <DialogDescription className="text-center pt-2">
              We couldn't find a perfect match for your exact route and time.
              Would you like to increase your time flexibility?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/30 p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Smart Suggestions</h4>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <RefreshCw className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium">Increase time flexibility to 1 hour</p>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2">
            <Button onClick={handleAdjustAndSearch} className="w-full gap-2 font-bold">
              Adjust & Search Again
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={executeCreateHopper} className="w-full text-muted-foreground border-dashed">
              Create anyway with current settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Hopper;
