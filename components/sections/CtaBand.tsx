import { CalendarCheck, Phone, FileText } from "lucide-react";
import { PhoneLink, PhoneText } from "@/components/ui/ContactInfo";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

/** Closing call-to-action: blue gradient panel with grid texture. */
export function CtaBand({
  title = "Tell us what needs doing.",
  body = "Book a time online, or send the address and a short list — we'll reply with a price, usually the same business day.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <section className="py-16 md:py-24">
      <div className="container-x">
        <Reveal>
          <div className="bg-brand-gradient relative isolate overflow-hidden rounded-[28px] px-6 py-14 text-white shadow-[0_30px_60px_-30px_rgb(37_99_235/0.6)] sm:px-12 md:py-16">
            <div aria-hidden="true" className="bg-grid absolute inset-0 -z-10 opacity-60" />
            <div aria-hidden="true" className="animate-glow absolute -right-20 -top-24 -z-10 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
            <div className="grid gap-10 md:grid-cols-12 md:items-center">
              <div className="md:col-span-7">
                <h2 className="text-[clamp(1.9rem,1.3rem+2vw,2.9rem)] font-extrabold leading-tight text-white">{title}</h2>
                <p className="mt-4 max-w-[52ch] text-[1.05rem] leading-relaxed text-white/85">{body}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap md:col-span-5 md:justify-end">
                <ButtonLink href="/book" variant="light" className="shadow-lg">
                  <CalendarCheck size={18} /> Book online
                </ButtonLink>
                <ButtonLink href="/request-estimate" variant="outline-light">
                  <FileText size={18} /> Get a quote
                </ButtonLink>
                <PhoneLink className="tabular inline-flex items-center justify-center gap-2 px-2 py-3 font-semibold text-white/90 hover:text-white">
                  <Phone size={17} /> <PhoneText />
                </PhoneLink>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
