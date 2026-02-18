import { useNavigate } from "react-router-dom";
import { ArrowLeft, Car, Shield, Users, AlertTriangle, Scale, Lock, FileText, Star, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const EFFECTIVE_DATE = "February 18, 2025";
const LAST_UPDATED = "February 18, 2025";

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
    <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
        </div>
        <div className="pl-11 space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
);

const Sub = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mt-4">
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <div className="space-y-2">{children}</div>
    </div>
);

const Terms = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border z-40">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                            <Car className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold font-display">Rydin</span>
                    </div>
                    <span className="text-muted-foreground text-sm ml-1">/ Terms of Service</span>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-8">
                {/* Title Block */}
                <div className="mb-10">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                        <FileText className="w-3.5 h-3.5" />
                        Legal Document
                    </div>
                    <h1 className="text-3xl font-bold font-display mb-2">Terms of Service</h1>
                    <p className="text-muted-foreground text-sm">
                        Effective Date: <strong>{EFFECTIVE_DATE}</strong> · Last Updated: <strong>{LAST_UPDATED}</strong>
                    </p>
                </div>

                {/* Intro */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-10 text-sm text-muted-foreground leading-relaxed">
                    Welcome to <strong className="text-foreground">Rydin</strong> — a campus-exclusive ride-sharing and travel coordination platform built for verified SRM students. By accessing or using Rydin, you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform.
                </div>

                <Section icon={Users} title="1. Eligibility">
                    <p>To use Rydin, you must:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>Be a currently enrolled student or faculty member of an SRM institution</li>
                        <li>Register using a valid official <strong className="text-foreground">@srmist.edu.in</strong> email address</li>
                        <li>Complete identity verification including a valid SRM College ID upload</li>
                        <li>Be at least 18 years of age, or have parental/guardian consent</li>
                        <li>Provide accurate, complete, and truthful profile information</li>
                    </ul>
                    <p className="mt-3">We reserve the right to suspend or terminate access if any information provided is found to be false, misleading, or unverifiable.</p>
                </Section>

                <Section icon={Shield} title="2. Account Registration & Verification">
                    <Sub title="2.1 Email Verification">
                        <p>All accounts must be registered using an official SRM email. A verification link or OTP will be sent to confirm your email before access is granted.</p>
                    </Sub>
                    <Sub title="2.2 Profile Completion">
                        <p>Users must complete a mandatory profile including: full name (as per college ID), department, year of study, and gender. Gender selection is locked after submission and can only be changed through administrative review.</p>
                    </Sub>
                    <Sub title="2.3 Identity (ID) Verification">
                        <p>Users must upload a clear, valid SRM ID card photo. Access to ride hosting, joining, and direct messaging is restricted until ID verification is approved. Rydin stores ID images in private, encrypted storage and does not share them publicly. Rydin reserves the right to reject verification requests at its sole discretion.</p>
                    </Sub>
                    <Sub title="2.4 Google Sign-In">
                        <p>Users may sign in via Google OAuth. Google accounts must be linked to an SRM institutional email. Rydin is not responsible for Google's authentication policies or outages.</p>
                    </Sub>
                </Section>

                <Section icon={Car} title="3. Nature of the Platform">
                    <p>Rydin is a <strong className="text-foreground">peer-to-peer coordination platform only</strong>. Rydin:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>Is NOT a transportation provider or taxi service</li>
                        <li>Does NOT own, operate, or maintain any vehicles</li>
                        <li>Does NOT employ drivers or riders</li>
                        <li>Does NOT guarantee ride availability, punctuality, or safety</li>
                        <li>Does NOT control the conduct of any user during a ride</li>
                    </ul>
                    <p className="mt-3">Users are solely responsible for their own conduct, safety, and compliance with applicable laws during any ride arranged through Rydin.</p>
                </Section>

                <Section icon={Users} title="4. Girls-Only Ride Feature">
                    <p>Rydin provides an optional "Girls-Only" ride mode to enhance safety and comfort for female-identifying users.</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>Access is restricted to verified accounts with gender declared as female</li>
                        <li>Hosts of Girls-Only rides may only accept female-identifying passengers</li>
                        <li>Any misuse, impersonation, or circumvention of this feature will result in immediate suspension and may be escalated to institutional authorities</li>
                    </ul>
                    <p className="mt-3">Rydin relies on user-provided gender information and institutional ID verification. We do not independently verify biological sex.</p>
                </Section>

                <Section icon={Star} title="5. Trust Score & Reporting System">
                    <p>Rydin maintains a Trust Score system to promote safety and accountability.</p>
                    <Sub title="5.1 Trust Score Factors">
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Ride completion rate</li>
                            <li>Cancellation history</li>
                            <li>Reports received from other users</li>
                            <li>Identity verification status</li>
                            <li>Community conduct</li>
                        </ul>
                    </Sub>
                    <Sub title="5.2 Consequences of Low Trust Score">
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Restricted access to ride hosting or joining</li>
                            <li>Account suspension</li>
                            <li>Permanent ban from the platform</li>
                            <li>Escalation to SRM institutional authorities in severe cases</li>
                        </ul>
                    </Sub>
                    <Sub title="5.3 Reporting">
                        <p>Users may report others for unsafe, inappropriate, or dishonest behavior. Misuse of the reporting system (false or malicious reports) is itself a violation of these Terms.</p>
                    </Sub>
                </Section>

                <Section icon={AlertTriangle} title="6. User Responsibilities & Prohibited Conduct">
                    <p>Users agree to:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>Arrive on time for scheduled rides and communicate delays promptly</li>
                        <li>Treat all users with respect regardless of gender, religion, or background</li>
                        <li>Not engage in harassment, discrimination, or threatening behavior</li>
                        <li>Not share ride details or user contact information outside the platform</li>
                        <li>Not use Rydin for any commercial transportation or illegal activities</li>
                    </ul>
                    <p className="mt-3 font-medium text-foreground">Strictly prohibited:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                        <li>Creating fake or duplicate accounts</li>
                        <li>Impersonating another person or student</li>
                        <li>Uploading falsified or altered identification documents</li>
                        <li>Bypassing or attempting to circumvent verification systems</li>
                        <li>Sharing account credentials with others</li>
                        <li>Using the platform to solicit money outside of agreed ride fares</li>
                    </ul>
                </Section>

                <Section icon={Phone} title="7. Payments & Fare Splits">
                    <p>Rydin facilitates fare coordination between users. Rydin does NOT process payments directly and is NOT responsible for:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>Payment disputes between users</li>
                        <li>Failed UPI transactions</li>
                        <li>Overcharging or undercharging by ride hosts</li>
                    </ul>
                    <p className="mt-3">Users are encouraged to confirm fare amounts before joining a ride. Disputes should be resolved directly between parties.</p>
                </Section>

                <Section icon={AlertTriangle} title="8. Suspension & Termination">
                    <p>We may suspend or permanently terminate accounts if:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>Identity verification fails or is found fraudulent</li>
                        <li>Trust score falls below acceptable thresholds</li>
                        <li>Repeated or serious reports are received</li>
                        <li>Any provision of these Terms is violated</li>
                        <li>The account poses a safety risk to other users</li>
                    </ul>
                    <p className="mt-3">Rydin reserves the right to remove access at its discretion, without prior notice, for safety reasons.</p>
                </Section>

                <Section icon={AlertTriangle} title="9. Limitation of Liability">
                    <p>To the maximum extent permitted by applicable law, Rydin and its creators, operators, and affiliates shall NOT be liable for:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>Personal injury, death, or property damage arising from rides</li>
                        <li>Accidents, theft, or loss during travel</li>
                        <li>Disputes, conflicts, or misconduct between users</li>
                        <li>Inaccurate or outdated transport information (bus/train schedules)</li>
                        <li>Service interruptions, data loss, or technical failures</li>
                    </ul>
                    <p className="mt-3">Users participate entirely at their own risk. Rydin is a coordination tool, not a safety guarantee.</p>
                </Section>

                <Section icon={Lock} title="10. Intellectual Property">
                    <p>All content, design, code, branding, and features of Rydin are the intellectual property of Rydin and its creators. Users may not copy, reproduce, or distribute any part of the platform without explicit written permission.</p>
                </Section>

                <Section icon={FileText} title="11. Modifications to Terms">
                    <p>We may update these Terms at any time. Changes will be communicated via the app or email. Continued use of Rydin after changes constitutes acceptance of the revised Terms. We recommend reviewing this page periodically.</p>
                </Section>

                <Section icon={Scale} title="12. Governing Law & Jurisdiction">
                    <p>These Terms are governed by the laws of <strong className="text-foreground">India</strong>. Any disputes arising from use of Rydin shall be subject to the exclusive jurisdiction of courts in India. By using Rydin, you consent to this jurisdiction.</p>
                </Section>

                {/* Contact */}
                <div className="bg-muted/50 rounded-xl p-5 mt-4 text-sm">
                    <p className="font-semibold text-foreground mb-1">Contact Us</p>
                    <p className="text-muted-foreground">For questions about these Terms, reach us at{" "}
                        <a href="mailto:rydinsrm@gmail.com" className="text-primary hover:underline">rydinsrm@gmail.com</a>
                    </p>
                </div>

                {/* Privacy Link */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Also read our{" "}
                        <button onClick={() => navigate("/privacy")} className="text-primary hover:underline font-medium">
                            Privacy Policy
                        </button>
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Terms;
