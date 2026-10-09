import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  basePath,
  query = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  query?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams({ ...query });
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <nav
      className="mt-14 flex items-center justify-between gap-4 border-t border-dashed border-border-strong pt-8 text-sm"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link href={href(page - 1)}>← prev</Link>
      ) : (
        <span className="text-muted-2">← prev</span>
      )}

      <span className="tnum text-xs text-muted-2">
        page {page} / {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={href(page + 1)}>next →</Link>
      ) : (
        <span className="text-muted-2">next →</span>
      )}
    </nav>
  );
}
