import { motion } from "framer-motion";
import { Zap, MapPin, IndianRupee, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

interface RideClusteringSuggestionProps {
  hub: {
    name: string;
    center_latitude: number;
    center_longitude: number;
  };
  savings: number;
  onAccept: () => void;
}

const RideClusteringSuggestion = ({ hub, savings, onAccept }: RideClusteringSuggestionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-primary/10 border border-primary/30 rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
        <Zap className="w-4 h-4 fill-primary" />
        Smart Match Suggestion
      </div>

      <p className="text-sm text-foreground/80 leading-relaxed">
        We found 3 nearby riders! If you meet at <span className="font-bold text-primary">{hub.name}</span>, everyone saves money.
      </p>

      <div className="flex items-center justify-between bg-background/50 rounded-xl p-3 border border-primary/10">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">You Save</span>
          <div className="flex items-center gap-1">
            <IndianRupee className="w-4 h-4 text-safety" />
            <span className="text-xl font-bold text-safety">₹{Math.round(savings)}</span>
          </div>
        </div>
        <div className="h-8 w-[1px] bg-primary/20" />
        <div className="flex flex-col items-end text-right">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Pickup Hub</span>
          <div className="flex items-center gap-1 text-primary">
            <MapPin className="w-3 h-3" />
            <span className="text-sm font-bold">{hub.name}</span>
          </div>
        </div>
      </div>

      <Button onClick={onAccept} className="w-full gap-2 font-bold shadow-lg shadow-primary/20">
        Use Suggested Hub
        <ArrowRight className="w-4 h-4" />
      </Button>
    </motion.div>
  );
};

export default RideClusteringSuggestion;
