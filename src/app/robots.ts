import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://yourdomain.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/docs", "/register", "/login", "/support", "/privacy", "/terms", "/acceptable-use", "/cookie-policy"],
        disallow: ["/dashboard", "/admin", "/api/", "/verify-email", "/forgot-password", "/reset-password"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
