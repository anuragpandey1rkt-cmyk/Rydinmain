import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { toast } from "@/components/ui/use-toast";

interface Notification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
    data?: any;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    permission: NotificationPermission;
    requestPermission: () => Promise<boolean>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    isInstallable: boolean;
    installApp: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [permission, setPermission] = useState<NotificationPermission>(
        typeof window !== "undefined" ? Notification.permission : "default"
    );
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    // ──── Fetch Notifications ───────────────────────────────────────────────────
    const fetchNotifications = async () => {
        if (!user?.id) return;
        try {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(50);

            if (error) throw error;
            setNotifications(data || []);
            setUnreadCount((data || []).filter(n => !n.read).length);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        }
    };

    useEffect(() => {
        fetchNotifications();

        if (!user?.id) return;

        // Real-time subscription
        const channel = supabase
            .channel(`notifications-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newNotif = payload.new as Notification;
                    setNotifications((prev) => [newNotif, ...prev]);
                    setUnreadCount((prev) => prev + 1);

                    // Show toast for new notification
                    toast({
                        title: newNotif.title,
                        description: newNotif.message,
                    });

                    // Show browser notification if permitted
                    if (Notification.permission === "granted" && document.hidden) {
                        new Notification(newNotif.title, {
                            body: newNotif.message,
                            icon: "/favicon.svg",
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    // ──── Visit Tracking ───────────────────────────────────────────────────────
    useEffect(() => {
        const visits = parseInt(localStorage.getItem("rydin_visits") || "0");
        const newVisits = visits + 1;
        localStorage.setItem("rydin_visits", newVisits.toString());

        if (newVisits >= 2 && deferredPrompt) {
            setIsInstallable(true);
        }
    }, [deferredPrompt]); // Run once on mount and when prompt is captured

    // ──── PWA Install Logic ──────────────────────────────────────────────────────
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);

            const visits = parseInt(localStorage.getItem("rydin_visits") || "0");
            if (visits >= 2) {
                setIsInstallable(true);
            }
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    }, []);

    const installApp = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setIsInstallable(false);
        }
        setDeferredPrompt(null);
    };

    // ──── Browser Permission ─────────────────────────────────────────────────────
    const requestPermission = async () => {
        if (typeof window === "undefined" || !("Notification" in window)) {
            return false;
        }
        const result = await Notification.requestPermission();
        setPermission(result);
        return result === "granted";
    };

    // ──── Actions ────────────────────────────────────────────────────────────────
    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from("notifications")
                .update({ read: true })
                .eq("id", id);
            if (error) throw error;

            setNotifications((prev) =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Error marking notification as read:", err);
        }
    };

    const markAllAsRead = async () => {
        if (!user?.id) return;
        try {
            const { error } = await supabase
                .from("notifications")
                .update({ read: true })
                .eq("user_id", user.id)
                .eq("read", false);
            if (error) throw error;

            setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Error marking all as read:", err);
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                permission,
                requestPermission,
                markAsRead,
                markAllAsRead,
                isInstallable,
                installApp,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
};
