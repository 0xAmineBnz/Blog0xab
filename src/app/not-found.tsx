import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="text-sm text-muted-2">
        <span className="text-accent">$</span> 404 — not found
      </p>
      <h1 className="text-3xl font-bold text-heading">signal lost</h1>
      <p className="max-w-md text-muted">
        This route doesn&apos;t resolve to anything. Head back to known
        territory.
      </p>
      <Link href="/">cd ~/</Link>
    </div>
  );
}
