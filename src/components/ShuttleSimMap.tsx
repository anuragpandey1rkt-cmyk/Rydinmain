import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bus, Navigation, Map as MapIcon, Landmark, Train, Timer, Wind } from "lucide-react";

interface BusState {
    id: number;
    progress: number;
    direction: "forward" | "backward";
    speed: number;
}

const ShuttleSimMap = () => {
    const [buses, setBuses] = useState<BusState[]>([
        { id: 1, progress: 10, direction: "forward", speed: 0.15 },
        { id: 2, progress: 85, direction: "backward", speed: 0.2 }
    ]);

    // Enhanced curved path reflecting GST Road / Internal SRM road curve
    const pathD = "M 40,160 C 100,160 180,120 220,90 S 320,40 360,40";

    useEffect(() => {
        const interval = setInterval(() => {
            setBuses(prev => prev.map(bus => {
                let nextProgress = bus.progress;
                let nextDirection = bus.direction;

                if (bus.direction === "forward") {
                    nextProgress += bus.speed;
                    if (nextProgress >= 100) {
                        nextProgress = 100;
                        nextDirection = "backward";
                    }
                } else {
                    nextProgress -= bus.speed;
                    if (nextProgress <= 0) {
                        nextProgress = 0;
                        nextDirection = "forward";
                    }
                }

                return { ...bus, progress: nextProgress, direction: nextDirection };
            }));
        }, 50);

        return () => clearInterval(interval);
    }, []);

    // Helper for SVG path interpolation (simplified for the visual)
    const getXY = (progress: number) => {
        const p = progress / 100;
        // Cubic Bezier approximation: (1-p)^3*P0 + 3(1-p)^2*p*P1 + 3(1-p)*p^2*P2 + p^3*P3
        // We use a simpler linear-split for X and a curved mapping for Y
        const x = 40 + (360 - 40) * p;
        const y = 160 - (160 - 40) * Math.pow(p, 0.7) + Math.sin(p * Math.PI) * 15;
        return { x, y };
    };

    return (
        <div className="relative w-full aspect-[16/9] bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-2xl shadow-indigo-500/5 group">
            {/* Topography Detail (Subtle Grid) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

            {/* Lush Campus Greenery Blobs */}
            <div className="absolute inset-0">
                <div className="absolute top-[10%] left-[20%] w-[120px] h-[80px] bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-[20%] right-[30%] w-[150px] h-[100px] bg-green-400/10 rounded-full blur-3xl" />
            </div>

            {/* Landmark Blocks */}
            <div className="absolute inset-0">
                {/* Tech Park */}
                <div className="absolute top-[55%] left-[12%] flex flex-col items-center gap-1 -rotate-6">
                    <div className="w-16 h-12 bg-white rounded-xl shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center justify-center">
                        <Landmark className="w-6 h-6 text-slate-300" />
                    </div>
                    <span className="text-[7px] font-black text-slate-400 tracking-widest bg-white/80 px-1 rounded uppercase">Tech Park</span>
                </div>

                {/* Java Block / UB */}
                <div className="absolute top-[25%] left-[45%] flex flex-col items-center gap-1 rotate-6">
                    <div className="w-20 h-16 bg-white rounded-2xl shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col p-2 gap-1.5">
                        <div className="h-2 w-full bg-slate-50 rounded" />
                        <div className="h-2 w-full bg-slate-50 rounded" />
                        <div className="h-2 w-2/3 bg-slate-50 rounded" />
                    </div>
                    <span className="text-[7px] font-black text-slate-400 tracking-widest bg-white/80 px-1 rounded uppercase">Main Gate / UB</span>
                </div>
            </div>

            {/* Main Road SVG */}
            <svg className="absolute inset-0 w-full h-full p-6" viewBox="0 0 400 200" preserveAspectRatio="none">
                <defs>
                    <filter id="roadGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
                        <feOffset dx="0" dy="2" result="offsetblur" />
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.1" />
                        </feComponentTransfer>
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Road Stroke */}
                <path d={pathD} fill="none" stroke="#CBD5E1" strokeWidth="12" strokeLinecap="round" filter="url(#roadGlow)" />
                <path d={pathD} fill="none" stroke="white" strokeWidth="10" strokeLinecap="round" />
                <path d={pathD} fill="none" stroke="#94A3B8" strokeWidth="1" strokeDasharray="6 12" strokeLinecap="round" className="opacity-40" />
            </svg>

            {/* Waypoint Markers */}
            <div className="absolute left-[8%] bottom-[12%]">
                <div className="relative flex flex-col items-center group">
                    <div className="w-4 h-4 rounded-full bg-white border-4 border-indigo-600 shadow-xl group-hover:scale-110 transition-transform" />
                    <div className="absolute top-6 whitespace-nowrap bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-xl">
                        <p className="text-[9px] font-black text-indigo-600 leading-none">SRM CAMPUS</p>
                    </div>
                </div>
            </div>

            <div className="absolute right-[8%] top-[12%]">
                <div className="relative flex flex-col items-center group">
                    <div className="w-4 h-4 rounded-full bg-white border-4 border-emerald-500 shadow-xl group-hover:scale-110 transition-transform" />
                    <div className="absolute top-6 whitespace-nowrap bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-xl">
                        <p className="text-[9px] font-black text-emerald-600 leading-none">POTHERI STATION</p>
                    </div>
                </div>
            </div>

            {/* Animated Buses */}
            {buses.map((bus) => {
                const { x, y } = getXY(bus.progress);
                return (
                    <motion.div
                        key={bus.id}
                        className="absolute z-20 pointer-events-none"
                        style={{
                            left: `${(x / 400) * 100}%`,
                            top: `${(y / 200) * 100}%`,
                            translateX: "-50%",
                            translateY: "-50%"
                        }}
                    >
                        <div className="relative">
                            {/* Bus Hover Flare */}
                            <div className="absolute -inset-4 bg-indigo-500/10 rounded-full blur-xl scale-0 group-hover:scale-100 transition-transform" />

                            <motion.div
                                animate={{
                                    rotateY: bus.direction === "forward" ? 0 : 180,
                                    y: [0, -2, 0]
                                }}
                                transition={{ y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } }}
                                className={`p-2 rounded-xl shadow-2xl border flex items-center justify-center transition-colors ${bus.id === 1 ? "bg-indigo-600 border-indigo-400" : "bg-white border-slate-100"
                                    }`}
                            >
                                <Bus className={`w-4 h-4 ${bus.id === 1 ? "text-white" : "text-indigo-600"}`} />

                                {/* Live Indicator Hooked to Bus */}
                                {bus.id === 1 && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 border-2 border-white rounded-full animate-pulse" />
                                )}
                            </motion.div>

                            {/* Proximity Label */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-slate-900/90 backdrop-blur-md text-white text-[7px] font-bold px-2 py-1 rounded-full shadow-xl whitespace-nowrap">
                                #{bus.id} · {bus.direction === "forward" ? "To Potheri" : "To Campus"}
                            </div>
                        </div>
                    </motion.div>
                );
            })}

            {/* Premium HUD / Controls */}
            <div className="absolute top-6 left-6 flex flex-col gap-3">
                <div className="flex items-center gap-3 bg-white/90 backdrop-blur-2xl p-1.5 pr-4 rounded-full border border-slate-200/50 shadow-xl shadow-slate-200/20">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Bus className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-800 leading-none">SHUTTLE LIVE</p>
                        <p className="text-[7px] text-slate-400 font-bold uppercase tracking-wide">2 ACTIVE · 5M FREQ</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 backdrop-blur-md rounded-full border border-slate-100 w-fit">
                    <Timer className="w-3 h-3 text-slate-400" />
                    <span className="text-[8px] font-bold text-slate-500">Next arrival: 3m</span>
                </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Main Path</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-200" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Service Rd</span>
                    </div>
                </div>

                <button className="h-10 px-6 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center gap-2 hover:bg-slate-800 active:scale-95 transition-all group/btn">
                    <Navigation className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-tight">Open Map</span>
                </button>
            </div>

            {/* Speed/Wind Effects Decoration */}
            <div className="absolute top-1/2 left-[30%] opacity-20 flex gap-1 animate-pulse">
                <Wind className="w-4 h-4 text-slate-300" />
            </div>
        </div>
    );
};

export default ShuttleSimMap;
