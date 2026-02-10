import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Trophy, Zap, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TrustScoreAnimationProps {
  previousScore: number;
  newScore: number;
  isVisible: boolean;
  onClose?: () => void;
}

const TrustScoreAnimation = ({
  previousScore = 72,
  newScore = 75,
  isVisible = true,
  onClose,
}: TrustScoreAnimationProps) => {
  const [displayScore, setDisplayScore] = useState(previousScore);
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    // Animate score increase
    const interval = setInterval(() => {
      setDisplayScore((prev) => {
        if (prev >= newScore) {
          clearInterval(interval);
          setShowBadge(true);
          return newScore;
        }
        return prev + 1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible, newScore]);

  if (!isVisible) return null;

  const getBadgeInfo = (score: number) => {
    if (score >= 90) return { name: "Master Rider", color: "bg-gold", icon: "👑" };
    if (score >= 80) return { name: "Trusted Rider", color: "bg-blue", icon: "⭐" };
    if (score >= 70) return { name: "Reliable Rider", color: "bg-green", icon: "✅" };
    return { name: "New Member", color: "bg-gray", icon: "🌱" };
  };

  const badge = getBadgeInfo(newScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-sm bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 border-0 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 text-center space-y-6">
          {/* Celebration animation */}
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            className="flex justify-center"
          >
            <div className="relative w-20 h-20">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute inset-0 bg-white/20 rounded-full"
              />
              <Star className="w-20 h-20 fill-white" />
            </div>
          </motion.div>

          {/* Score display */}
          <div>
            <p className="text-sm font-semibold opacity-90 mb-2">Your Trust Score</p>
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="text-5xl font-bold"
            >
              {displayScore}/100
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm opacity-90 mt-2"
            >
              +{newScore - previousScore} points from this ride!
            </motion.p>
          </div>

          {/* Badge unlock */}
          {showBadge && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 100, delay: 0.5 }}
              className="space-y-2"
            >
              <div className="flex justify-center gap-2">
                <Trophy className="w-5 h-5" />
                <span className="font-semibold">Badge Unlocked!</span>
              </div>
              <Badge className="bg-white text-purple-600 hover:bg-white text-base py-2 px-4">
                {badge.icon} {badge.name}
              </Badge>
              <p className="text-xs opacity-90">
                Keep riding with Rydin to unlock more badges
              </p>
            </motion.div>
          )}

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-sm space-y-2"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Higher score = More ride requests</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>Unlock special ride features</span>
            </div>
          </motion.div>

          {/* Close button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="w-full bg-white/20 hover:bg-white/30 font-semibold py-3 rounded-lg transition-colors"
          >
            Awesome! Let's go
          </motion.button>
        </div>
      </Card>
    </motion.div>
  );
};

export default TrustScoreAnimation;
