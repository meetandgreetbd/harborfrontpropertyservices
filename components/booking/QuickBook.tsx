"use client";

import { useActionState, useEffect, useMemo, useState, useTransition, startTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { AlertCircle, CalendarCheck, ChevronLeft, Clock, Loader2, ShieldCheck, Sun, Sunset } from "lucide-react";
import { createBooking, getAvailabilityAction, type BookingState } from "@/app/actions/booking";
import type { BookableService, DayAvailability } from "@/lib/booking";
import { formatPrice } from "@/lib/catalog";

const field =
  "block w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[0.94rem] text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15";

/**
 * Compact booking widget for a service page: option → date → free time (live from the database) → details → book.
 * Same rules and double-booking protection as /book (server re-checks the slot).
 */
export function QuickBook({ service, timeZone }: { service: BookableService; timeZone: string }) {
  const router = useRouter();
  const [optionId, setOptionId] = useState(service.options[0]?.id ?? "");
  const [days, setDays] = useState<DayAvailability[] | null>(null);
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [loading, startLoading] = useTransition();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const [state, action, pending] = useActionState<BookingState, FormData>(createBooking, { status: "idle" });

  const option = service.options.find((o) => o.id === optionId);
  const fmt = useMemo(
    () => ({
      time: new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone }),
      hour: new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone }),
      dow: new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }),
      dom: new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "UTC" }),
      full: new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone }),
    }),
    [timeZone],
  );

  // Load free slots for the chosen option (and again after a "time just taken" error).
  const reload = (forOption = optionId) =>
    startLoading(async () => {
      const res = await getAvailabilityAction(service.id, forOption || null);
      const list = "error" in res ? [] : res;
      setDays(list);
      setDate((cur) => (cur && list.some((d) => d.date === cur && d.slots.length) ? cur : list.find((d) => d.slots.length)?.date ?? ""));
    });
  const pickOption = (id: string) => {
    if (id === optionId) return;
    setOptionId(id);
    setStart("");
    reload(id);
  };
  // First load of free times when the widget mounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => reload(), []);

  useEffect(() => {
    if (state.status === "booked" && state.ref) router.push(`/booking-confirmation?ref=${encodeURIComponent(state.ref)}`);
  }, [state, router]);

  const day = days?.find((d) => d.date === date);
  const groups = [
    { label: "Morning", icon: Sun, slots: day?.slots.filter((s) => Number(fmt.hour.format(new Date(s))) < 12) ?? [] },
    { label: "Afternoon", icon: Sunset, slots: day?.slots.filter((s) => Number(fmt.hour.format(new Date(s))) >= 12) ?? [] },
  ].filter((g) => g.slots.length);

  const ready = start && form.name.trim().length > 1 && form.phone.trim().length > 6 && /\S+@\S+\.\S+/.test(form.email) && form.address.trim().length > 4;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.set("serviceId", service.id);
    fd.set("optionId", optionId);
    fd.set("start", start);
    for (const [k, v] of Object.entries(form)) fd.set(k, v);
    startTransition(() => action(fd));
  };

  const taken = state.status === "error" && /no longer available|just booked/.test(state.message ?? "");

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Option */}
      {service.options.length > 0 && (
        <div>
          <p className="text-[0.82rem] font-semibold uppercase tracking-wide text-muted">1 · Choose an option</p>
          <div className="mt-2 grid gap-2">
            {service.options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => pickOption(o.id)}
                aria-pressed={optionId === o.id}
                className={clsx(
                  "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-[0.9rem] transition-all",
                  optionId === o.id ? "border-brand bg-brand-50 ring-2 ring-brand/20" : "border-line bg-white hover:border-brand/60",
                )}
              >
                <span className="font-semibold text-night">{o.name}</span>
                <span className="flex items-center gap-3 text-[0.82rem]">
                  {o.durationMin && (
                    <span className="inline-flex items-center gap-1 text-muted">
                      <Clock size={13} /> {o.durationMin}m
                    </span>
                  )}
                  <span className="font-bold text-brand">
                    {o.price != null ? formatPrice("FIXED" as never, o.price) : formatPrice(service.priceType as never, service.basePrice)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date */}
      <div>
        <p className="text-[0.82rem] font-semibold uppercase tracking-wide text-muted">{service.options.length ? "2" : "1"} · Pick a day</p>
        {loading && !days ? (
          <p className="mt-3 flex items-center gap-2 text-[0.9rem] text-muted">
            <Loader2 size={16} className="animate-spin" /> Checking availability…
          </p>
        ) : days && days.some((d) => d.slots.length) ? (
          <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1.5" role="listbox" aria-label="Choose a day">
            {days.map((d) => {
              const has = d.slots.length > 0;
              const sel = d.date === date;
              const dt = new Date(`${d.date}T12:00:00Z`);
              return (
                <button
                  key={d.date}
                  type="button"
                  role="option"
                  aria-selected={sel}
                  disabled={!has}
                  onClick={() => {
                    setDate(d.date);
                    setStart("");
                  }}
                  className={clsx(
                    "flex w-[3.4rem] shrink-0 flex-col items-center rounded-xl border py-2 transition-all",
                    sel && "border-transparent bg-brand-gradient text-white shadow-md shadow-brand/30",
                    !sel && has && "border-line bg-white text-night hover:border-brand hover:text-brand",
                    !has && "cursor-not-allowed border-dashed border-line bg-canvas-2 text-muted/40",
                  )}
                >
                  <span className="text-[0.66rem] font-semibold uppercase opacity-80">{fmt.dow.format(dt)}</span>
                  <span className="font-display text-[1.15rem] font-extrabold leading-tight">{fmt.dom.format(dt)}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 rounded-xl bg-canvas-2 p-3 text-[0.88rem] text-muted">No online times in the next 3 weeks — use “Get a quote” or call us.</p>
        )}
      </div>

      {/* Time */}
      {groups.length > 0 && (
        <div>
          <p className="text-[0.82rem] font-semibold uppercase tracking-wide text-muted">{service.options.length ? "3" : "2"} · Pick a time</p>
          <div className="mt-2 space-y-3">
            {groups.map((g) => (
              <div key={g.label}>
                <p className="flex items-center gap-1 text-[0.74rem] font-medium text-muted">
                  <g.icon size={13} /> {g.label}
                </p>
                <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                  {g.slots.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={start === s}
                      onClick={() => setStart(s)}
                      className={clsx(
                        "tabular rounded-lg border px-2 py-2 text-[0.85rem] font-semibold transition-all",
                        start === s ? "border-transparent bg-brand-gradient text-white shadow-md shadow-brand/30" : "border-line bg-white text-night hover:border-brand hover:text-brand",
                      )}
                    >
                      {fmt.time.format(new Date(s))}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details (appear once a time is picked) */}
      {start && (
        <div className="animate-fade-up space-y-2.5 rounded-2xl border border-brand-100 bg-brand-50/50 p-3.5">
          <p className="flex items-center gap-1.5 text-[0.86rem] font-semibold text-night">
            <CalendarCheck size={15} className="text-brand" /> {fmt.full.format(new Date(start))}
            {option && <span className="font-normal text-muted">· {option.name}</span>}
          </p>
          <input className={field} placeholder="Full name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Full name" />
          <div className="grid grid-cols-2 gap-2">
            <input className={field} placeholder="Phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-label="Phone" />
            <input className={field} placeholder="Email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-label="Email" />
          </div>
          <input className={field} placeholder="Property address" autoComplete="street-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} aria-label="Property address" />
          <textarea className={field} rows={2} placeholder="Anything we should know? (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} aria-label="Notes" />
        </div>
      )}

      {state.status === "error" && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[0.86rem] text-red-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>
            {state.message}
            {taken && (
              <button type="button" onClick={() => { setStart(""); reload(); }} className="ml-1 font-semibold underline">
                Refresh times
              </button>
            )}
          </span>
        </p>
      )}

      <button
        type="submit"
        disabled={!ready || pending}
        className="bg-brand-gradient group/btn inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3.5 font-semibold text-white shadow-[0_10px_30px_-10px_rgb(37_99_235/0.7)] transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {pending ? <Loader2 size={18} className="animate-spin" /> : <CalendarCheck size={18} />}
        {pending ? "Booking…" : !start ? "Pick a time to continue" : service.bookingMode === "INSTANT" ? "Confirm booking" : "Request this time"}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-[0.8rem] text-muted">
        <ShieldCheck size={14} className="text-brand" />
        {service.bookingMode === "INSTANT" ? "Confirmed instantly · no payment now" : "We confirm within one business day · no payment now"}
      </p>
      <p className="text-center text-[0.78rem]">
        <button type="button" onClick={() => router.push(`/book?service=${service.slug}`)} className="inline-flex items-center gap-1 text-muted underline hover:text-brand">
          <ChevronLeft size={13} className="rotate-180" /> Open full booking page
        </button>
      </p>
    </form>
  );
}
