import { Home, Plus, MapPin, Train, CreditCard, User, MessageSquare, Plane } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Explore", path: "/" },
  { icon: Plus, label: "Host Ride", path: "/create" },
  { icon: Plane, label: "Travel", path: "/travel" },
  { icon: Train, label: "Transport", path: "/transport" },
  { icon: MapPin, label: "Events", path: "/events" },
  { icon: MessageSquare, label: "Activity", path: "/activity" },
  { icon: CreditCard, label: "Pay", path: "/settlement" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center w-full h-16 px-1">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[8px] font-medium leading-tight text-center w-full truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
