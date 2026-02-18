import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Hopper {
  id: string;
  user_id: string;
  pickup_location: string;
  drop_location: string;
  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
  drop_latitude?: number | null;
  drop_longitude?: number | null;
  departure_date: string;
  departure_time: string;
  seats_total: number;
  seats_taken: number;
  status: string;
  created_at: string;
  user_name?: string;
  user_gender?: string;
}

export const useRealtimeHoppers = () => {
  const [hoppers, setHoppers] = useState<Hopper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let subscription: any;

    const fetchAndSubscribe = async () => {
      try {
        setIsLoading(true);

        // Initial fetch
        const { data, error: fetchError } = await supabase
          .from("hoppers")
          .select("*, profiles (name, gender)")
          .eq("status", "active")
          .gte("departure_date", new Date().toISOString().split("T")[0])
          .order("departure_date", { ascending: true })
          .order("departure_time", { ascending: true });

        if (fetchError) throw fetchError;

        const mappedData = (data || []).map((h: any) => ({
          ...h,
          user_name: h.profiles?.name,
          user_gender: h.profiles?.gender,
        }));

        setHoppers(mappedData);

        // Real-time subscription
        subscription = supabase
          .channel("hoppers-channel")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "hoppers",
              filter: `status=eq.active`,
            },
            (payload) => {
              if (payload.eventType === "INSERT") {
                // Fetch new hopper with user data
                supabase
                  .from("hoppers")
                  .select("*, profiles (name, gender)")
                  .eq("id", payload.new.id)
                  .single()
                  .then(({ data }) => {
                    if (data) {
                      setHoppers((prev) => [
                        ...prev,
                        {
                          ...data,
                          user_name: data.profiles?.name,
                          user_gender: data.profiles?.gender,
                        },
                      ]);
                    }
                  });
              } else if (payload.eventType === "UPDATE") {
                setHoppers((prev) =>
                  prev.map((h) => (h.id === payload.new.id ? { ...h, ...payload.new } as Hopper : h))
                );
              } else if (payload.eventType === "DELETE") {
                setHoppers((prev) => prev.filter((h) => h.id !== payload.old.id));
              }
            }
          )
          .subscribe();

        setError(null);
      } catch (err: any) {
        console.error("Error fetching hoppers:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndSubscribe();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  return { hoppers, isLoading, error };
};
