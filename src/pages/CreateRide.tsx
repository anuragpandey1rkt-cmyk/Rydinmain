import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Calendar, Clock, Users, Plane, IndianRupee, Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";

const CreateRide = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [girlsOnly, setGirlsOnly] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Ride created! 🚕", description: "Others can now find and join your ride." });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-background/80 backdrop-blur-md z-40 border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold font-display">Create a Ride</h1>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto px-4 py-6"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Pickup point (e.g., SRM Campus)" className="pl-10 h-12 bg-card" required />
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
            <Input placeholder="Destination (e.g., Chennai Airport)" className="pl-10 h-12 bg-card" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="date" className="pl-10 h-12 bg-card" required />
            </div>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="time" className="pl-10 h-12 bg-card" required />
            </div>
          </div>

          <div className="relative">
            <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Flight/Train number (optional)" className="pl-10 h-12 bg-card" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select required>
              <SelectTrigger className="h-12 bg-card">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="Max seats" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} seats</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="number" placeholder="Est. fare" className="pl-10 h-12 bg-card" required />
            </div>
          </div>

          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-safety" />
              <span className="text-sm font-medium">Girls-only ride</span>
            </div>
            <Switch checked={girlsOnly} onCheckedChange={setGirlsOnly} />
          </div>

          <Button type="submit" className="w-full h-12 text-base font-semibold">
            Create Ride
          </Button>
        </form>
      </motion.main>

      <BottomNav />
    </div>
  );
};

export default CreateRide;
