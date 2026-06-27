import Link from "next/link";
import Image from "next/image";

/**
 * OrchestrAI brand mark + wordmark.
 *
 * Uses the official orbit logo PNGs (public/assets). Theme-aware:
 *   light theme → violet-logo.png
 *   dark theme  → white-logo.png
 * Both are stacked; CSS shows the right one per `.dark` on <html>.
 *
 * Usage:
 *   <Logo />                     full logo, links home
 *   <Logo showWordmark={false}/> mark only
 *   <Logo href={null} />         non-interactive (e.g. inside another link)
 */

export function LogoMark({
  size = 28,
  className = "",
  variant = "auto",
}: {
  size?: number;
  className?: string;
  /** "auto" swaps by theme; "white"/"violet" force a fixed mark (e.g. on a
   *  colored panel where theme detection doesn't apply). */
  variant?: "auto" | "white" | "violet";
}) {
  if (variant !== "auto") {
    return (
      <Image
        src={variant === "white" ? "/assets/white-logo.png" : "/assets/violet-logo.png"}
        alt="OrchestrAI"
        width={size}
        height={size}
        className={`shrink-0 ${className}`}
        priority
      />
    );
  }
  return (
    <span
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label="OrchestrAI"
      role="img"
    >
      <Image
        src="/assets/violet-logo.png"
        alt=""
        width={size}
        height={size}
        className="absolute inset-0 block dark:hidden"
        priority
      />
      <Image
        src="/assets/white-logo.png"
        alt=""
        width={size}
        height={size}
        className="absolute inset-0 hidden dark:block"
        priority
      />
    </span>
  );
}

/**
 * Full wordmark logo (mark + "Orchestra" text) for the landing site.
 * Theme-aware: violet wordmark on light, white wordmark on dark.
 * Aspect ratio of the source PNGs ≈ 4.36:1.
 */
export function WordmarkLogo({
  height = 30,
  className = "",
}: {
  height?: number;
  className?: string;
}) {
  const width = Math.round(height * 4.36);
  return (
    <span
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width, height }}
      aria-label="OrchestrAI"
      role="img"
    >
      <Image
        src="/assets/logo-violet.png"
        alt=""
        width={width}
        height={height}
        className="absolute inset-0 block h-full w-full object-contain dark:hidden"
        priority
      />
      <Image
        src="/assets/logo-orchestra-white.png"
        alt=""
        width={width}
        height={height}
        className="absolute inset-0 hidden h-full w-full object-contain dark:block"
        priority
      />
    </span>
  );
}

export default function Logo({
  href = "/" as string | null,
  showWordmark = true,
  size = 28,
  subtitle,
  className = "",
}: {
  href?: string | null;
  showWordmark?: boolean;
  size?: number;
  subtitle?: string;
  className?: string;
}) {
  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="text-[var(--text-1)]">
        <LogoMark size={size} />
      </span>
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-display font-semibold tracking-tight text-[var(--text-1)] text-[15px]">
            Orchestr<span className="text-[var(--accent-token)]">a</span>
          </span>
          {subtitle && (
            <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--text-3)]">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} className="inline-flex items-center">
      {inner}
    </Link>
  );
}
