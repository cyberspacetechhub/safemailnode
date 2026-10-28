import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SafeMailNode — Gmail & Nodemailer API Gateway",
  description:
    "Connect your Gmail App Password once and send transactional emails from any backend or serverless app over HTTPS with SafeMailNode.",
  icons: {
    icon: "/img/logo/smn.svg",
    shortcut: "/img/logo/smn.svg",
    apple: "/img/logo/smn.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
