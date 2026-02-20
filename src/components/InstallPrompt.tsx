import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/contexts/NotificationContext";

export const InstallPrompt = () => {
    const { installApp } = useNotifications();
    const [isIOS, setIsIOS] = useState(false);
    const [showInstruction, setShowInstruction] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const ua = navigator.userAgent;
        const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
        setIsIOS(isIosDevice);
    }, []);

    const handleInstallClick = async () => {
        setShowInstruction(false);

        if (isIOS) {
            setShowInstruction(true);
            return;
        }

        try {
            await installApp();
        } catch (err) {
            // Fallback if event didn't fire or was rejected
            setShowInstruction(true);
            setTimeout(() => setShowInstruction(false), 5000);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="flex flex-col gap-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 mb-6 shadow-sm animate-in fade-in slide-in-from-top-4 transition-all">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-amber-500 p-2 rounded-xl shadow-sm shadow-amber-500/20">
                        <Download className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <span className="text-sm font-bold text-foreground block">Rydin is better as an app</span>
                        <span className="text-[10px] text-muted-foreground">Install for faster access and offline mode</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleInstallClick}
                        size="sm"
                        className="h-8 px-4 text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
                    >
                        Install
                    </Button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-muted-foreground hover:text-foreground p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {showInstruction && (
                <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium bg-white/50 dark:bg-black/20 p-2 rounded-lg mt-1 border border-amber-100 dark:border-amber-900/30">
                    {isIOS
                        ? "Tap 'Share' ↓ then 'Add to Home Screen' ⊞"
                        : "Click 'Install' or use the ⊕ icon in your browser's address bar ↗"}
                </div>
            )}
        </div>
    );
};
