import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import Footer from "@/components/Footer";

const LAST_UPDATED = "January 2025";

export default function TermsOfServicePage() {
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
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Terms of Service</h1>
          <p className="text-sm text-slate-400">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8 text-slate-300 leading-relaxed text-sm">

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Acceptance of terms</h2>
            <p>By registering for or using SafeMailNode ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Description of service</h2>
            <p>SafeMailNode is a transactional email relay that allows registered users to send emails via their own Gmail SMTP credentials through a REST API. The Service is provided as-is for developer and business use.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Account registration</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>You must provide a valid email address and verify it before using the Service.</li>
              <li>You are responsible for maintaining the confidentiality of your API keys and account credentials.</li>
              <li>You must notify us immediately of any unauthorised use of your account.</li>
              <li>One account per person or organisation. Duplicate accounts may be removed.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Acceptable use</h2>
            <p>You agree to use the Service only for lawful purposes and in accordance with our <Link href="/acceptable-use" className="text-emerald-400 hover:underline">Acceptable Use Policy</Link>. You must not use the Service to send spam, phishing emails, or any unsolicited bulk email.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Quotas and limits</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Free accounts are subject to default quotas: 2 projects and 100 emails per 24-hour period.</li>
              <li>Quotas may be adjusted by administrators at their discretion.</li>
              <li>Exceeding quotas will result in requests being rejected with a <code className="text-emerald-300">429</code> response until the window resets.</li>
              <li>We reserve the right to modify default quotas at any time.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">6. API keys</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>API keys are shown once at creation. You are responsible for storing them securely.</li>
              <li>Lost keys can be regenerated from the dashboard; the old key is immediately invalidated.</li>
              <li>Do not commit API keys to public source code repositories.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">7. Account suspension and termination</h2>
            <p>We reserve the right to suspend or terminate accounts that:</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Violate these Terms or the Acceptable Use Policy.</li>
              <li>Are used for spam, abuse, or illegal activity.</li>
              <li>Trigger automated security locks (e.g., 5 consecutive failed login attempts).</li>
            </ul>
            <p>You may delete your account at any time from the dashboard. Deletion is permanent and removes all projects and email logs.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">8. Disclaimer of warranties</h2>
            <p>The Service is provided <strong className="text-white">"as is"</strong> without warranties of any kind, express or implied. We do not guarantee uninterrupted availability, delivery of every email, or compatibility with all Gmail account configurations. Email delivery is subject to Gmail's own sending limits and policies.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">9. Limitation of liability</h2>
            <p>To the maximum extent permitted by applicable law, SafeMailNode and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service, including but not limited to lost revenue, lost data, or business interruption.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">10. Changes to these terms</h2>
            <p>We may update these Terms at any time. The "Last updated" date will reflect changes. Continued use of the Service after changes constitutes acceptance of the revised Terms.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">11. Governing law</h2>
            <p>These Terms are governed by applicable law. Any disputes shall be resolved in the jurisdiction where the platform operator is based.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-wrap gap-4 text-xs text-slate-500">
          <Link href="/privacy" className="hover:text-emerald-400 transition">Privacy Policy</Link>
          <Link href="/acceptable-use" className="hover:text-emerald-400 transition">Acceptable Use Policy</Link>
          <Link href="/cookie-policy" className="hover:text-emerald-400 transition">Cookie Policy</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
