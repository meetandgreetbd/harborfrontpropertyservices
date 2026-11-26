"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { mainNav } from "@/lib/site";

export function MobileMenu({ phone, phoneHref }: { phone: string; phoneHref: string }) {
  const pathname = usePathname();
  // Remember which page the menu was opened on; navigating anywhere else closes it
  // (routes stay mounted with Cache Components, so a plain boolean would persist).
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: (v: boolean) => boolean) => setOpenOn(next(open) ? pathname : null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        className="-mr-2 inline-flex h-11 w-11 items-center justify-center text-night"
      >
        {open ? <X size={24} strokeWidth={1.75} /> : <Menu size={24} strokeWidth={1.75} />}
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </button>

      {/* Portal to <body>: the header's backdrop-blur makes it the containing block for
          position:fixed children, which collapsed this panel to zero height. */}
      {open &&
        createPortal(
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="animate-fade-up fixed inset-x-0 top-[4.5rem] bottom-0 z-50 overflow-y-auto border-t border-line bg-white px-5 pb-10 pt-6 shadow-xl lg:hidden"
        >
          <ul className="divide-y divide-line">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block py-4 font-display text-2xl text-night">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/work-order" className="block py-4 font-display text-2xl text-night">
                Submit a work order
              </Link>
            </li>
          </ul>
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/book" className="bg-brand-gradient rounded-full px-5 py-4 text-center font-semibold text-white">
              Book online
            </Link>
            <Link href="/request-estimate" className="rounded-full bg-night px-5 py-4 text-center font-semibold text-white">
              Request a quote
            </Link>
            <a href={phoneHref} className="rounded-full border border-line px-5 py-4 text-center font-semibold text-night">
              Call {phone}
            </a>
          </div>
        </nav>,
          document.body,
        )}
    </div>
  );
}
