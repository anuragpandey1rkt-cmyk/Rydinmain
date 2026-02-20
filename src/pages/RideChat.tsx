import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, MapPin, Info, Shield } from "lucide-react";
import SafetyHub from "@/components/SafetyHub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeRideMessages } from "@/hooks/useRealtimeRideMessages";
import { supabase } from "@/integrations/supabase/client";

const RideChat = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const rideId = searchParams.get("rideId");
    const { user } = useAuth();
    const [newMessage, setNewMessage] = useState("");
    const [rideInfo, setRideInfo] = useState<any>(null);
    const [safetyOpen, setSafetyOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const { messages, loading } = useRealtimeRideMessages(rideId || "");

    useEffect(() => {
        // Fetch ride info for the header
        if (rideId) {
            supabase
                .from("rides")
                .select("source, destination, host_id")
                .eq("id", rideId)
                .maybeSingle()
                .then(({ data }) => setRideInfo(data));
        }
    }, [rideId]);

    useEffect(() => {
        // Auto scroll to bottom
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !rideId) return;

        const content = newMessage.trim();
        setNewMessage("");

        const { error } = await supabase.from("ride_messages").insert({
            ride_id: rideId,
            user_id: user.id,
            content,
        });

        if (error) {
            console.error("Failed to send:", error);
            setNewMessage(content); // Restore message on error
        } else {
            // Background: notify other members
            try {
                const { getRideMembers } = await import("@/lib/database");
                const { sendMessageNotification } = await import("@/lib/notifications");
                const members = await getRideMembers(rideId);

                const destination = rideInfo?.destination || "Ride";
                const otherMembers = members.filter(m => m.user_id !== user.id);

                for (const member of otherMembers) {
                    await sendMessageNotification(
                        member.user_id,
                        user.name || "Member",
                        `[${destination}] ${content}`,
                        `/ride-chat?rideId=${rideId}`
                    );
                }
            } catch (notifErr) {
                console.warn("Notification trigger failed:", notifErr);
            }
        }
    };

    if (!rideId) return <div className="p-10 text-center">Invalid Ride ID</div>;

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 bg-background/80 backdrop-blur-md z-40 border-b border-border p-3">
                <div className="max-w-lg mx-auto flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm font-bold truncate">
                            {rideInfo ? `${rideInfo.destination} Group` : "Ride Group Chat"}
                        </h1>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-2 h-2" /> {rideInfo?.source || "Loading..."}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-indigo-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                        onClick={() => setSafetyOpen(true)}
                    >
                        <Shield className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Info className="w-4 h-4" />
                    </Button>
                </div>
            </header>

            <SafetyHub
                open={safetyOpen}
                onOpenChange={setSafetyOpen}
                rideId={rideId}
                rideInfo={rideInfo}
            />

            {/* Messages Area */}
            <main
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
            >
                <div className="text-center py-6">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest bg-muted/50 inline-block px-3 py-1 rounded-full border border-border">
                        Chat Started
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messages.map((msg, i) => {
                            const isOwn = msg.user_id === user?.id;
                            const prevMsg = messages[i - 1];
                            const showName = !isOwn && (!prevMsg || prevMsg.user_id !== msg.user_id);

                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                                >
                                    {showName && (
                                        <span className="text-[10px] font-bold text-muted-foreground mb-1 ml-1">
                                            {msg.profiles?.name}
                                        </span>
                                    )}
                                    <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm ${isOwn
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-card border border-border rounded-tl-none"
                                        }`}>
                                        {msg.content}
                                    </div>
                                    <span className="text-[8px] text-muted-foreground mt-1 px-1">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </main>

            {/* Input Area */}
            <footer className="p-3 bg-background border-t border-border">
                <form onSubmit={handleSend} className="max-w-lg mx-auto flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 h-12 rounded-2xl bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="h-12 w-12 rounded-2xl shrink-0"
                        disabled={!newMessage.trim()}
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </form>
            </footer>
        </div>
    );
};

export default RideChat;
