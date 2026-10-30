import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import Footer from "@/components/Footer";

const LAST_UPDATED = "January 2025";

export default function PrivacyPolicyPage() {
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
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-sm text-slate-400">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-slate-300 leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Who we are</h2>
            <p>SafeMailNode ("we", "us", "our") is a self-hosted transactional email gateway. This policy explains what personal data we collect when you use the platform, how we use it, and your rights over it.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Data we collect</h2>
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Why we collect it</th>
                    <th className="py-3 px-4">Retention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {[
                    ["Name & email address", "Account creation, email verification, password reset", "Until account deletion"],
                    ["Hashed password", "Authentication", "Until account deletion"],
                    ["Gmail address (project)", "SMTP sender identity", "Until project deletion"],
                    ["Gmail App Password (encrypted)", "Sending emails on your behalf via Gmail SMTP", "Until project deletion"],
                    ["Email delivery logs", "Delivery tracking, quota enforcement, debugging", "90 days rolling"],
                    ["IP address (rate limiting)", "Abuse prevention", "Not persisted — in-memory only"],
                    ["Session JWT (cookie)", "Keeping you logged in", "7 days or until logout"],
                  ].map(([data, why, ret]) => (
                    <tr key={data}>
                      <td className="py-3 px-4 font-medium text-slate-200">{data}</td>
                      <td className="py-3 px-4 text-slate-400">{why}</td>
                      <td className="py-3 px-4 text-slate-400">{ret}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. How we use your data</h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300">
              <li>To provide the email relay service (sending emails via your Gmail SMTP credentials).</li>
              <li>To send you account-related emails (verification codes, password reset links).</li>
              <li>To enforce per-account quotas and rate limits.</li>
              <li>To allow administrators to manage accounts and investigate abuse.</li>
            </ul>
            <p>We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Third-party processors</h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300">
              <li><strong className="text-white">MongoDB Atlas</strong> — database hosting. Your account data and email logs are stored here.</li>
              <li><strong className="text-white">Google Gmail SMTP</strong> — your App Password is used to authenticate outbound email sends. Google's own privacy policy applies to SMTP usage.</li>
              <li><strong className="text-white">Upstash Redis</strong> (optional) — used for distributed rate limiting. Only IP-derived keys and counters are stored; no personal data.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Security</h2>
            <p>Gmail App Passwords are encrypted at rest using AES-256-GCM before being stored in the database. API keys are bcrypt-hashed and the raw key is never stored. Passwords are bcrypt-hashed with a cost factor of 10. All data in transit is protected by TLS.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">6. Your rights</h2>
            <p>Depending on your jurisdiction (GDPR, CCPA, etc.) you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your account and all associated data.</li>
              <li>Object to or restrict certain processing.</li>
            </ul>
            <p>To exercise any of these rights, contact the platform administrator or delete your account from the dashboard. Account deletion permanently removes your profile, all projects, and all email logs.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">7. Cookies</h2>
            <p>We use a single <code className="text-emerald-300">httpOnly</code> session cookie to keep you authenticated. See our <Link href="/cookie-policy" className="text-emerald-400 hover:underline">Cookie Policy</Link> for details.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">8. Changes to this policy</h2>
            <p>We may update this policy from time to time. The "Last updated" date at the top of this page will reflect any changes. Continued use of the platform after changes constitutes acceptance.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-wrap gap-4 text-xs text-slate-500">
          <Link href="/terms" className="hover:text-emerald-400 transition">Terms of Service</Link>
          <Link href="/acceptable-use" className="hover:text-emerald-400 transition">Acceptable Use Policy</Link>
          <Link href="/cookie-policy" className="hover:text-emerald-400 transition">Cookie Policy</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
