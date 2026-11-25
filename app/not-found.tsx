import Link from "next/link";
import { getServices } from "@/lib/data/catalog";
import { ButtonLink } from "@/components/ui/Button";
import { SiteChrome } from "@/components/layout/SiteChrome";

export default async function NotFound() {
  const services = await getServices();
  return (
    <SiteChrome>
    <section className="container-x py-24 md:py-32">
      <p className="eyebrow">404</p>
      <h1 className="h-hero mt-5 max-w-3xl text-night">This page has moved out.</h1>
      <p className="prose-body mt-6">The link may be old, or the address mistyped. Try one of these instead:</p>
      <ul className="mt-8 flex max-w-3xl flex-wrap gap-3">
        {services.slice(0, 6).map((s) => (
          <li key={s.slug}>
            <Link href={`/services/${s.slug}`} className="inline-block border border-night/30 px-4 py-2 text-night hover:border-night">
              {s.name}
            </Link>
          </li>
        ))}
      </ul>
      <ButtonLink href="/" className="mt-10">
        Back to the homepage
      </ButtonLink>
    </section>
    </SiteChrome>
  );
}
