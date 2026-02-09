import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Phone, GraduationCap, Building, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

const departments = [
  "Computer Science", "Electronics", "Mechanical", "Civil",
  "Biotech", "Commerce", "Law", "Medicine", "Arts",
];

const ProfileSetup = () => {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const { updateProfile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      department,
      year,
      phone,
      gender: gender as "male" | "female" | "other",
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold font-display text-center mb-2">Complete your profile</h1>
        <p className="text-center text-muted-foreground text-sm mb-8">
          Help others know who they're riding with
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10 h-12 bg-card"
              required
            />
          </div>

          <Select value={department} onValueChange={setDepartment} required>
            <SelectTrigger className="h-12 bg-card">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Department" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={year} onValueChange={setYear} required>
            <SelectTrigger className="h-12 bg-card">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Year" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"].map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={gender} onValueChange={(v) => setGender(v as "male" | "female" | "other")} required>
            <SelectTrigger className="h-12 bg-card">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-10 h-12 bg-card"
              type="tel"
              required
            />
          </div>

          <Button type="submit" className="w-full h-12 text-base font-semibold gap-2">
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ProfileSetup;
