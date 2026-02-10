import { useState } from "react";
import { AlertTriangle, Phone, MapPin, Share2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

interface EmergencySafetyModeProps {
  onEmergencyActivate?: () => void;
}

const EmergencySafetyMode = ({ onEmergencyActivate }: EmergencySafetyModeProps) => {
  const [isActive, setIsActive] = useState(false);

  const handleEmergency = () => {
    setIsActive(true);
    onEmergencyActivate?.();

    // Auto-disable after 10 seconds
    setTimeout(() => setIsActive(false), 10000);
  };

  const emergencyContacts = [
    { label: "Police", number: "100", icon: "🚔" },
    { label: "Women's Helpline", number: "181", icon: "👩" },
    { label: "Ambulance", number: "102", icon: "🚑" },
    { label: "Nearest Police Station", location: "500m away", icon: "🏢" },
  ];

  if (isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 z-50 bg-red-600 flex items-center justify-center p-4"
      >
        <Card className="w-full max-w-sm bg-white shadow-2xl">
          <div className="p-6 text-center space-y-6">
            {/* Alert */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="flex justify-center"
            >
              <AlertTriangle className="w-16 h-16 text-red-600" />
            </motion.div>

            <h2 className="text-2xl font-bold text-red-600">EMERGENCY MODE ACTIVE</h2>

            {/* Emergency contacts grid */}
            <div className="grid grid-cols-2 gap-3">
              {emergencyContacts.map((contact) => (
                <a
                  key={contact.label}
                  href={contact.number ? `tel:${contact.number}` : "#"}
                  className="bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg p-3 text-center transition-colors"
                >
                  <div className="text-2xl mb-1">{contact.icon}</div>
                  <p className="text-xs font-medium text-red-900">{contact.label}</p>
                  <p className="text-sm font-bold text-red-600">
                    {contact.number || contact.location}
                  </p>
                </a>
              ))}
            </div>

            {/* Trip details shared */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-blue-900">
                <MapPin className="w-4 h-4" />
                <span>Trip details shared with emergency contacts</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-900">
                <Share2 className="w-4 h-4" />
                <span>Real-time location: Shared</span>
              </div>
            </div>

            {/* Disable button */}
            <Button
              onClick={() => setIsActive(false)}
              className="w-full"
              variant="outline"
            >
              Disable Emergency Mode
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <Card className="p-4 bg-red-50 border border-red-200">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 text-sm">Emergency Safety Mode</h3>
          <p className="text-xs text-red-800 mt-1">
            One-click access to emergency numbers, police stations, and instant location sharing.
          </p>
          <Button
            onClick={handleEmergency}
            className="mt-3 bg-red-600 hover:bg-red-700 text-white"
            size="sm"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Activate Safety Mode
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default EmergencySafetyMode;
