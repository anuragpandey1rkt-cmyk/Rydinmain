import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RideMessage {
    id: string;
    ride_id: string;
    user_id: string;
    content: string;
    created_at: string;
    profiles?: {
        name: string;
    };
}

export const useRealtimeRideMessages = (rideId: string) => {
    const [messages, setMessages] = useState<RideMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!rideId) return;

        const fetchMessages = async () => {
            try {
                const { data: rawMessages, error: msgError } = await supabase
                    .from("ride_messages")
                    .select("*")
                    .eq("ride_id", rideId)
                    .order("created_at", { ascending: true });

                if (msgError) throw msgError;
                if (!rawMessages || rawMessages.length === 0) {
                    setMessages([]);
                    return;
                }

                const userIds = [...new Set(rawMessages.map(m => m.user_id))];
                const { data: profiles, error: profileError } = await supabase
                    .from("profiles")
                    .select("id, name")
                    .in("id", userIds);

                if (profileError) throw profileError;

                const profilesMap = new Map(profiles?.map(p => [p.id, p]));
                const messagesWithProfiles = rawMessages.map(msg => ({
                    ...msg,
                    profiles: profilesMap.get(msg.user_id) || null
                }));

                setMessages(messagesWithProfiles as unknown as RideMessage[]);
            } catch (err) {
                console.error("Error fetching group messages:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

        // Subscribe to new group messages
        const subscription = supabase
            .channel(`ride-messages-${rideId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "ride_messages",
                    filter: `ride_id=eq.${rideId}`,
                },
                async (payload) => {
                    const newMsg = payload.new as any;
                    // Fetch profile of the sender to include the name
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("name")
                        .eq("id", newMsg.user_id)
                        .maybeSingle();

                    setMessages((prev) => [...prev, { ...newMsg, profiles: profile }]);
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [rideId]);

    return { messages, loading };
};
