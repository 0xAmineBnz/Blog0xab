import Link from "next/link";
import { cn } from "@/lib/utils";

/** A green terminal-style section heading with an optional trailing link. */
export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel = "view all →",
  prompt = "$",
  as: As = "h2",
  className,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  prompt?: string;
  as?: "h2" | "h3";
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", className)}>
      <div>
        <As className="text-lg font-bold text-heading sm:text-xl">
          {prompt && <span className="text-muted-2">{prompt} </span>}
          {title}
        </As>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="shrink-0 text-sm">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

/** Centered reading column — max 800px, well within the 900px design cap. */
export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[800px] px-5 sm:px-7", className)}>
      {children}
    </div>
  );
}
