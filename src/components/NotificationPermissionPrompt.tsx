import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/contexts/NotificationContext";

export const NotificationPermissionPrompt = () => {
    const { permission, requestPermission } = useNotifications();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show prompt after 5 seconds if permission is still default
        if (permission === "default") {
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [permission]);

    const handleGrant = async () => {
        const granted = await requestPermission();
        if (granted) {
            setIsVisible(false);
        }
    };

    if (!isVisible || permission !== "default") return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-4 shadow-xl shadow-primary/10 max-w-lg mx-auto">
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                        <Bell className="w-6 h-6 text-primary animate-pulse" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <h4 className="text-sm font-bold">Enable Push Notifications</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Never miss a ride match, message, or update. Get real-time alerts on your device.
                        </p>
                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={handleGrant}
                                size="sm"
                                className="flex-1 font-bold text-xs"
                            >
                                Allow
                            </Button>
                            <Button
                                onClick={() => setIsVisible(false)}
                                variant="outline"
                                size="sm"
                                className="flex-1 font-bold text-xs"
                            >
                                Later
                            </Button>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-muted-foreground hover:text-foreground p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
