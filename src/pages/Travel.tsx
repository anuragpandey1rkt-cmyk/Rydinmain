import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Train, Plane, Bus, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ShuttleTiming {
  id: string;
  route_name: string;
  from_location: string;
  to_location: string;
  departure_time: string;
  arrival_time?: string;
  frequency_minutes?: number;
}

const Travel = () => {
  const [mode, setMode] = useState<"train" | "flight" | "shuttle">("train");
  const [trainNumber, setTrainNumber] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [date, setDate] = useState("");
  const [shuttleTimings, setShuttleTimings] = useState<ShuttleTiming[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (mode === "shuttle") {
      fetchShuttleTimings();
    }
  }, [mode]);

  const fetchShuttleTimings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("shuttle_timings")
        .select("*")
        .order("departure_time", { ascending: true });

      if (error) throw error;
      setShuttleTimings(data || []);
    } catch (error) {
      console.error("Error fetching shuttle timings:", error);
      toast({
        title: "Error",
        description: "Failed to load shuttle timings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTrainTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainNumber.trim() || !date) return;

    try {
      const { error } = await supabase.from("train_info").insert({
        train_number: trainNumber.toUpperCase(),
        date: date,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Trip added! We'll notify you if others are on the same train.",
      });

      setTrainNumber("");
      setDate("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add trip",
        variant: "destructive",
      });
    }
  };

  const handleAddFlightTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flightNumber.trim() || !date) return;

    try {
      const { error } = await supabase.from("train_info").insert({
        train_number: flightNumber.toUpperCase(),
        date: date,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Trip added! We'll notify you if others are on the same flight.",
      });

      setFlightNumber("");
      setDate("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add trip",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Travel Matching</h1>
          <p className="text-sm text-muted-foreground">
            Find co-travelers and discover shuttle timings
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as "train" | "flight" | "shuttle")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="train">
              <Train className="w-4 h-4 mr-2" />
              Train
            </TabsTrigger>
            <TabsTrigger value="flight">
              <Plane className="w-4 h-4 mr-2" />
              Flight
            </TabsTrigger>
            <TabsTrigger value="shuttle">
              <Bus className="w-4 h-4 mr-2" />
              Shuttle
            </TabsTrigger>
          </TabsList>

          {/* Train Tab */}
          <TabsContent value="train" className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900">
                Enter your train details. If another student is on the same train, we'll notify
                both of you to coordinate a cab together.
              </p>
            </div>

            <form onSubmit={handleAddTrainTrip} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Train Number</label>
                <Input
                  type="text"
                  placeholder="e.g., 12345 or TN Express"
                  value={trainNumber}
                  onChange={(e) => setTrainNumber(e.target.value)}
                  className="h-12 bg-card"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Travel Date</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-12 bg-card"
                  required
                />
              </div>

              <Button type="submit" className="w-full h-12 font-semibold">
                Add Train Trip
              </Button>
            </form>

            <Card className="p-4 bg-muted">
              <h3 className="font-semibold mb-2">How it works:</h3>
              <ol className="space-y-1 text-sm text-muted-foreground">
                <li>1. Add your train details</li>
                <li>2. We check if another student is on the same train</li>
                <li>3. Both get notified instantly</li>
                <li>4. Convert to Hopper to find a shared cab</li>
              </ol>
            </Card>
          </TabsContent>

          {/* Flight Tab */}
          <TabsContent value="flight" className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-purple-900">
                Add your flight details to find other SRM students on the same flight.
              </p>
            </div>

            <form onSubmit={handleAddFlightTrip} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Flight Number</label>
                <Input
                  type="text"
                  placeholder="e.g., AI 123 or BA456"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  className="h-12 bg-card"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Travel Date</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-12 bg-card"
                  required
                />
              </div>

              <Button type="submit" className="w-full h-12 font-semibold">
                Add Flight Trip
              </Button>
            </form>

            <Card className="p-4 bg-muted">
              <h3 className="font-semibold mb-2">No PNR needed:</h3>
              <p className="text-sm text-muted-foreground">
                Just enter your flight number. We won't access your ticket details.
              </p>
            </Card>
          </TabsContent>

          {/* Shuttle Tab */}
          <TabsContent value="shuttle" className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-900">
                Check SRM shuttles and buses. Save money if available!
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading shuttle timings...</p>
              </div>
            ) : shuttleTimings.length === 0 ? (
              <Card className="p-8 text-center">
                <Bus className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">
                  No shuttle timings available yet. Check back soon!
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {shuttleTimings.map((shuttle) => (
                  <motion.div
                    key={shuttle.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm mb-2">
                            {shuttle.route_name}
                          </h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{shuttle.from_location}</span>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2 pl-6">
                              <span>↓</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{shuttle.to_location}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm font-semibold mb-1">
                            <Clock className="w-4 h-4" />
                            {shuttle.departure_time}
                          </div>
                          {shuttle.arrival_time && (
                            <p className="text-xs text-muted-foreground">
                              Arrive: {shuttle.arrival_time}
                            </p>
                          )}
                          {shuttle.frequency_minutes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Every {shuttle.frequency_minutes} mins
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            <Card className="p-4 bg-muted">
              <h3 className="font-semibold mb-2">Pro tip:</h3>
              <p className="text-sm text-muted-foreground">
                Use shuttles whenever possible. They're free and faster than cabs!
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Travel;
