import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertCircle, Shield } from "lucide-react";

interface HopperSafetyOptionsProps {
  isGirlsOnly: boolean;
  onGirlsOnlyChange: (value: boolean) => void;
  enabledFeaturesInfo?: boolean;
}

const HopperSafetyOptions = ({
  isGirlsOnly,
  onGirlsOnlyChange,
  enabledFeaturesInfo = true,
}: HopperSafetyOptionsProps) => {
  return (
    <div className="space-y-4 border-t border-border pt-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-safety" />
        <h3 className="text-sm font-semibold">Safety Options</h3>
      </div>

      {/* Girls-Only Toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <Label className="text-sm font-medium cursor-pointer">
            Girls-only hopper
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Only female students can join
          </p>
        </div>
        <Switch
          checked={isGirlsOnly}
          onCheckedChange={onGirlsOnlyChange}
        />
      </div>

      {/* Info Box */}
      {enabledFeaturesInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900">
            <p className="font-medium">Safety built-in:</p>
            <ul className="mt-1 space-y-1 ml-3 list-disc">
              <li>Request → Accept only (no auto-chat)</li>
              <li>Names visible before chat</li>
              <li>Block/report users if needed</li>
              <li>One active hopper per user</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default HopperSafetyOptions;
