import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Users, Check, X, Clock, MapPin, Calendar, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";

interface RideRequest {
    id: string;
    ride_id: string;
    user_id: string;
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
    profiles: {
        name: string;
        department: string | null;
        trust_score: number;
        gender: string;
    };
    rides: {
        source: string;
        destination: string;
        date: string;
        time: string;
        host_id: string;
    };
}

const Activity = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [hostedRides, setHostedRides] = useState<any[]>([]);
    const [requestsReceived, setRequestsReceived] = useState<RideRequest[]>([]);
    const [myRequests, setMyRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            // 1. Fetch rides I am hosting
            const { data: hosted } = await supabase
                .from("rides")
                .select("*, ride_members(*, profiles(name, department, trust_score, gender))")
                .eq("host_id", user.id)
                .order("date", { ascending: true });

            setHostedRides(hosted || []);

            // 2. Fetch requests I have sent
            const { data: sent } = await supabase
                .from("ride_members")
                .select("*, rides(*, profiles:host_id(name))")
                .eq("user_id", user.id)
                .order("joined_at", { ascending: false });

            setMyRequests(sent || []);

            // 3. Collect pending requests for my hosted rides
            const pending = (hosted || []).flatMap(ride =>
                (ride.ride_members || [])
                    .filter((m: any) => m.status === 'pending')
                    .map((m: any) => ({ ...m, rides: ride }))
            );
            setRequestsReceived(pending);

        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleRequest = async (rideId: string, memberId: string, action: 'accept' | 'reject') => {
        try {
            const { data, error } = await supabase.rpc('handle_ride_request', {
                p_ride_id: rideId,
                p_member_id: memberId,
                p_action: action
            });

            if (error) throw error;

            const result = data as any;
            if (!result.success) throw new Error(result.error);

            toast({
                title: action === 'accept' ? "Accepted! ✅" : "Rejected",
                description: action === 'accept' ? "Student added to your ride group." : "Request declined."
            });

            fetchData();
        } catch (error: any) {
            toast({ title: "Action failed", description: error.message, variant: "destructive" });
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <header className="sticky top-0 bg-background/80 backdrop-blur-md z-40 border-b border-border">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold font-display">Activity</h1>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-none">
                        {requestsReceived.length} Pending
                    </Badge>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-4 space-y-6">
                <Tabs defaultValue="actions" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="actions" className="relative">
                            Approval Hub
                            {requestsReceived.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground transform translate-x-1/2 -translate-y-1/2 ring-2 ring-background">
                                    {requestsReceived.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="rides">My Ride Groups</TabsTrigger>
                    </TabsList>

                    <TabsContent value="actions" className="space-y-6">
                        <section>
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-1">
                                Requests Received
                            </h2>
                            <div className="space-y-4">
                                {requestsReceived.length === 0 ? (
                                    <div className="text-center py-10 bg-muted/20 rounded-2xl border border-dashed border-border">
                                        <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">No pending requests yet.</p>
                                    </div>
                                ) : (
                                    requestsReceived.map((req) => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            key={req.id}
                                            className="bg-card border border-border rounded-2xl p-4 shadow-sm"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                                        {req.profiles.name?.[0]}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold">{req.profiles.name}</h3>
                                                        <p className="text-xs text-muted-foreground">{req.profiles.department || 'SRM Student'}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                    ⭐ {req.profiles.trust_score.toFixed(1)}
                                                </Badge>
                                            </div>

                                            <div className="bg-muted/30 rounded-xl p-3 mb-4 space-y-2">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <MapPin className="w-3 h-3 text-primary" />
                                                    <span className="font-medium">{req.rides.source} → {req.rides.destination}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{req.rides.date} at {req.rides.time}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                                                    onClick={() => handleRequest(req.ride_id, req.user_id, 'reject')}
                                                >
                                                    <X className="w-4 h-4 mr-2" /> Reject
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="rounded-xl bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => handleRequest(req.ride_id, req.user_id, 'accept')}
                                                >
                                                    <Check className="w-4 h-4 mr-2" /> Accept
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-1">
                                Sent Requests
                            </h2>
                            <div className="space-y-3">
                                {myRequests.filter(r => r.rides?.host_id !== user?.id).map((req) => (
                                    <div key={req.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold">{req.rides?.destination}</h4>
                                            <p className="text-[10px] text-muted-foreground">
                                                {req.rides?.date} • Host: {req.rides?.profiles?.name || 'Loading...'}
                                            </p>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "text-[10px] capitalize",
                                                req.status === 'accepted' && "bg-green-500/10 text-green-600 border-none",
                                                req.status === 'pending' && "bg-orange-500/10 text-orange-600 border-none",
                                                req.status === 'rejected' && "bg-red-500/10 text-red-600 border-none"
                                            )}
                                        >
                                            {req.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </TabsContent>

                    <TabsContent value="rides" className="space-y-4">
                        <div className="space-y-4">
                            {hostedRides.map((ride) => {
                                const acceptedMembers = (ride.ride_members || []).filter((m: any) => m.status === 'accepted');
                                return (
                                    <div key={ride.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                                        <div className="p-4 bg-primary/5 border-b border-primary/10">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg">{ride.destination}</h3>
                                                <Badge variant="outline" className="bg-background">{ride.status}</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {ride.date} at {ride.time}
                                            </p>
                                        </div>

                                        <div className="p-4 space-y-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Members ({acceptedMembers.length + 1})</p>
                                                <div className="flex flex-wrap gap-2">
                                                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px]">
                                                        Host (You)
                                                    </Badge>
                                                    {acceptedMembers.map((m: any) => (
                                                        <Badge key={m.id} variant="outline" className="text-[10px]">
                                                            {m.profiles?.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    variant="secondary"
                                                    className="flex-1 rounded-xl h-10 gap-2"
                                                    onClick={() => navigate(`/ride-chat?rideId=${ride.id}`)}
                                                >
                                                    <MessageSquare className="w-4 h-4" /> Group Chat
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 rounded-xl h-10"
                                                    onClick={() => navigate(`/profile`)}
                                                >
                                                    Manage
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            <BottomNav />
        </div>
    );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default Activity;
