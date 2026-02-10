import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Filter, MapPin, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RideCard from "@/components/RideCard";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { joinRideAtomic, isUserInRide, calculateRideSavings } from "@/lib/database";

const filters = ["All", "Airport", "Station", "Girls Only"];

interface RideWithHost {
  id: string;
  source: string;
  destination: string;
  date: string;
  time: string;
  seats_total: number;
  seats_taken: number;
  estimated_fare: number;
  girls_only: boolean;
  flight_train: string | null;
  host_id: string;
  status: string;
  profiles: { name: string; trust_score: number; department: string | null } | null;
}

const Index = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [rides, setRides] = useState<RideWithHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRides, setUserRides] = useState<Set<string>>(new Set());
  const [totalSavings, setTotalSavings] = useState(0);
  const { session, user } = useAuth();
  const { toast } = useToast();

  const fetchRides = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("rides")
      .select("*, profiles!rides_host_id_fkey(name, trust_score, department)")
      .in("status", ["open", "full", "locked"])
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRides(data as unknown as RideWithHost[]);

      // Fetch user's ride memberships
      if (session?.user) {
        const { data: memberships } = await supabase
          .from("ride_members")
          .select("ride_id")
          .eq("user_id", session.user.id);

        if (memberships) {
          setUserRides(new Set(memberships.map((m) => m.ride_id)));
        }
      }

      // Calculate total savings
      const savings = data.reduce((sum, ride) => {
        return sum + calculateRideSavings(ride.estimated_fare, ride.seats_total, ride.seats_taken);
      }, 0);
      setTotalSavings(savings);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRides();
  }, []);

  const filteredRides = rides.filter((ride) => {
    if (activeFilter === "Airport") return ride.destination.toLowerCase().includes("airport");
    if (activeFilter === "Station") return ride.destination.toLowerCase().includes("station");
    if (activeFilter === "Girls Only") return ride.girls_only;
    return true;
  });

  const handleJoin = async (id: string) => {
    if (!session?.user) return;

    try {
      const result = await joinRideAtomic(id, session.user.id);

      if (!result.success) {
        toast({
          title: "Cannot join",
          description: result.error || "Unable to join ride",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Ride joined! 🎉",
        description: "You've been added to this ride group."
      });

      // Update local state
      setUserRides(prev => new Set([...prev, id]));

      // Refetch rides to update seat counts
      fetchRides();
    } catch (error: any) {
      console.error("Join ride error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to join ride",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-background/80 backdrop-blur-md z-40 border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold font-display">Rydin</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> SRM Campus
              </p>
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {filters.map((f) => (
              <Badge
                key={f}
                variant={activeFilter === f ? "default" : "outline"}
                className="cursor-pointer shrink-0 transition-colors"
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* Savings Counter Banner */}
        {totalSavings > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center gap-2"
          >
            <TrendingDown className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs font-semibold text-primary">
                ₹{totalSavings.toLocaleString()} saved collectively
              </p>
              <p className="text-xs text-muted-foreground">Across all active rides</p>
            </div>
          </motion.div>
        )}

        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${filteredRides.length} ride${filteredRides.length !== 1 ? "s" : ""} available`}
          </p>
        </div>

        {filteredRides.map((ride, i) => (
          <RideCard
            key={ride.id}
            ride={{
              id: ride.id,
              source: ride.source,
              destination: ride.destination,
              date: ride.date,
              time: ride.time,
              seatsTotal: ride.seats_total,
              seatsTaken: ride.seats_taken,
              estimatedFare: ride.estimated_fare,
              girlsOnly: ride.girls_only,
              flightTrain: ride.flight_train || undefined,
              hostName: ride.profiles?.name || "Unknown",
              hostRating: ride.profiles?.trust_score ?? 4.0,
              hostDepartment: ride.profiles?.department || "",
              hostId: ride.host_id,
              status: ride.status,
            }}
            index={i}
            onJoin={handleJoin}
            isHost={user?.id === ride.host_id}
            isJoined={userRides.has(ride.id)}
          />
        ))}

        {!loading && filteredRides.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-muted-foreground"
          >
            <p className="text-lg font-display font-semibold mb-1">No rides found</p>
            <p className="text-sm">Try a different filter or create a new ride</p>
          </motion.div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
