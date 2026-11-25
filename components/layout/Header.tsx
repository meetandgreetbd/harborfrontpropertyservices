import { Suspense } from "react";
import { Phone, CalendarCheck } from "lucide-react";
import { site } from "@/lib/site";
import { HeaderNav, NavList } from "./HeaderNav";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { ButtonLink } from "@/components/ui/Button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
      <div className="container-x flex h-[4.5rem] items-center justify-between gap-6">
        <Logo />

        <nav aria-label="Main" className="hidden lg:block">
          {/* Reads the URL for highlighting, so it streams inside Suspense; the fallback is the same menu un-highlighted */}
          <Suspense fallback={<NavList pathname={null} />}>
            <HeaderNav />
          </Suspense>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a href={site.phoneHref} className="tabular inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.92rem] font-semibold text-night hover:text-brand">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand">
              <Phone size={15} strokeWidth={2} aria-hidden="true" />
            </span>
            {site.phone}
          </a>
          <ButtonLink href="/book" className="px-5 py-2.5">
            <CalendarCheck size={17} aria-hidden="true" /> Book online
          </ButtonLink>
        </div>

        <MobileMenu />
      </div>
    </header>
  );
}
