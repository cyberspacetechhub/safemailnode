import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import Footer from "@/components/Footer";

const LAST_UPDATED = "January 2025";

export default function CookiePolicyPage() {
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
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Cookie Policy</h1>
          <p className="text-sm text-slate-400">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8 text-slate-300 leading-relaxed text-sm">

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. What are cookies?</h2>
            <p>Cookies are small text files stored on your device by your browser when you visit a website. They are widely used to make websites work, remember your preferences, and provide information to site owners.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Cookies we use</h2>
            <p>SafeMailNode uses a minimal number of cookies — only those strictly necessary to operate the Service.</p>
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-4">Cookie name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Purpose</th>
                    <th className="py-3 px-4">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  <tr>
                    <td className="py-3 px-4 font-mono text-emerald-300">smn_auth</td>
                    <td className="py-3 px-4 text-slate-300">Strictly necessary</td>
                    <td className="py-3 px-4 text-slate-400">Stores your encrypted session JWT to keep you logged in as a user.</td>
                    <td className="py-3 px-4 text-slate-400">7 days (or until logout)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono text-emerald-300">smn_admin</td>
                    <td className="py-3 px-4 text-slate-300">Strictly necessary</td>
                    <td className="py-3 px-4 text-slate-400">Stores your encrypted session JWT to keep you logged in as an administrator.</td>
                    <td className="py-3 px-4 text-slate-400">7 days (or until logout)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>Both cookies are set with <code className="text-emerald-300">httpOnly: true</code>, <code className="text-emerald-300">sameSite: lax</code>, and <code className="text-emerald-300">secure: true</code> in production. They cannot be accessed by JavaScript and are only sent over HTTPS.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. No tracking or analytics cookies</h2>
            <p>We do not use any third-party analytics, advertising, or tracking cookies. We do not use Google Analytics, Facebook Pixel, or any similar tracking technology.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Strictly necessary cookies and consent</h2>
            <p>The cookies we set are strictly necessary for the Service to function — without them you cannot log in or use the dashboard. Under GDPR and similar regulations, strictly necessary cookies do not require prior consent. However, we disclose them here in the interest of transparency.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. How to control cookies</h2>
            <p>You can control and delete cookies through your browser settings. Deleting or blocking the session cookies will log you out of the Service.</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Apple Safari</a></li>
              <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Microsoft Edge</a></li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">6. Changes to this policy</h2>
            <p>We may update this Cookie Policy from time to time. The "Last updated" date at the top of this page will reflect any changes.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-wrap gap-4 text-xs text-slate-500">
          <Link href="/privacy" className="hover:text-emerald-400 transition">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-emerald-400 transition">Terms of Service</Link>
          <Link href="/acceptable-use" className="hover:text-emerald-400 transition">Acceptable Use Policy</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
