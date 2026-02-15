import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  MapPin,
  Phone,
  Building,
  GraduationCap,
  Shield,
  LogOut,
  Edit2,
  CheckCircle,
  Award,
  Users,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge as UIWebBadge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getReliabilityBadgeConfig } from "@/lib/noShowHandling";
import { IDScanner } from "@/components/IDScanner";
import { getUserBadges, Badge as GameBadge } from "@/lib/leaderboards";
import { getUserReferralStats } from "@/lib/referrals";

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [badges, setBadges] = useState<GameBadge[]>([]);
  const [referralStats, setReferralStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchUserStats();
    }
  }, [user?.id]);

  const fetchUserStats = async () => {
    try {
      setLoadingStats(true);
      const [earnedBadges, stats] = await Promise.all([
        getUserBadges(user!.id),
        getUserReferralStats(user!.id)
      ]);
      setBadges(earnedBadges);
      setReferralStats(stats);
    } catch (error) {
      console.error("Error fetching profile stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast({ title: "Logged out", description: "See you soon!" });
      navigate("/auth");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setIsLoggingOut(false);
  };

  const handleScanSuccess = () => {
    setShowScanner(false);
    toast({
      title: "Success",
      description: "Identity verified successfully!",
    });
    // Refresh user data or reload page
    window.location.reload();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const reliabilityStatus = user.trust_score >= 4.5 ? "excellent" : user.trust_score >= 4.0 ? "good" : "fair";
  const badgeConfig = getReliabilityBadgeConfig(reliabilityStatus as any);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-md z-40 border-b border-border">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold font-display">Your Profile</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile-edit")}
            className="h-9 w-9"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-6"
      >
        {/* Profile Header Card */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-bold font-display">{user.name}</h2>
                  {user.phone_verified && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{user.trust_score.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">Trust Score</p>
              </div>
            </div>

            {/* Reliability Badge */}
            <div className={`rounded-lg p-3 border ${badgeConfig.color}`}>
              <p className="text-xs font-semibold">{badgeConfig.icon} {badgeConfig.label}</p>
              <p className="text-xs">{badgeConfig.description}</p>
            </div>
          </div>
        </div>

        {/* Verification Section */}
        {!user.phone_verified && (
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">Verify Your Identity</p>
              <p className="text-xs text-orange-800 dark:text-orange-200">Scan student ID to get "Verified" badge</p>
            </div>
            <Button size="sm" onClick={() => setShowScanner(true)}>Verify Now</Button>
          </div>
        )}

        {/* Real-time Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-lg p-4 border border-border flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Credits</p>
              <p className="text-xl font-bold font-display">₹{referralStats?.total_earned || 0}</p>
            </div>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full text-green-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Referrals</p>
              <p className="text-xl font-bold font-display">{referralStats?.total_referrals || 0}</p>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Earned Badges</h3>
            <span className="text-xs text-primary font-medium">{badges.length} Unlocked</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {badges.length > 0 ? (
              badges.map((badge) => (
                <UIWebBadge key={badge.id} variant="secondary" className="px-3 py-1 flex items-center gap-1.5">
                  <span>{badge.icon}</span>
                  <span>{badge.name}</span>
                </UIWebBadge>
              ))
            ) : (
              <div className="w-full py-8 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center space-y-2">
                <Award className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">Complete rides and splits to earn badges!</p>
              </div>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">About You</h3>

          {user.department && (
            <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
              <Building className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="font-semibold">{user.department}</p>
              </div>
            </div>
          )}

          {user.year && (
            <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
              <GraduationCap className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Year</p>
                <p className="font-semibold">{user.year}</p>
              </div>
            </div>
          )}

          {user.phone && (
            <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
              <Phone className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-semibold">{user.phone}</p>
              </div>
            </div>
          )}

          {user.emergency_contact_phone && (
            <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
              <Shield className="w-5 h-5 text-safety shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Emergency Contact</p>
                <p className="font-semibold">{user.emergency_contact_name}</p>
                <p className="text-xs text-muted-foreground">{user.emergency_contact_phone}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-4">
          <Button
            variant="outline"
            className="w-full h-12 sm:h-11"
            onClick={() => navigate("/profile-edit")}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
          <Button
            variant="destructive"
            className="w-full h-12 sm:h-11"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </motion.main>

      <AnimatePresence>
        {showScanner && (
          <IDScanner
            userId={user.id}
            onSuccess={handleScanSuccess}
            onCancel={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default Profile;
