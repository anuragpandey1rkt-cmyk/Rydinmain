import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useHopperMatching } from "@/hooks/useHopperMatching";

export const useNearbyRideNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isGeospatialMatch } = useHopperMatching();
  const userHoppersRef = useRef<any[]>([]);

  // Fetch user's active hoppers to match against new ones
  useEffect(() => {
    if (!user) return;

    const fetchUserHoppers = async () => {
      const { data } = await supabase
        .from("hoppers")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active");
      
      if (data) userHoppersRef.current = data;
    };

    fetchUserHoppers();

    const subscription = supabase
      .channel("nearby-rides")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "hoppers", filter: "status=eq.active" },
        async (payload) => {
          const newHopper = payload.new;
          if (newHopper.user_id === user.id) return;

          // Check if it matches any of user's active hoppers
          const isMatch = userHoppersRef.current.some(uh => {
            if (!uh.pickup_latitude || !uh.drop_latitude || !newHopper.pickup_latitude || !newHopper.drop_latitude) return false;
            
            return isGeospatialMatch(
              { lat: uh.pickup_latitude, lng: uh.pickup_longitude },
              { lat: newHopper.pickup_latitude, lng: newHopper.pickup_longitude },
              { lat: uh.drop_latitude, lng: uh.drop_longitude },
              { lat: newHopper.drop_latitude, lng: newHopper.drop_longitude }
            );
          });

          if (isMatch) {
            toast({
              title: "Nearby Ride Found! 🚕",
              description: `A new ride matching your route has appeared nearby. Check it out!`,
              duration: 10000,
            });

            // Save to notifications table
            await supabase.from("notifications").insert({
              user_id: user.id,
              type: "ride_reminder",
              title: "Relevant Ride Nearby",
              message: "A new ride matching your route was just created. Join now to save!",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, isGeospatialMatch, toast]);
};
