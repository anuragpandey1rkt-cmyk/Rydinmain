import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { supabase } from "@/integrations/supabase/client";

const DirectChat = () => {
    const navigate = useNavigate();
    const { userId: otherUserIdParam } = useParams();
    const [searchParams] = useSearchParams();
    const otherUserId = otherUserIdParam || searchParams.get("userId");

    const { user } = useAuth();
    const [newMessage, setNewMessage] = useState("");
    const [otherUser, setOtherUser] = useState<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const { messages, loading } = useRealtimeMessages(null, user?.id || "", otherUserId || "");

    useEffect(() => {
        if (otherUserId) {
            supabase
                .from("profiles")
                .select("name, department, avatar_url")
                .eq("id", otherUserId)
                .maybeSingle()
                .then(({ data }) => setOtherUser(data));
        }
    }, [otherUserId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !otherUserId) return;

        const content = newMessage.trim();
        setNewMessage("");

        const { error } = await supabase.from("direct_messages").insert({
            sender_id: user.id,
            recipient_id: otherUserId,
            content,
            ride_id: null
        });

        if (error) {
            console.error("Failed to send:", error);
            setNewMessage(content);
        }
    };

    if (!otherUserId) return <div className="p-10 text-center">User not found</div>;

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 bg-background/80 backdrop-blur-md z-40 border-b border-border p-3">
                <div className="max-w-lg mx-auto flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {otherUser?.avatar_url ? (
                            <img src={otherUser.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <User className="w-5 h-5" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm font-bold truncate">
                            {otherUser?.name || "Chat"}
                        </h1>
                        <p className="text-[10px] text-muted-foreground truncate">
                            {otherUser?.department || "SRM Student"}
                        </p>
                    </div>
                </div>
            </header>

            {/* Messages Area */}
            <main
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
            >
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messages.length === 0 && (
                            <div className="text-center py-10">
                                <p className="text-xs text-muted-foreground">Start a conversation with {otherUser?.name || 'this student'}</p>
                            </div>
                        )}
                        {messages.map((msg, i) => {
                            const isOwn = msg.sender_id === user?.id;

                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
                                >
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

export default DirectChat;
