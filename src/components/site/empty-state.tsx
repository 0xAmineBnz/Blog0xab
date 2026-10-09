/**
 * Shown when a list has no entries — doubles as the "DB not configured yet"
 * state so the site is presentable on first deploy.
 */
export function EmptyState({
  title = "no entries found",
  hint = "Once articles are published they'll appear here.",
  command = "ls ./posts",
}: {
  title?: string;
  hint?: string;
  command?: string;
}) {
  return (
    <div className="py-10 text-sm leading-relaxed">
      <p className="text-muted-2">
        <span className="text-accent">$</span> {command}
      </p>
      <p className="mt-3 text-danger">
        {title} <span className="text-muted-2">(exit 0)</span>
      </p>
      <p className="mt-1 text-muted">{hint}</p>
    </div>
  );
}
