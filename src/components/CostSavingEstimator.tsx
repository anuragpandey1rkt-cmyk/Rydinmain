import { useState } from "react";
import { TrendingDown, Users, IndianRupee } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

interface CostSavingEstimatorProps {
  origin: string;
  destination: string;
  baseCost?: number;
}

const CostSavingEstimator = ({
  origin,
  destination,
  baseCost = 1200,
}: CostSavingEstimatorProps) => {
  const [coPassengers, setCoPassengers] = useState(1);

  const costPerPerson = Math.ceil(baseCost / coPassengers);
  const totalSavings = baseCost - costPerPerson;
  const savingsPercent = Math.round((totalSavings / baseCost) * 100);

  const getCostColor = (passengers: number) => {
    if (passengers === 1) return "text-red-600";
    if (passengers === 2) return "text-yellow-600";
    if (passengers >= 3) return "text-green-600";
    return "text-gray-600";
  };

  const getBackgroundColor = (passengers: number) => {
    if (passengers === 1) return "bg-red-50";
    if (passengers === 2) return "bg-yellow-50";
    if (passengers >= 3) return "bg-green-50";
    return "bg-gray-50";
  };

  return (
    <Card className={`p-6 ${getBackgroundColor(coPassengers)}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{origin} → {destination}</h3>
            <p className="text-sm text-muted-foreground">Cost per person changes as you add co-passengers</p>
          </div>
          <TrendingDown className={`w-8 h-8 ${getCostColor(coPassengers)}`} />
        </div>

        {/* Co-passenger slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium">Number of co-passengers</label>
            <span className="text-2xl font-bold flex items-center gap-1">
              <Users className="w-6 h-6" />
              {coPassengers}
            </span>
          </div>
          <Slider
            value={[coPassengers]}
            onValueChange={(val) => setCoPassengers(val[0])}
            min={1}
            max={4}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Solo</span>
            <span>4 people</span>
          </div>
        </div>

        {/* Cost breakdown animation */}
        <div className="grid grid-cols-2 gap-4">
          {/* Solo cost */}
          <div className="bg-red-100 rounded-lg p-4 border border-red-200">
            <p className="text-xs text-red-900 font-medium mb-1">If you go alone</p>
            <p className="text-2xl font-bold text-red-600">₹{baseCost}</p>
          </div>

          {/* Shared cost */}
          <div className={`bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg p-4 border-2 border-green-400`}>
            <p className="text-xs text-green-900 font-medium mb-1">With {coPassengers} {coPassengers === 1 ? "person" : "people"}</p>
            <p className={`text-2xl font-bold ${getCostColor(coPassengers)}`}>₹{costPerPerson}</p>
          </div>
        </div>

        {/* Savings highlight */}
        {coPassengers > 1 && (
          <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-900 font-medium">You save</p>
                <p className="text-3xl font-bold text-green-600 mt-1">₹{totalSavings}</p>
                <p className="text-xs text-green-700 mt-1">({savingsPercent}% cheaper!)</p>
              </div>
              <div className="text-4xl">🎉</div>
            </div>
          </div>
        )}

        {/* Trust message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900">
            <span className="font-bold">💡 Pro tip:</span> More co-passengers = More savings. Use Hopper to find them instantly!
          </p>
        </div>
      </div>
    </Card>
  );
};

export default CostSavingEstimator;
