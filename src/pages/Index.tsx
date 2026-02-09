import { useState } from "react";
import { motion } from "framer-motion";
import { Filter, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RideCard from "@/components/RideCard";
import BottomNav from "@/components/BottomNav";
import { mockRides } from "@/data/mockRides";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const filters = ["All", "Airport", "Station", "Girls Only"];

const Index = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const { user } = useAuth();
  const { toast } = useToast();

  const filteredRides = mockRides.filter((ride) => {
    if (activeFilter === "Airport") return ride.destination.toLowerCase().includes("airport");
    if (activeFilter === "Station") return ride.destination.toLowerCase().includes("station");
    if (activeFilter === "Girls Only") return ride.girlsOnly;
    return true;
  });

  const handleJoin = (id: string) => {
    toast({
      title: "Ride joined! 🎉",
      description: "You've been added to this ride group.",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
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

          {/* Filter pills */}
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

      {/* Ride list */}
      <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-muted-foreground">
            {filteredRides.length} ride{filteredRides.length !== 1 ? "s" : ""} available
          </p>
        </div>

        {filteredRides.map((ride, i) => (
          <RideCard key={ride.id} ride={ride} index={i} onJoin={handleJoin} />
        ))}

        {filteredRides.length === 0 && (
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
