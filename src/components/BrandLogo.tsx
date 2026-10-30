import Link from "next/link";

interface BrandLogoProps {
  href?: string;
  badge?: string;
  badgeVariant?: "emerald" | "amber";
  size?: "sm" | "md" | "lg";
}

export default function BrandLogo({
  href = "/",
  badge,
  badgeVariant = "emerald",
  size = "md",
}: BrandLogoProps) {
  const imgSize =
    size === "sm" ? "w-7 h-7" : size === "lg" ? "w-10 h-10" : "w-9 h-9";
  const textSize =
    size === "sm" ? "text-base" : size === "lg" ? "text-xl" : "text-lg";

  const content = (
    <div className="inline-flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/img/logo/smn.webp"
        alt="SafeMailNode Logo"
        className={`${imgSize} rounded-lg object-contain shrink-0`}
      />
      <span className={`font-bold ${textSize} tracking-tight text-white`}>
        Safe<span className="text-emerald-400">Mail</span>Node
      </span>
      {badge && (
        <span
          className={`hidden sm:inline text-[11px] px-2 py-0.5 rounded-full font-semibold ${
            badgeVariant === "amber"
              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          }`}
        >
          {badge}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
