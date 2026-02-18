import { useNavigate } from "react-router-dom";
import { ArrowLeft, Car, Database, Eye, Lock, Share2, UserCheck, FileText, Shield, Trash2, Bell } from "lucide-react";
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

const Privacy = () => {
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
                    <span className="text-muted-foreground text-sm ml-1">/ Privacy Policy</span>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-8">
                {/* Title Block */}
                <div className="mb-10">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                        <Lock className="w-3.5 h-3.5" />
                        Privacy Document
                    </div>
                    <h1 className="text-3xl font-bold font-display mb-2">Privacy Policy</h1>
                    <p className="text-muted-foreground text-sm">
                        Effective Date: <strong>{EFFECTIVE_DATE}</strong> · Last Updated: <strong>{LAST_UPDATED}</strong>
                    </p>
                </div>

                {/* Intro */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-10 text-sm text-muted-foreground leading-relaxed">
                    At <strong className="text-foreground">Rydin</strong>, your privacy is a core priority — not an afterthought. This Privacy Policy explains what data we collect, why we collect it, how we protect it, and what rights you have over it. We are committed to transparency and responsible data handling.
                </div>

                <Section icon={Database} title="1. Information We Collect">
                    <Sub title="1.1 Account Information">
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Full name (as per SRM ID)</li>
                            <li>Official SRM email address (<strong className="text-foreground">@srmist.edu.in</strong>)</li>
                            <li>Department and year of study</li>
                            <li>Gender (used for Girls-Only ride feature)</li>
                            <li>Phone number (optional, for emergency contact)</li>
                            <li>UPI ID (optional, for fare coordination)</li>
                            <li>Profile photo (optional)</li>
                        </ul>
                    </Sub>
                    <Sub title="1.2 Identity Verification Data">
                        <ul className="list-disc pl-5 space-y-1">
                            <li>SRM College ID card image (uploaded by user)</li>
                            <li>Verification status (pending / verified / rejected)</li>
                            <li>Timestamp of verification</li>
                        </ul>
                    </Sub>
                    <Sub title="1.3 Ride & Activity Data">
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Rides created, joined, or cancelled</li>
                            <li>Ride routes, destinations, and departure times</li>
                            <li>Seat availability and fare information</li>
                            <li>Ride join requests and their outcomes</li>
                            <li>Trust score and its contributing factors</li>
                            <li>Reports submitted or received</li>
                        </ul>
                    </Sub>
                    <Sub title="1.4 Communication Data">
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Messages sent in ride group chats</li>
                            <li>Direct messages between matched users</li>
                            <li>Emergency contact information (if provided)</li>
                        </ul>
                    </Sub>
                    <Sub title="1.5 Technical & Device Data">
                        <ul className="list-disc pl-5 space-y-1">
                            <li>IP address and approximate location (city-level)</li>
                            <li>Browser type, OS, and device model</li>
                            <li>Session tokens and authentication metadata</li>
                            <li>App usage patterns and feature interactions</li>
                            <li>Error logs and crash reports</li>
                        </ul>
                    </Sub>
                    <Sub title="1.6 Google OAuth Data (if used)">
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Google account email and display name</li>
                            <li>Google profile picture (if granted)</li>
                            <li>OAuth tokens (stored securely, not shared)</li>
                        </ul>
                    </Sub>
                </Section>

                <Section icon={Eye} title="2. How We Use Your Information">
                    <p>We use your data exclusively to operate and improve Rydin:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li><strong className="text-foreground">Authentication:</strong> Verify SRM affiliation and manage secure login sessions</li>
                        <li><strong className="text-foreground">Ride Matching:</strong> Connect users with compatible rides based on route and timing</li>
                        <li><strong className="text-foreground">Safety Systems:</strong> Maintain trust scores, process reports, and enforce community standards</li>
                        <li><strong className="text-foreground">Communication:</strong> Enable in-app messaging between ride participants</li>
                        <li><strong className="text-foreground">Girls-Only Feature:</strong> Enforce gender-restricted ride access using verified profile data</li>
                        <li><strong className="text-foreground">Notifications:</strong> Send ride updates, join requests, and important alerts</li>
                        <li><strong className="text-foreground">Platform Improvement:</strong> Analyze usage patterns to improve features and fix bugs</li>
                        <li><strong className="text-foreground">Legal Compliance:</strong> Respond to lawful requests from authorities when required</li>
                    </ul>
                    <p className="mt-3 font-medium text-foreground">We do NOT use your data for advertising, profiling, or selling to third parties.</p>
                </Section>

                <Section icon={Lock} title="3. Data Storage & Security">
                    <p>Rydin uses enterprise-grade infrastructure to protect your data:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li><strong className="text-foreground">Database:</strong> Supabase (PostgreSQL) with Row-Level Security (RLS) — users can only access their own data</li>
                        <li><strong className="text-foreground">Authentication:</strong> Supabase Auth with secure JWT session tokens and bcrypt password hashing</li>
                        <li><strong className="text-foreground">ID Storage:</strong> College ID images are stored in private, access-controlled storage buckets — never publicly accessible</li>
                        <li><strong className="text-foreground">Encryption:</strong> All data is encrypted in transit (TLS/HTTPS) and at rest</li>
                        <li><strong className="text-foreground">Access Control:</strong> Only authorized Rydin administrators can access verification data, under strict internal policies</li>
                    </ul>
                    <p className="mt-3">Despite our best efforts, no system is 100% secure. We encourage users to use strong passwords and report any suspicious activity immediately.</p>
                </Section>

                <Section icon={Trash2} title="4. Data Retention">
                    <Sub title="4.1 Active Accounts">
                        <p>We retain your data for as long as your account is active and for a reasonable period thereafter to support dispute resolution and safety investigations.</p>
                    </Sub>
                    <Sub title="4.2 Deleted Accounts">
                        <p>Upon account deletion request, we will delete your personal profile data within 30 days. Some data may be retained in anonymized or aggregated form for platform analytics.</p>
                    </Sub>
                    <Sub title="4.3 ID Verification Images">
                        <p>College ID images are retained for the duration of your account. You may request deletion of your ID image after verification is complete by contacting us at <a href="mailto:rydinsrm@gmail.com" className="text-primary hover:underline">rydinsrm@gmail.com</a>.</p>
                    </Sub>
                    <Sub title="4.4 Chat Messages">
                        <p>Ride chat messages are retained for 90 days after a ride's departure date. Direct messages are retained for the duration of both users' accounts.</p>
                    </Sub>
                </Section>

                <Section icon={Share2} title="5. Data Sharing">
                    <p className="font-medium text-foreground">We do not sell, rent, or trade your personal data. Ever.</p>
                    <p className="mt-3">We may share limited data only in these circumstances:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li><strong className="text-foreground">Service Providers:</strong> Supabase (database/auth), Resend (email delivery), Vercel (hosting) — bound by strict data processing agreements</li>
                        <li><strong className="text-foreground">Legal Requirements:</strong> If required by Indian law, court order, or lawful authority request</li>
                        <li><strong className="text-foreground">Safety Escalation:</strong> In cases of serious safety threats, we may share relevant information with SRM institutional authorities or law enforcement</li>
                        <li><strong className="text-foreground">Ride Participants:</strong> Your name, profile photo, and trust score are visible to users in the same ride</li>
                    </ul>
                </Section>

                <Section icon={UserCheck} title="6. Your Rights">
                    <p>As a Rydin user, you have the right to:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li><strong className="text-foreground">Access:</strong> Request a copy of all personal data we hold about you</li>
                        <li><strong className="text-foreground">Correction:</strong> Update or correct inaccurate profile information at any time</li>
                        <li><strong className="text-foreground">Deletion:</strong> Request deletion of your account and associated personal data</li>
                        <li><strong className="text-foreground">ID Removal:</strong> Request deletion of your uploaded ID image after verification</li>
                        <li><strong className="text-foreground">Portability:</strong> Request your data in a structured, machine-readable format</li>
                        <li><strong className="text-foreground">Objection:</strong> Object to specific uses of your data where legally applicable</li>
                    </ul>
                    <p className="mt-3">To exercise any of these rights, contact us at <a href="mailto:rydinsrm@gmail.com" className="text-primary hover:underline">rydinsrm@gmail.com</a>. We will respond within 30 days.</p>
                </Section>

                <Section icon={Shield} title="7. Safety Monitoring">
                    <p>To maintain a safe community, Rydin may:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>Monitor report patterns to detect abuse of the reporting system</li>
                        <li>Review flagged content or accounts following user reports</li>
                        <li>Analyze ride cancellation patterns to identify bad actors</li>
                        <li>Log authentication events to detect unauthorized access</li>
                    </ul>
                    <p className="mt-3">This monitoring is conducted solely for platform safety and is not used for commercial profiling.</p>
                </Section>

                <Section icon={Bell} title="8. Cookies & Local Storage">
                    <p>Rydin uses browser local storage and session cookies to:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        <li>Maintain your login session securely</li>
                        <li>Remember your theme preference (dark/light mode)</li>
                        <li>Store temporary UI state for a smoother experience</li>
                    </ul>
                    <p className="mt-3">We do not use third-party tracking cookies or advertising cookies.</p>
                </Section>

                <Section icon={FileText} title="9. Children's Privacy">
                    <p>Rydin is intended for users aged 18 and above. We do not knowingly collect data from anyone under 18. If you believe a minor has registered, please contact us immediately at <a href="mailto:rydinsrm@gmail.com" className="text-primary hover:underline">rydinsrm@gmail.com</a> and we will remove the account promptly.</p>
                </Section>

                <Section icon={FileText} title="10. Changes to This Policy">
                    <p>We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. We will notify you of significant changes via in-app notification or email. The "Last Updated" date at the top of this page will always reflect the most recent revision. Continued use of Rydin after changes constitutes acceptance of the updated policy.</p>
                </Section>

                {/* Contact */}
                <div className="bg-muted/50 rounded-xl p-5 mt-4 text-sm">
                    <p className="font-semibold text-foreground mb-1">Privacy Questions?</p>
                    <p className="text-muted-foreground">
                        Contact our team at{" "}
                        <a href="mailto:rydinsrm@gmail.com" className="text-primary hover:underline">rydinsrm@gmail.com</a>
                        . We take all privacy concerns seriously and will respond within 30 days.
                    </p>
                </div>

                {/* Terms Link */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Also read our{" "}
                        <button onClick={() => navigate("/terms")} className="text-primary hover:underline font-medium">
                            Terms of Service
                        </button>
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Privacy;
