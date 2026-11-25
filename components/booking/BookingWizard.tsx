"use client";

import { useActionState, useEffect, useMemo, useState, startTransition, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, CalendarCheck, Check, Clock, Loader2, MapPin, Sun, Sunset, AlertCircle } from "lucide-react";
import { createBooking, getAvailabilityAction, type BookingState } from "@/app/actions/booking";
import type { BookableService, DayAvailability } from "@/lib/booking";
import { formatPrice } from "@/lib/catalog";
import { ServiceIcon } from "@/lib/service-icons";

const steps = ["Service", "Option", "Date & time", "Your details", "Confirm"] as const;

const input =
  "mt-1.5 block w-full rounded-xl border border-line bg-white px-4 py-3 text-[0.97rem] text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15";

export function BookingWizard({ services, initialSlug, timeZone }: { services: BookableService[]; initialSlug?: string; timeZone: string }) {
  const router = useRouter();
  const preselected = services.find((s) => s.slug === initialSlug);
  const [serviceId, setServiceId] = useState(preselected?.id ?? "");
  const [optionId, setOptionId] = useState("");
  const [step, setStep] = useState(preselected ? (preselected.options.length ? 1 : 2) : 0);
  const [days, setDays] = useState<DayAvailability[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, startLoading] = useTransition();
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [details, setDetails] = useState({ name: "", phone: "", email: "", address: "", propertyType: "", access: "", notes: "" });
  const [state, action, pending] = useActionState<BookingState, FormData>(createBooking, { status: "idle" });

  const service = services.find((s) => s.id === serviceId);
  const option = service?.options.find((o) => o.id === optionId);
  const duration = option?.durationMin ?? service?.durationMin ?? 60;

  const fmt = useMemo(
    () => ({
      time: new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone }),
      dayName: new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }),
      dayNum: new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "UTC" }),
      month: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }),
      full: new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone }),
      hour: new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone }),
    }),
    [timeZone],
  );
  const ymdUtc = (s: string) => new Date(`${s}T12:00:00Z`);

  // Load availability whenever we reach the date step for a service/option.
  useEffect(() => {
    if (step !== 2 || !serviceId) return;
    startLoading(async () => {
      const res = await getAvailabilityAction(serviceId, optionId || null);
      if ("error" in res) {
        setLoadError(res.error);
        setDays([]);
        return;
      }
      setLoadError("");
      setDays(res);
      const first = res.find((d) => d.slots.length);
      setDate((cur) => (cur && res.some((d) => d.date === cur && d.slots.length) ? cur : first?.date ?? ""));
    });
  }, [step, serviceId, optionId]);

  // Booked → confirmation page
  useEffect(() => {
    if (state.status === "booked" && state.ref) router.push(`/booking-confirmation?ref=${encodeURIComponent(state.ref)}`);
  }, [state, router]);

  // "Time no longer available" → back to the time step with fresh slots
  const slotGone = state.status === "error" && /no longer available|just booked/.test(state.message ?? "");

  const day = days?.find((d) => d.date === date);
  const morning = day?.slots.filter((s) => Number(fmt.hour.format(new Date(s))) < 12) ?? [];
  const afternoon = day?.slots.filter((s) => Number(fmt.hour.format(new Date(s))) >= 12) ?? [];

  const go = (n: number) => {
    // skip the Option step for services without options
    if (n === 1 && service && service.options.length === 0) n = step < 1 ? 2 : 0;
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const detailsValid = details.name.trim().length > 1 && details.phone.trim().length > 6 && /\S+@\S+\.\S+/.test(details.email) && details.address.trim().length > 4;

  const submit = () => {
    const fd = new FormData();
    fd.set("serviceId", serviceId);
    fd.set("optionId", optionId);
    fd.set("start", start);
    for (const [k, v] of Object.entries(details)) fd.set(k, v);
    startTransition(() => action(fd));
  };

  const priceText = (p: number | null) => (service ? formatPrice(service.priceType as never, p ?? service.basePrice) : "");

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* ── Steps ── */}
      <div className="lg:col-span-8">
        <ol className="mb-8 flex items-center gap-2" aria-label="Booking progress">
          {steps.map((label, i) => {
            if (i === 1 && service && service.options.length === 0) return null;
            const done = i < step;
            const current = i === step;
            return (
              <li key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={clsx(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.8rem] font-bold transition-all",
                    done && "bg-brand text-white",
                    current && "bg-brand-gradient text-white ring-4 ring-brand/20",
                    !done && !current && "bg-canvas-2 text-muted ring-1 ring-line",
                  )}
                  aria-current={current ? "step" : undefined}
                >
                  {done ? <Check size={15} /> : i + 1}
                </span>
                <span className={clsx("hidden text-[0.82rem] font-semibold md:inline", current ? "text-night" : "text-muted")}>{label}</span>
                <span className="mx-1 hidden h-px flex-1 bg-line md:block" aria-hidden="true" />
              </li>
            );
          })}
        </ol>

        <div key={step} className="animate-fade-up">
          {/* 1. Service */}
          {step === 0 && (
            <section>
              <h2 className="font-display text-[1.6rem] font-extrabold text-night">What do you need?</h2>
              <p className="mt-1 text-muted">Choose a service to see available times.</p>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {services.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setServiceId(s.id);
                        setOptionId("");
                        setStart("");
                        setDays(null);
                        setStep(s.options.length ? 1 : 2);
                      }}
                      className={clsx(
                        "card card-hover group flex h-full w-full items-start gap-4 p-5 text-left",
                        serviceId === s.id && "border-brand ring-2 ring-brand/30",
                      )}
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand transition-colors group-hover:bg-brand-gradient group-hover:text-white">
                        <ServiceIcon name={s.icon} />
                      </span>
                      <span className="flex-1">
                        <span className="block font-display text-[1.05rem] font-bold text-night">{s.name}</span>
                        <span className="mt-1 block text-[0.88rem] leading-snug text-muted">{s.shortDescription}</span>
                        <span className="mt-3 flex flex-wrap gap-2 text-[0.75rem] font-semibold">
                          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand">{formatPrice(s.priceType as never, s.basePrice)}</span>
                          <span className="rounded-full bg-canvas-2 px-2.5 py-1 text-muted">
                            {s.bookingMode === "INSTANT" ? "Instant confirmation" : s.bookingMode === "APPOINTMENT" ? "Assessment visit" : "We confirm within a day"}
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {services.length === 0 && <p className="mt-6 rounded-xl bg-canvas-2 p-6 text-muted">Online booking isn&apos;t available right now — please call or request a quote.</p>}
            </section>
          )}

          {/* 2. Option */}
          {step === 1 && service && (
            <section>
              <h2 className="font-display text-[1.6rem] font-extrabold text-night">{service.name}: choose an option</h2>
              <ul className="mt-6 grid gap-3">
                {service.options.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOptionId(o.id);
                        setStart("");
                        setDays(null);
                        go(2);
                      }}
                      className={clsx(
                        "card card-hover flex w-full items-center justify-between gap-4 p-5 text-left",
                        optionId === o.id && "border-brand ring-2 ring-brand/30",
                      )}
                    >
                      <span>
                        <span className="block font-semibold text-night">{o.name}</span>
                        {o.description && <span className="block text-[0.88rem] text-muted">{o.description}</span>}
                      </span>
                      <span className="flex shrink-0 items-center gap-4 text-[0.88rem]">
                        {o.durationMin && (
                          <span className="inline-flex items-center gap-1 text-muted">
                            <Clock size={14} /> {o.durationMin} min
                          </span>
                        )}
                        <span className="font-bold text-brand">{o.price != null ? formatPrice("FIXED" as never, o.price) : priceText(null)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <BackButton onClick={() => go(0)} />
            </section>
          )}

          {/* 3. Date & time */}
          {step === 2 && service && (
            <section>
              <h2 className="font-display text-[1.6rem] font-extrabold text-night">Pick a date and time</h2>
              <p className="mt-1 text-muted">
                Visit length about {duration >= 60 ? `${Math.round((duration / 60) * 10) / 10} hr` : `${duration} min`}. Times shown in our local time.
              </p>

              {loading && !days && (
                <p className="mt-8 flex items-center gap-2 text-muted">
                  <Loader2 className="animate-spin" size={18} /> Checking availability…
                </p>
              )}
              {loadError && <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-800">{loadError}</p>}

              {days && days.length > 0 && (
                <>
                  <div className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-2" role="listbox" aria-label="Choose a date">
                    {days.map((d) => {
                      const has = d.slots.length > 0;
                      const sel = d.date === date;
                      const dt = ymdUtc(d.date);
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
                            "flex w-[4.6rem] shrink-0 flex-col items-center rounded-2xl border px-2 py-3 transition-all",
                            sel && "border-transparent bg-brand-gradient text-white shadow-lg shadow-brand/30",
                            !sel && has && "border-line bg-white text-night hover:border-brand hover:text-brand",
                            !has && "cursor-not-allowed border-dashed border-line bg-canvas-2 text-muted/50",
                          )}
                        >
                          <span className="text-[0.72rem] font-semibold uppercase tracking-wide opacity-80">{fmt.dayName.format(dt)}</span>
                          <span className="font-display text-[1.45rem] font-extrabold leading-tight">{fmt.dayNum.format(dt)}</span>
                          <span className="text-[0.7rem] opacity-80">{fmt.month.format(dt)}</span>
                          <span className={clsx("mt-1 h-1.5 w-1.5 rounded-full", has ? (sel ? "bg-white" : "bg-brand") : "bg-transparent")} />
                        </button>
                      );
                    })}
                  </div>

                  {day && day.slots.length > 0 ? (
                    <div className="mt-6 space-y-5">
                      {[
                        { label: "Morning", icon: Sun, list: morning },
                        { label: "Afternoon", icon: Sunset, list: afternoon },
                      ]
                        .filter((g) => g.list.length)
                        .map((g) => (
                          <div key={g.label}>
                            <p className="flex items-center gap-1.5 text-[0.82rem] font-semibold uppercase tracking-wide text-muted">
                              <g.icon size={15} /> {g.label}
                            </p>
                            <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                              {g.list.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setStart(s)}
                                  aria-pressed={start === s}
                                  className={clsx(
                                    "tabular rounded-xl border px-3 py-2.5 text-[0.92rem] font-semibold transition-all",
                                    start === s
                                      ? "border-transparent bg-brand-gradient text-white shadow-md shadow-brand/30"
                                      : "border-line bg-white text-night hover:-translate-y-0.5 hover:border-brand hover:text-brand",
                                  )}
                                >
                                  {fmt.time.format(new Date(s))}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    !loading && (
                      <p className="mt-6 rounded-xl bg-canvas-2 p-5 text-muted">
                        {days.some((d) => d.slots.length) ? "No times left on this day — try another date." : "No online times in the next 3 weeks. Please call us or request a quote."}
                      </p>
                    )
                  )}
                </>
              )}

              {slotGone && <ErrorNote text={state.message!} />}

              <div className="mt-8 flex items-center justify-between gap-3">
                <BackButton onClick={() => go(service.options.length ? 1 : 0)} inline />
                <button type="button" disabled={!start} onClick={() => go(3)} className={primaryBtn}>
                  Continue <ArrowRight size={18} />
                </button>
              </div>
            </section>
          )}

          {/* 4. Details */}
          {step === 3 && (
            <section>
              <h2 className="font-display text-[1.6rem] font-extrabold text-night">Your details</h2>
              <p className="mt-1 text-muted">So we can confirm the booking and find the property.</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Input label="Full name" value={details.name} onChange={(v) => setDetails({ ...details, name: v })} autoComplete="name" error={state.fieldErrors?.name} />
                <Input label="Phone" type="tel" value={details.phone} onChange={(v) => setDetails({ ...details, phone: v })} autoComplete="tel" error={state.fieldErrors?.phone} />
                <Input label="Email" type="email" value={details.email} onChange={(v) => setDetails({ ...details, email: v })} autoComplete="email" error={state.fieldErrors?.email} className="sm:col-span-2" />
                <Input label="Property address" value={details.address} onChange={(v) => setDetails({ ...details, address: v })} autoComplete="street-address" error={state.fieldErrors?.address} className="sm:col-span-2" />
                <label className="block">
                  <span className="text-[0.88rem] font-semibold text-night">Property type</span>
                  <select value={details.propertyType} onChange={(e) => setDetails({ ...details, propertyType: e.target.value })} className={input}>
                    <option value="">Select…</option>
                    <option>Single-family home</option>
                    <option>Multifamily / apartments</option>
                    <option>Vacant / bank-owned</option>
                    <option>Commercial / office</option>
                    <option>HOA common area</option>
                  </select>
                </label>
                <Input label="Access instructions (optional)" value={details.access} onChange={(v) => setDetails({ ...details, access: v })} placeholder="Lockbox, gate code, tenant…" />
                <label className="block sm:col-span-2">
                  <span className="text-[0.88rem] font-semibold text-night">Anything we should know? (optional)</span>
                  <textarea rows={4} value={details.notes} onChange={(e) => setDetails({ ...details, notes: e.target.value })} className={input} placeholder="e.g. Back door sticks, two loose stair railings…" />
                </label>
              </div>
              <div className="mt-8 flex items-center justify-between gap-3">
                <BackButton onClick={() => go(2)} inline />
                <button type="button" disabled={!detailsValid} onClick={() => go(4)} className={primaryBtn}>
                  Review booking <ArrowRight size={18} />
                </button>
              </div>
            </section>
          )}

          {/* 5. Confirm */}
          {step === 4 && service && start && (
            <section>
              <h2 className="font-display text-[1.6rem] font-extrabold text-night">Check and confirm</h2>
              <dl className="card mt-6 divide-y divide-line">
                {[
                  ["Service", `${service.name}${option ? ` — ${option.name}` : ""}`],
                  ["When", fmt.full.format(new Date(start))],
                  ["Price", option?.price != null ? formatPrice("FIXED" as never, option.price) : priceText(null)],
                  ["Name", details.name],
                  ["Contact", `${details.phone} · ${details.email}`],
                  ["Address", details.address],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-wrap justify-between gap-2 px-5 py-3.5">
                    <dt className="text-[0.88rem] text-muted">{k}</dt>
                    <dd className="text-right font-semibold text-night">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-[0.88rem] text-muted">
                {service.bookingMode === "INSTANT"
                  ? "Your time is confirmed as soon as you book. Free to cancel or reschedule up to 24 hours before."
                  : "We'll confirm this time by email or phone, usually the same business day."}
              </p>
              {state.status === "error" && !slotGone && <ErrorNote text={state.message!} />}
              {slotGone && (
                <div className="mt-4">
                  <ErrorNote text={state.message!} />
                  <button type="button" className="mt-3 font-semibold text-brand underline" onClick={() => { setStart(""); setDays(null); go(2); }}>
                    Choose another time
                  </button>
                </div>
              )}
              <div className="mt-8 flex items-center justify-between gap-3">
                <BackButton onClick={() => go(3)} inline />
                <button type="button" disabled={pending} onClick={submit} className={primaryBtn}>
                  {pending ? <Loader2 size={18} className="animate-spin" /> : <CalendarCheck size={18} />}
                  {pending ? "Booking…" : service.bookingMode === "INSTANT" ? "Confirm booking" : "Request this time"}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ── Summary sidebar ── */}
      <aside className="lg:col-span-4">
        <div className="card sticky top-24 overflow-hidden">
          <div className="bg-night px-5 py-4 text-white">
            <p className="text-[0.75rem] font-semibold uppercase tracking-wider text-brand-400">Your booking</p>
            <p className="mt-1 font-display text-[1.1rem] font-bold">{service ? service.name : "Choose a service"}</p>
          </div>
          <ul className="space-y-3 p-5 text-[0.92rem]">
            <SummaryRow icon={<CalendarCheck size={16} />} label={start ? fmt.full.format(new Date(start)) : "Date & time not chosen yet"} muted={!start} />
            {option && <SummaryRow icon={<Check size={16} />} label={option.name} />}
            <SummaryRow icon={<Clock size={16} />} label={service ? `About ${duration} minutes` : "—"} muted={!service} />
            {details.address && <SummaryRow icon={<MapPin size={16} />} label={details.address} />}
          </ul>
          <div className="border-t border-line bg-canvas-2 px-5 py-4 text-[0.82rem] text-muted">
            No payment now. You&apos;ll get a confirmation email with your booking reference.
          </div>
        </div>
      </aside>
    </div>
  );
}

const primaryBtn =
  "inline-flex items-center gap-2 rounded-full bg-brand-gradient px-6 py-3 font-semibold text-white shadow-[0_10px_30px_-10px_rgb(37_99_235/0.7)] transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45";

function BackButton({ onClick, inline }: { onClick: () => void; inline?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={clsx("inline-flex items-center gap-1.5 font-semibold text-muted hover:text-night", !inline && "mt-6")}>
      <ArrowLeft size={17} /> Back
    </button>
  );
}

function ErrorNote({ text }: { text: string }) {
  return (
    <p role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-[0.92rem] text-red-800">
      <AlertCircle size={18} className="mt-0.5 shrink-0" /> {text}
    </p>
  );
}

function SummaryRow({ icon, label, muted }: { icon: React.ReactNode; label: string; muted?: boolean }) {
  return (
    <li className={clsx("flex items-start gap-2.5", muted ? "text-muted" : "text-night")}>
      <span className="mt-0.5 text-brand">{icon}</span>
      {label}
    </li>
  );
}

function Input({
  label,
  value,
  onChange,
  error,
  className,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  className?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <label className={clsx("block", className)}>
      <span className="text-[0.88rem] font-semibold text-night">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={clsx(input, error && "border-red-500")} {...rest} />
      {error && <span className="mt-1 block text-[0.8rem] text-red-700">{error}</span>}
    </label>
  );
}
