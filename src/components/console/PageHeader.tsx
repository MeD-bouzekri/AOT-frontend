/**
 * PageHeader — consistent page title + subtitle + optional actions.
 * Shared across all console pages so headings stay uniform.
 */
export default function PageHeader({
  title,
  subtitle,
  icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg accent-gradient text-white shadow-sm">
            {icon}
          </span>
        )}
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-[var(--text-1)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 max-w-prose text-sm text-[var(--text-3)]">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
