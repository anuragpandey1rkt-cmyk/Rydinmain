import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Clock } from "lucide-react";

interface HopperRequest {
  id: string;
  requesting_user_id: string;
  requested_user_id: string;
  hopper_id: string;
  status: "pending" | "accepted" | "rejected";
  requesting_user?: {
    name: string;
    gender?: string;
  };
  hopper?: {
    pickup_location: string;
    drop_location: string;
    departure_time: string;
  };
}

interface HopperRequestDialogProps {
  request: HopperRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (requestId: string) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
  isLoading?: boolean;
}

const HopperRequestDialog = ({
  request,
  isOpen,
  onClose,
  onAccept,
  onReject,
  isLoading = false,
}: HopperRequestDialogProps) => {
  const [actionInProgress, setActionInProgress] = useState<"accept" | "reject" | null>(null);

  const handleAccept = async () => {
    if (!request) return;
    setActionInProgress("accept");
    try {
      await onAccept(request.id);
      onClose();
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async () => {
    if (!request) return;
    setActionInProgress("reject");
    try {
      await onReject(request.id);
      onClose();
    } finally {
      setActionInProgress(null);
    }
  };

  if (!request) return null;

  const getInitials = (name?: string) => {
    return (name || "U")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Hopper Request</AlertDialogTitle>
          <AlertDialogDescription>
            Someone wants to join your ride
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 bg-blue-100">
              <AvatarFallback className="text-blue-700">
                {getInitials(request.requesting_user?.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{request.requesting_user?.name || "Student"}</p>
              <p className="text-sm text-muted-foreground">
                {request.requesting_user?.gender || ""} student
              </p>
            </div>
          </div>

          {/* Ride Details */}
          {request.hopper && (
            <div className="bg-muted rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{request.hopper.pickup_location}</span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 pl-6">
                <span className="text-lg">↓</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{request.hopper.drop_location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 pl-6">
                <Clock className="w-4 h-4" />
                <span>{request.hopper.departure_time}</span>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Accept to unlock chat and coordinate pickup details.
          </p>
        </div>

        <div className="flex gap-2">
          <AlertDialogCancel disabled={isLoading}>
            Reject
          </AlertDialogCancel>
          <Button
            onClick={handleAccept}
            disabled={isLoading || actionInProgress === "accept"}
            className="flex-1"
          >
            {actionInProgress === "accept" ? "Accepting..." : "Accept"}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default HopperRequestDialog;
