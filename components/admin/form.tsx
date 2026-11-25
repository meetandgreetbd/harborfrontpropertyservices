"use client";

import { useState } from "react";
import clsx from "clsx";
import { CheckCircle2, AlertCircle } from "lucide-react";
import type { FormState } from "@/lib/validations/catalog";

/** Shared input style. Pass `size` (e.g. "w-72") for inline inputs; defaults to full width with a top margin. */
export const inputCls = (invalid?: boolean, size?: string) =>
  clsx(
    "block rounded-[3px] border bg-white px-3 py-2 text-[0.94rem] text-ink placeholder:text-muted/60",
    "focus:border-night focus:outline-none focus:ring-1 focus:ring-night",
    size ?? "mt-1.5 w-full",
    invalid ? "border-red-600" : "border-line",
  );

export function Card({ title, description, children, aside }: { title: string; description?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="border border-line bg-white">
      <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-sans text-[1rem] font-semibold text-night">{title}</h2>
          {description && <p className="mt-0.5 text-[0.85rem] text-muted">{description}</p>}
        </div>
        {aside}
      </header>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}

export function Label({ htmlFor, children, hint }: { htmlFor: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-3 text-[0.85rem] font-medium text-ink">
      <span>{children}</span>
      {hint && <span className="text-[0.78rem] font-normal text-muted">{hint}</span>}
    </label>
  );
}

export function ErrorText({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1 text-[0.8rem] text-red-700">{children}</p>;
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; error?: string; hint?: React.ReactNode };

export function Field({ label, name, id, error, hint, className, ...rest }: InputProps) {
  const fieldId = id ?? name;
  return (
    <div className={className}>
      <Label htmlFor={fieldId} hint={hint}>
        {label}
      </Label>
      <input id={fieldId} name={name} aria-invalid={!!error} className={inputCls(!!error)} {...rest} />
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

type AreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; name: string; error?: string; hint?: React.ReactNode };

export function TextArea({ label, name, id, error, hint, className, rows = 4, ...rest }: AreaProps) {
  const fieldId = id ?? name;
  return (
    <div className={className}>
      <Label htmlFor={fieldId} hint={hint}>
        {label}
      </Label>
      <textarea id={fieldId} name={name} rows={rows} aria-invalid={!!error} className={inputCls(!!error)} {...rest} />
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; name: string; error?: string; hint?: React.ReactNode };

export function Select({ label, name, id, error, hint, className, children, ...rest }: SelectProps) {
  const fieldId = id ?? name;
  return (
    <div className={className}>
      <Label htmlFor={fieldId} hint={hint}>
        {label}
      </Label>
      <select id={fieldId} name={name} aria-invalid={!!error} className={inputCls(!!error)} {...rest}>
        {children}
      </select>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

/** Accessible on/off switch backed by a real checkbox (submits "on" when checked). */
export function Toggle({
  name,
  label,
  description,
  defaultChecked,
  checked,
  onChange,
  tone = "default",
}: {
  name?: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (v: boolean) => void;
  tone?: "default" | "warning";
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-[0.9rem] font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-[0.8rem] text-muted">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          checked={checked}
          onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
          className="peer sr-only"
        />
        <span
          className={clsx(
            "h-6 w-11 rounded-full bg-line transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-night peer-focus-visible:ring-offset-2",
            tone === "warning" ? "peer-checked:bg-amber-600" : "peer-checked:bg-night",
          )}
        />
        <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

/** Live character counter: green in the recommended range, amber outside it. */
function Counter({ length, ideal: [lo, hi] }: { length: number; ideal: [number, number] }) {
  const good = length >= lo && length <= hi;
  return (
    <span className={clsx("tabular", length === 0 ? "text-muted" : good ? "text-emerald-700" : "text-amber-700")}>
      {length} / {hi} {length > 0 && !good && (length < lo ? "· a bit short" : "· may be cut off in Google")}
    </span>
  );
}

/**
 * SEO panel: meta title + description with counters, Google preview, and index/noindex switch.
 * Field names: metaTitle, metaDescription, noIndex (override with props for other forms).
 */
export function SeoPanel({
  path,
  defaultTitle,
  defaultDescription,
  title: initialTitle,
  description: initialDescription,
  noIndex: initialNoIndex,
  errors,
  names = { title: "metaTitle", description: "metaDescription", noIndex: "noIndex" },
  siteName = "Harborfront Property Services",
}: {
  path: string;
  defaultTitle: string;
  defaultDescription: string;
  title: string;
  description: string;
  noIndex: boolean;
  errors?: Record<string, string>;
  names?: { title: string; description: string; noIndex: string };
  siteName?: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [noIndex, setNoIndex] = useState(initialNoIndex);
  const shownTitle = `${title || defaultTitle}${path === "/" ? "" : ` | ${siteName}`}`;
  const shownDescription = description || defaultDescription;

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor={names.title} hint={<Counter length={title.length} ideal={[30, 60]} />}>
          Meta title
        </Label>
        <input
          id={names.title}
          name={names.title}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={defaultTitle}
          maxLength={120}
          className={inputCls(!!errors?.[names.title])}
        />
        <p className="mt-1 text-[0.78rem] text-muted">Leave empty to use the default shown in grey. Aim for 30–60 characters.</p>
        <ErrorText>{errors?.[names.title]}</ErrorText>
      </div>

      <div>
        <Label htmlFor={names.description} hint={<Counter length={description.length} ideal={[70, 160]} />}>
          Meta description
        </Label>
        <textarea
          id={names.description}
          name={names.description}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={defaultDescription}
          maxLength={200}
          rows={3}
          className={inputCls(!!errors?.[names.description])}
        />
        <p className="mt-1 text-[0.78rem] text-muted">Shown under the title in Google. Aim for 70–160 characters.</p>
        <ErrorText>{errors?.[names.description]}</ErrorText>
      </div>

      {/* Google-style preview */}
      <div className="rounded-[3px] border border-line bg-canvas/40 p-4">
        <p className="text-[0.72rem] uppercase tracking-wide text-muted">Google preview</p>
        {noIndex ? (
          <p className="mt-2 text-[0.9rem] text-amber-800">Hidden from search engines (noindex).</p>
        ) : (
          <div className="mt-2 font-[arial,sans-serif]">
            <p className="truncate text-[0.8rem] text-[#202124]">harborfrontpropertyservices.com{path === "/" ? "" : ` › ${path.split("/").filter(Boolean).join(" › ")}`}</p>
            <p className="mt-0.5 truncate text-[1.15rem] leading-snug text-[#1a0dab]">{shownTitle}</p>
            <p className="mt-0.5 line-clamp-2 text-[0.85rem] leading-snug text-[#4d5156]">{shownDescription}</p>
          </div>
        )}
      </div>

      <div className="border-t border-line pt-4">
        <Toggle
          name={names.noIndex}
          label="Hide from search engines (noindex)"
          description="When on, Google won't list this page and it's removed from the sitemap. Visitors can still open it."
          checked={noIndex}
          onChange={setNoIndex}
          tone="warning"
        />
      </div>
    </div>
  );
}

/** Sticky save bar with the result of the last save. */
export function SaveBar({
  state,
  pending,
  label = "Save changes",
  icon,
  secondary,
  extra,
}: {
  state: FormState;
  pending: boolean;
  label?: string;
  icon?: React.ReactNode;
  secondary?: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-6 flex flex-wrap items-center gap-3 border-t border-line bg-white/95 px-6 py-3 backdrop-blur md:-mx-10 md:px-10">
      <button
        type="submit"
        value="publish"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-[3px] bg-night px-5 py-2.5 font-medium text-canvas hover:bg-night-600 disabled:opacity-60"
      >
        {icon}
        {pending ? "Saving…" : label}
      </button>
      {secondary}
      {state.status === "saved" && (
        <span role="status" className="inline-flex items-center gap-1.5 text-[0.88rem] text-emerald-700">
          <CheckCircle2 size={16} /> {state.message}
        </span>
      )}
      {state.status === "error" && (
        <span role="alert" className="inline-flex items-center gap-1.5 text-[0.88rem] text-red-700">
          <AlertCircle size={16} /> {state.message}
        </span>
      )}
      <div className="ml-auto">{extra}</div>
    </div>
  );
}
