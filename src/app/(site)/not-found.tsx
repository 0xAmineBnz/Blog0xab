import Link from "next/link";
import { Container } from "@/components/site/section";

export default function NotFound() {
  return (
    <Container className="py-20">
      <p className="text-sm text-muted-2">
        <span className="text-accent">$</span> cat ./requested-resource
      </p>
      <h1 className="mt-4 text-3xl font-bold text-heading sm:text-4xl">
        404 — not found
      </h1>
      <p className="mt-4 max-w-[68ch] text-muted">
        error: ENOENT — the page you&apos;re looking for was moved, deleted, or
        never existed.
      </p>
      <p className="mt-8 flex flex-wrap gap-x-5 text-sm">
        <Link href="/">cd ~/</Link>
        <Link href="/about">./about</Link>
      </p>
    </Container>
  );
}
