"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { mainNav } from "@/lib/site";

/** "/industries/property-managers" belongs to the "/industries" section, etc. */
function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  const base = href.split("/").slice(0, 2).join("/");
  return pathname === href || pathname === base || pathname.startsWith(base + "/");
}

/** Main menu: bold, high-contrast links; the current section gets a blue pill + dot. */
export function NavList({ pathname }: { pathname: string | null }) {
  return (
    <ul className="flex items-center gap-1 text-[0.95rem] font-semibold">
      {mainNav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "relative rounded-full px-4 py-2 transition-all duration-200",
                active ? "bg-brand-50 text-brand" : "text-night hover:bg-brand-50 hover:text-brand",
              )}
            >
              {item.label}
              <span
                aria-hidden="true"
                className={clsx(
                  "absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand transition-opacity",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Reads the URL to highlight the current section (render inside <Suspense>). */
export function HeaderNav() {
  return <NavList pathname={usePathname()} />;
}
