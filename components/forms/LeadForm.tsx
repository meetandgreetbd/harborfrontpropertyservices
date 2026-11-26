"use client";

import { useActionState } from "react";
import clsx from "clsx";
import { CheckCircle2, Loader2, Send, ShieldCheck } from "lucide-react";
import { submitLead } from "@/app/actions/leads";
import type { LeadFormState } from "@/lib/validations/lead";

const initial: LeadFormState = { status: "idle" };

/** Client form. Use <QuoteForm> (server wrapper) so the service list comes from the database. */
export function LeadForm({
  kind = "estimate",
  defaultService,
  compact = false,
  withDate = false,
  serviceNames,
}: {
  kind?: "estimate" | "work-order";
  defaultService?: string;
  compact?: boolean;
  /** Ask for a preferred date (date only, no time) — used on service pages. */
  withDate?: boolean;
  serviceNames: string[];
}) {
  const [state, action, pending] = useActionState(submitLead, initial);
  const v = state.values ?? {};
  const err = (name: string) => state.fieldErrors?.[name]?.[0];

  if (state.status === "success") {
    return (
      <div
        role="status"
        // bring the confirmation into view (it can sit under the sticky header after submitting a long form)
        ref={(el) => el?.scrollIntoView({ block: "center", behavior: "smooth" })}
        className="border border-brand/60 bg-white p-8"
      >
        <CheckCircle2 className="text-brand-700" size={28} strokeWidth={1.5} aria-hidden="true" />
        <p className="mt-4 font-display text-2xl text-night">Request received.</p>
        <p className="mt-3 max-w-prose text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="space-y-5">
      <input type="hidden" name="kind" value={kind} />
      {/* Honeypot — hidden from people and screen readers */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.status === "error" && state.message && (
        <p role="alert" className="border-l-2 border-red-700 bg-red-50 px-4 py-3 text-[0.95rem] text-red-800">
          {state.message}
        </p>
      )}

      {kind === "work-order" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Company" name="company" error={err("company")} defaultValue={v.company} autoComplete="organization" required />
          <Field label="Loan / property / PO number" name="reference" defaultValue={v.reference} hint="Optional" />
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" name="name" error={err("name")} defaultValue={v.name} autoComplete="name" required />
        <Field label="Phone" name="phone" type="tel" error={err("phone")} defaultValue={v.phone} autoComplete="tel" required />
      </div>
      <Field label="Email" name="email" type="email" error={err("email")} defaultValue={v.email} autoComplete="email" required />
      <Field
        label="Property address"
        name="address"
        error={err("address")}
        defaultValue={v.address}
        autoComplete="street-address"
        required
      />

      <div className={clsx("grid gap-5", !compact && "sm:grid-cols-2")}>
        <SelectField label="Service" name="service" defaultValue={v.service ?? defaultService ?? ""}>
          <option value="">Not sure / several things</option>
          {serviceNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </SelectField>
        {kind === "estimate" ? (
          <SelectField label="Property type" name="propertyType" defaultValue={v.propertyType ?? ""}>
            <option value="">Select…</option>
            <option>Single-family home</option>
            <option>Multifamily / apartments</option>
            <option>Vacant / bank-owned</option>
            <option>Commercial / retail / office</option>
            <option>HOA common area</option>
          </SelectField>
        ) : (
          <Field label="Due date" name="dueDate" type="date" defaultValue={v.dueDate} hint="Optional" />
        )}
      </div>

      {withDate && kind === "estimate" && (
        <Field
          label="Preferred date"
          name="preferredDate"
          type="date"
          error={err("preferredDate")}
          defaultValue={v.preferredDate}
          hint="Optional — we'll confirm the arrival time"
        />
      )}

      {kind === "work-order" && (
        <Field
          label="Access instructions"
          name="access"
          defaultValue={v.access}
          hint="Lockbox code, gate code or tenant contact — optional"
        />
      )}

      <div>
        <label htmlFor="message" className="block text-[0.9rem] font-medium text-ink">
          {kind === "work-order" ? "Scope of work" : "What needs doing?"}
        </label>
        <textarea
          id="message"
          name="message"
          rows={compact ? 4 : 6}
          defaultValue={v.message}
          aria-invalid={!!err("message")}
          aria-describedby={err("message") ? "message-error" : undefined}
          className={inputClass(!!err("message"))}
          placeholder={
            kind === "work-order"
              ? "List each task, and any photo requirements."
              : "e.g. Tenant moved out — needs patch and paint in two bedrooms, new lock on the front door, and the carpet in the hall looked at."
          }
        />
        {err("message") && <FieldError id="message-error">{err("message")}</FieldError>}
      </div>

      <div className={clsx("flex flex-col gap-3 pt-2", !compact && "sm:flex-row sm:items-center sm:gap-5")}>
        <button
          type="submit"
          disabled={pending}
          className={clsx(
            "bg-brand-gradient group/btn inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-7 py-3.5 font-semibold text-white",
            "shadow-[0_10px_30px_-10px_rgb(37_99_235/0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-10px_rgb(37_99_235/0.9)]",
            "active:scale-[0.98] disabled:translate-y-0 disabled:opacity-60",
            compact ? "w-full" : "sm:w-auto",
          )}
        >
          {pending ? (
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          ) : (
            <Send size={17} className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" aria-hidden="true" />
          )}
          {pending ? "Sending…" : kind === "work-order" ? "Submit work order" : "Send request"}
        </button>
        <p className={clsx("flex items-center gap-1.5 text-[0.84rem] text-muted", compact && "justify-center")}>
          <ShieldCheck size={15} className="shrink-0 text-brand" aria-hidden="true" />
          Reply within one business day. No spam, ever.
        </p>
      </div>
    </form>
  );
}

function inputClass(invalid: boolean) {
  return clsx(
    "mt-1.5 block w-full rounded-[var(--radius-sm)] border bg-white px-3.5 py-3 text-[1rem] text-ink placeholder:text-muted/70",
    "focus:border-night focus:outline-none focus:ring-1 focus:ring-night",
    invalid ? "border-red-700" : "border-line",
  );
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-1.5 text-[0.85rem] text-red-800">
      {children}
    </p>
  );
}

function Field({
  label,
  name,
  type = "text",
  error,
  hint,
  required,
  ...rest
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  defaultValue?: string;
  autoComplete?: string;
}) {
  const describedBy = [hint && `${name}-hint`, error && `${name}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={name} className="flex items-baseline justify-between text-[0.9rem] font-medium text-ink">
        {label}
        {hint && (
          <span id={`${name}-hint`} className="text-[0.8rem] font-normal text-muted">
            {hint}
          </span>
        )}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={inputClass(!!error)}
        {...rest}
      />
      {error && <FieldError id={`${name}-error`}>{error}</FieldError>}
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-[0.9rem] font-medium text-ink">
        {label}
      </label>
      <select id={name} name={name} defaultValue={defaultValue} className={inputClass(false)}>
        {children}
      </select>
    </div>
  );
}
