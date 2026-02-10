import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, ArrowRight, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { InputOTP } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

const SMSVerification = () => {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const { sendPhoneOTP, verifyPhoneOTP } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!phoneNumber.match(/^\d{10}$/)) {
        throw new Error("Please enter a valid 10-digit phone number");
      }

      const result = await sendPhoneOTP(phoneNumber);
      setConfirmationResult(result);
      setStep("otp");
      
      toast({
        title: "OTP Sent",
        description: "Check your phone for the verification code",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (otp.length !== 6) {
        throw new Error("Please enter a valid 6-digit OTP");
      }

      await verifyPhoneOTP(confirmationResult, otp);
      
      toast({
        title: "Success",
        description: "Phone verified successfully",
      });
      
      navigate("/profile-setup");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Phone className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Verify Phone</h1>
        </div>

        <p className="text-center text-muted-foreground mb-8 text-sm">
          {step === "phone"
            ? "We'll send you a verification code"
            : "Enter the code we sent to your phone"}
        </p>

        {step === "phone" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="tel"
                placeholder="10-digit phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="pl-10 h-12 bg-card"
                required
                disabled={isLoading}
                pattern="\d{10}"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold gap-2" 
              disabled={isLoading || phoneNumber.length !== 10}
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send Code
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                value={otp}
                onChange={setOtp}
                disabled={isLoading}
              >
              </InputOTP>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Didn't receive the code?{" "}
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="text-primary hover:underline"
              >
                Try again
              </button>
            </p>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold gap-2" 
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify Code
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default SMSVerification;
