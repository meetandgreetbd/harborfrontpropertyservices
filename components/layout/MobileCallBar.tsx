import Link from "next/link";
import { Phone, CalendarCheck } from "lucide-react";
import { site } from "@/lib/site";

/** Sticky call / book bar on small screens — the two actions people actually take on mobile. */
export function MobileCallBar() {
  return (
    <div className="sticky bottom-0 z-30 grid grid-cols-2 gap-2 border-t border-line bg-white/95 p-2 text-[0.95rem] font-semibold backdrop-blur lg:hidden">
      <a href={site.phoneHref} className="flex items-center justify-center gap-2 rounded-full border border-line py-3 text-night">
        <Phone size={16} /> Call
      </a>
      <Link href="/book" className="bg-brand-gradient flex items-center justify-center gap-2 rounded-full py-3 text-white">
        <CalendarCheck size={16} /> Book online
      </Link>
    </div>
  );
}
