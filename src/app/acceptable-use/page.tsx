import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import Footer from "@/components/Footer";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const LAST_UPDATED = "January 2025";

const PROHIBITED = [
  "Sending unsolicited bulk email (spam) of any kind.",
  "Phishing, spoofing, or impersonating any person or organisation.",
  "Sending emails containing malware, viruses, or malicious links.",
  "Harvesting or scraping email addresses for mass mailing.",
  "Sending content that is illegal, defamatory, harassing, or threatening.",
  "Circumventing Gmail's own sending limits or terms of service.",
  "Using the Service to relay email on behalf of third parties without their consent.",
  "Creating multiple accounts to bypass quotas or restrictions.",
  "Attempting to reverse-engineer, exploit, or attack the platform infrastructure.",
];

const PERMITTED = [
  "Transactional emails triggered by user actions (registration, password reset, order confirmation).",
  "System alerts and notifications to your own users.",
  "Internal team notifications and automated reports.",
  "Email verification flows for your own application.",
  "Testing and development using your own email addresses.",
];

export default function AcceptableUsePolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      <header className="border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandLogo href="/" />
          <Link href="/" className="text-xs text-slate-400 hover:text-white transition">← Back to home</Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-14">
        <div className="mb-10">
          <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-2">Legal</p>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Acceptable Use Policy</h1>
          <p className="text-sm text-slate-400">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8 text-slate-300 leading-relaxed text-sm">

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">Overview</h2>
            <p>This Acceptable Use Policy ("AUP") governs how you may use SafeMailNode. It exists to protect the integrity of the platform, the reputation of Gmail SMTP infrastructure, and the recipients of emails sent through the Service. Violations may result in immediate account suspension or termination.</p>
            <p>This AUP is incorporated by reference into our <Link href="/terms" className="text-emerald-400 hover:underline">Terms of Service</Link>.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Permitted uses
            </h2>
            <p>The Service is intended for legitimate transactional and notification email use cases, including:</p>
            <ul className="space-y-2">
              {PERMITTED.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Prohibited uses
            </h2>
            <p>You must not use the Service for any of the following:</p>
            <ul className="space-y-2">
              {PROHIBITED.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">Email content standards</h2>
            <p>All emails sent through the Service must:</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Clearly identify the sender.</li>
              <li>Not mislead recipients about the origin or purpose of the email.</li>
              <li>Comply with applicable anti-spam laws (CAN-SPAM, CASL, GDPR, etc.).</li>
              <li>Include a way for recipients to opt out of future emails where required by law.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">Your Gmail account responsibility</h2>
            <p>You are solely responsible for the Gmail account and App Password you configure in the Service. You must ensure your Gmail account is in good standing and complies with <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Google's Terms of Service</a>. Abuse of Gmail SMTP through this platform may result in your Google account being suspended by Google independently of any action we take.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">Enforcement</h2>
            <p>We reserve the right to:</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Suspend or terminate accounts that violate this AUP without prior notice.</li>
              <li>Remove or disable access to any content or project that violates this AUP.</li>
              <li>Report illegal activity to appropriate law enforcement authorities.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">Reporting abuse</h2>
            <p>If you believe the Service is being used in violation of this AUP, please contact the platform administrator through the dashboard.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-wrap gap-4 text-xs text-slate-500">
          <Link href="/privacy" className="hover:text-emerald-400 transition">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-emerald-400 transition">Terms of Service</Link>
          <Link href="/cookie-policy" className="hover:text-emerald-400 transition">Cookie Policy</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
